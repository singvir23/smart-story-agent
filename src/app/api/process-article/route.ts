// src/app/api/process-article/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import fetch from 'node-fetch'; // Or use built-in fetch if your Node version supports it reliably

// Define the structure Claude should return
interface ExpectedClaudeResponse {
    title: string;
    source: string;
    date: string;
    summary: string;
    highlights: string[];
    factSections: Array<{
        title: string; // Titles will now be dynamic
        content: string;
    }>;
}

// Define interfaces for data structure (shared with frontend is ideal)
interface FactSection {
    id: string;
    title: string;
    content: string;
}

interface StoryData {
    title: string;
    source: string;
    date: string;
    summary: string;
    highlights: string[];
    factSections: FactSection[];
    imageUrl?: string | null; // Include optional imageUrl
}

// Helper to generate simple IDs
const generateId = (title: string): string => {
    // Generate ID based on the title Claude provided
    return title.toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^\w-]+/g, '') // Remove all non-word chars except hyphen
        .replace(/--+/g, '-') // Replace multiple hyphens with single
        .replace(/^-+/, '') // Trim hyphens from start
        .replace(/-+$/, ''); // Trim hyphens from end
};

// API Key Check (Crucial for serverless functions where env might not be loaded on import)
function getAnthropicClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.error("ANTHROPIC_API_KEY environment variable is not set.");
        throw new Error("Server configuration error: API key missing."); // Throw error to stop processing
    }
    return new Anthropic({ apiKey });
}

// JSON Cleanup Function
function cleanupJsonString(rawJson: string): string {
    let cleaned = rawJson;

    try { while (/\\\'/.test(cleaned)) { cleaned = cleaned.replace(/\\'/g, "'"); } } catch (e) { console.error("Error during \\' cleanup:", e); }
    try { cleaned = cleaned.replace(/(?<!\\)\\(\s)/g, '$1'); } catch (e) { console.error("Error during \\s cleanup:", e); }
    // Add more specific replacements here based on future error logs if needed
    return cleaned;
}


// POST function
export async function POST(req: Request) {
    let anthropicClient;
    try {
        // Initialize client here to catch API key error early
        anthropicClient = getAnthropicClient();

        const body = await req.json();
        const { articleUrl } = body;

        if (!articleUrl || typeof articleUrl !== 'string') {
            return NextResponse.json({ error: 'Article URL is required' }, { status: 400 });
        }
        // FIX 1: Remove unused '_' variable from catch
        try { new URL(articleUrl); } catch {
            return NextResponse.json({ error: 'Invalid URL format provided' }, { status: 400 });
        }

        console.log(`Processing URL: ${articleUrl}`);

        // --- Step 1: Fetch and Extract Article Content ---
        let articleText = '';
        let inferredSource = '';
        let fetchedTitle = '';
        let scrapedImageUrl: string | null = null;
        let scrapedDate: string | null = null;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const response = await fetch(articleUrl, {
                headers: {
                    'User-Agent': 'SmartStorySuiteBot/1.0 (+https://your-domain.com/bot-info)', // Replace with your info
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error(`Fetch failed for ${articleUrl} with status ${response.status} ${response.statusText}`);
                throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('text/html')) {
                console.warn(`Content type for ${articleUrl} is not HTML (${contentType}). Attempting parse anyway.`);
            }

            const html = await response.text();
            const doc = new JSDOM(html, { url: articleUrl }); // Provide base URL to JSDOM

            // --- Metadata Scraping (WITH IMPROVED IMAGE URL HANDLING) ---
            try {
                const imageTag = doc.window.document.querySelector('meta[property="og:image"]');
                // FIX 2: Use const as potentialImageUrl is not reassigned
                const potentialImageUrl = imageTag?.getAttribute('content') || null;

                if (potentialImageUrl) {
                    console.log(`DEBUG: Found og:image content: "${potentialImageUrl}"`);
                    try {
                        // Use URL constructor to validate and potentially resolve relative paths
                        // The second argument (articleUrl) acts as the base if potentialImageUrl is relative
                        const absoluteUrl = new URL(potentialImageUrl, articleUrl).toString();

                        // Basic check to ensure it's http or https after resolution
                        const urlObj = new URL(absoluteUrl); // Parse the potentially resolved URL
                         if (['http:', 'https:'].includes(urlObj.protocol)) {
                             scrapedImageUrl = absoluteUrl;
                             console.log(`DEBUG: Validated/Resolved image URL: ${scrapedImageUrl}`);
                         } else {
                             console.warn(`DEBUG: Resolved URL "${absoluteUrl}" has non-http(s) protocol (${urlObj.protocol}). Discarding.`);
                             scrapedImageUrl = null;
                         }
                    } catch (urlError: unknown) {
                        // Handle cases where potentialImageUrl is not a valid URL fragment or absolute URL
                        console.warn(`DEBUG: Could not parse or resolve og:image content "${potentialImageUrl}" as a valid URL. Error:`, urlError instanceof Error ? urlError.message : urlError);
                        scrapedImageUrl = null;
                    }
                } else {
                    console.log(`DEBUG: No og:image meta tag found for ${articleUrl}.`);
                    scrapedImageUrl = null;
                }


                // --- Date Scraping (Keep as before) ---
                const dateTag = doc.window.document.querySelector('meta[property="article:published_time"]')
                                || doc.window.document.querySelector('meta[name="date"]')
                                || doc.window.document.querySelector('meta[name="pubdate"]')
                                || doc.window.document.querySelector('meta[name="timestamp"]')
                                || doc.window.document.querySelector('time[datetime]');

                scrapedDate = dateTag?.getAttribute('content') || dateTag?.getAttribute('datetime') || null;
                console.log(`DEBUG: Scraped date tag/attribute (raw): ${scrapedDate}`);

                if (scrapedDate) {
                    try {
                         const parsed = new Date(scrapedDate);
                         if (!isNaN(parsed.getTime())) {
                            scrapedDate = parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                            console.log(`DEBUG: Formatted scraped date: ${scrapedDate}`);
                         } else {
                            console.warn(`DEBUG: Could not parse scraped date "${scrapedDate}" into valid Date object. Keeping raw.`);
                         }
                    } catch (dateError: unknown) {
                        console.warn(`DEBUG: Error during date parsing/formatting for "${scrapedDate}":`, dateError);
                    }
                }
            } catch (metaError: unknown) {
                console.error("DEBUG: Error scraping meta tags:", metaError);
                // Ensure image url is nullified if there was an error during scraping block
                scrapedImageUrl = null;
            }
            // --- End Metadata Scraping ---

            // --- Readability ---
            const reader = new Readability(doc.window.document);
            const article = reader.parse();

            if (!article || !article.textContent || article.textContent.trim().length < 150) {
                 const bodyText = doc.window.document.body?.textContent?.trim();
                 if (bodyText && bodyText.length > 150) {
                     console.warn(`Readability failed or content too short for ${articleUrl}. Falling back to body text.`);
                     articleText = bodyText;
                     fetchedTitle = doc.window.document.title || 'Title not found';
                     inferredSource = new URL(articleUrl).hostname;
                 } else {
                    console.error(`Could not extract meaningful content for ${articleUrl} using Readability or body fallback.`);
                    throw new Error('Could not extract sufficient article content.');
                 }
            } else {
                articleText = article.textContent.trim();
                fetchedTitle = article.title || doc.window.document.title || 'Title not found';
                inferredSource = article.siteName || new URL(articleUrl).hostname;
                console.log(`Successfully extracted ~${articleText.length} characters via Readability.`);
            }
             console.log(`DEBUG: Using Title='${fetchedTitle}', Source='${inferredSource}', ScrapedDate='${scrapedDate}', ScrapedImage='${scrapedImageUrl}'`);

        } catch (fetchError: unknown) {
            console.error(`Error fetching or parsing article (${articleUrl}):`, fetchError);
            let message = 'An unknown fetch/parse error occurred.';
            if(fetchError instanceof Error) {
                message = `Failed to fetch or parse article: ${fetchError.message}`;
                if (fetchError.name === 'AbortError') {
                   return NextResponse.json({ error: 'Failed to fetch article: The request timed out.' }, { status: 504 });
                }
            }
            return NextResponse.json({ error: message }, { status: 500 });
        }

        if (articleText.length < 150) {
           console.warn(`Final extracted content for ${articleUrl} is very short (${articleText.length} chars). Analysis quality might be low.`);
        }


        // --- Step 2: Prepare Prompt for Claude ---
        const maxChars = 150000;
        const truncatedArticleText = articleText.length > maxChars ? articleText.substring(0, maxChars) + "\n[... content truncated ...]" : articleText;
        const prompt = `Analyze the following article text and provide a structured summary IN VALID JSON format ONLY.

Context:
Article Source (if known): ${inferredSource}
Article Title (if known): ${fetchedTitle}
Article Date (if scraped): ${scrapedDate || 'Not found by scraper'}

--- ARTICLE TEXT START ---
${truncatedArticleText}
--- ARTICLE TEXT END ---

Your task is to act as a meticulous JSON generation service. Based *only* on the text provided above, respond ONLY with a single, valid JSON object adhering strictly to the structure below. DO NOT include any introductory text, explanations, apologies, markdown formatting (like \`\`\`json), or closing remarks before or after the JSON object.

JSON Structure:
{
  "title": "(string) The main title of the article. Infer from the text or use '${fetchedTitle}' if accurate.",
  "source": "(string) The source publication or website. Use '${inferredSource}' or refine based *only* on the text.",
  "date": "(string) The publication date *explicitly mentioned* in the article text (e.g., "April 9, 2025", "last Tuesday"). If found, use that formatted as 'Month Day, Year'. If not explicitly mentioned in the text but a date was scraped ('${scrapedDate || 'None'}'), use the scraped date string provided. Otherwise, use the string 'Date not specified'.",
  "summary": "(string) A concise, neutral summary of the article's main points (2-4 sentences maximum).",
  "highlights": "(array of strings) Exactly 4 key, distinct takeaways or factual highlights directly supported by the article text. If 4 distinct highlights cannot be found, provide as many as possible up to 4. Each highlight should be a concise sentence.",
  "factSections": "(array of objects) <<< IMPORTANT: Generate this dynamically based on content. >>>
      1. Identify 3 to 5 distinct, significant sub-topics, themes, or key aspects discussed within the article text.
      2. For each identified sub-topic, create an object in this array.
      3. Each object MUST have:
         - "title": "(string) A concise, descriptive title for the specific sub-topic identified (e.g., "Rose Development Details", "Market Availability and Pricing", "Stewart's Involvement", "Scent Profile Comparison"). Titles should be specific to the article's content, NOT generic like "Introduction", "Key Points", "Conclusion", "Background".
         - "content": "(string) Summary (1-3 sentences) relevant ONLY to this section title. <<< CRITICAL: Ensure this string value is valid JSON. Escape ALL necessary characters: double quotes must be \\", backslashes must be \\\\, newlines must be \\n, etc. Do NOT escape single quotes ('). >>>"
      4. If fewer than 3 distinct, significant sub-topics can be reasonably identified from the text, provide only those that are found. Do not force sections or invent information. Omit this entire 'factSections' array only if the article is extremely short or lacks any distinct sub-topics."
}

Critical JSON Rules & Escaping Guide:
1.  **OUTPUT JSON ONLY:** Start with '{', end with '}', nothing else.
2.  **VALID SYNTAX:** Use double quotes for all keys and string values. Ensure correct commas (no trailing commas). Match brackets/braces.
3.  **MANDATORY ESCAPING inside STRING values:**
    *   Double Quote (") MUST become \\"
    *   Backslash (\\) MUST become \\\\
    *   Newline MUST become \\n
    *   Carriage Return MUST become \\r
    *   Tab MUST become \\t
    *   Backspace MUST become \\b
    *   Form Feed MUST become \\f
4.  **DO NOT ESCAPE:** Do NOT escape single quotes ('). Leave them as is within strings. Do NOT create invalid sequences like \\' or \\s.
5.  **STICK TO STRUCTURE:** Use the exact field names and types specified.
6.  **BASE ON TEXT ONLY:** Do not add external information. Follow instructions for missing data.`;


        // --- Step 3: Call Claude API ---
        console.log(`Sending request to Claude API for ${articleUrl}. Prompt length: ~${prompt.length} chars`);
        const claudeResponse = await anthropicClient.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 3500,
            system: "You are an expert data extraction tool. Your sole purpose is to return valid, correctly formatted JSON based precisely on the user's instructions and the provided text. You output ONLY the JSON object requested, nothing else. Ensure all special characters within JSON string values are properly escaped according to JSON specification.",
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
        });
        console.log(`Received response from Claude API for ${articleUrl}. Output tokens: ${claudeResponse.usage.output_tokens}`);

        // --- Step 4: Parse Claude's Response ---
        if (!claudeResponse.content || claudeResponse.content.length === 0 || claudeResponse.content[0].type !== 'text' || !claudeResponse.content[0].text) {
             console.error('Unexpected or empty response structure from Claude API:', JSON.stringify(claudeResponse));
             throw new Error('Received an unexpected or empty response from the analysis service.');
        }
        const rawJsonString = claudeResponse.content[0].text.trim();

        let extractedJson = rawJsonString;
        let cleanedJsonString = rawJsonString;
        let parsedData: ExpectedClaudeResponse;

        try {
            const jsonStart = rawJsonString.indexOf('{');
            const jsonEnd = rawJsonString.lastIndexOf('}');

            if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
                 console.error('Could not find valid JSON object delimiters { } in Claude response. Raw Response:', rawJsonString);
                throw new Error('Analysis service response did not contain recognizable JSON object delimiters.');
            }
            extractedJson = rawJsonString.substring(jsonStart, jsonEnd + 1);

            cleanedJsonString = cleanupJsonString(extractedJson);
            if (cleanedJsonString !== extractedJson) {
                console.log("DEBUG: Applied cleanup transformations to JSON string.");
            }

            parsedData = JSON.parse(cleanedJsonString);
            console.log(`Successfully parsed Claude JSON response for ${articleUrl} (after cleanup).`);

        } catch (parseError: unknown) {
            console.error(`Error parsing Claude JSON response for ${articleUrl}:`, parseError);
            console.error('--- Raw Claude response string ---');
            console.error(rawJsonString);
            console.error('--- Extracted JSON string (before cleanup) ---');
            console.error(extractedJson);
            console.error('--- Cleaned JSON string (attempted fix) ---');
            console.error(cleanedJsonString);
            console.error('--- End Logs ---');

            let errorMessage = 'Failed to process the analysis service response (JSON parse error).';
             if (parseError instanceof Error) {
                errorMessage = parseError.message.includes('position')
                   ? parseError.message
                   : `Failed to process the analysis service response (JSON parse error): ${parseError.message}`;
            }
            throw new Error(errorMessage);
        }

        // --- Step 5: Format data for Frontend ---
        const storyData: StoryData = {
            title: parsedData.title || fetchedTitle,
            source: parsedData.source || inferredSource,
            date: parsedData.date, // Use date parsed/formatted by Claude or scraped
            summary: parsedData.summary,
            highlights: Array.isArray(parsedData.highlights) ? parsedData.highlights : [],
            imageUrl: scrapedImageUrl, // Use the potentially resolved scrapedImageUrl
            factSections: Array.isArray(parsedData.factSections)
                ? parsedData.factSections.map(section => ({
                    ...section,
                    id: generateId(section.title)
                  }))
                : [],
        };

        console.log(`DEBUG: Final storyData (dynamic sections) for ${articleUrl}: Title='${storyData.title}', Date='${storyData.date}', Image='${storyData.imageUrl}', Highlights=${storyData.highlights.length}, Sections=${storyData.factSections.length}`);
        if (storyData.factSections.length > 0) {
            console.log(`DEBUG: Generated Section Titles: ${storyData.factSections.map(s => s.title).join('; ')}`);
        }


        // --- Step 6: Send Response to Frontend ---
        return NextResponse.json(storyData, { status: 200 });

    } catch (error: unknown) {
        console.error(`Critical Error in POST /api/process-article for URL ${req?.url || 'unknown'}:`, error);
        let message = 'An internal server error occurred.';
        if (error instanceof Error) {
             message = error.message;
        }
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// --- GET Handler ---
// FIX 3: Prefix unused 'req' parameter with '_'
export async function GET(_req: Request) {
    try {
        getAnthropicClient();
         return NextResponse.json({ message: "API route active. API key seems configured. Use POST to process an article." });
    } catch(error: unknown) {
         let message = 'API route active, but encountered an error.';
         if (error instanceof Error) {
             message = `API route active, but config error: ${error.message}. Use POST to process an article.`;
         }
         return NextResponse.json({ message }, { status: 500 });
    }
}