// src/app/api/process-article/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import fetch from 'node-fetch'; // Or use built-in fetch if your Node version supports it reliably

// --- Interfaces ---

// Define the structure for the SPICE score Claude should return
interface SpiceScoreClaudeResponse {
    s: number; // Scannability score (1-5)
    p: number; // Personalization score (1-5)
    i: number; // Interactivity score (1-5)
    c: number; // Curation score (1-5)
    e: number; // Emotion score (1-5)
    total: number; // Total score (sum of S, P, I, C, E)
    justifications: { // Brief justifications for each score
        scannability: string;
        personalization: string;
        interactivity: string;
        curation: string;
        emotion: string;
    };
}

// Define the structure Claude should return (including SPICE)
interface ExpectedClaudeResponse {
    title: string;
    source: string;
    date: string;
    summary: string;
    highlights: string[];
    factSections: Array<{
        title: string; // Titles will now be dynamic
        content: string; // This will now be chunks of original text
    }>;
    spiceScore: SpiceScoreClaudeResponse | null; // Added SPICE score object
}

// Define interfaces for data structure (shared with frontend is ideal)
interface FactSection {
    id: string;
    title: string;
    content: string;
}

// Interface for SPICE score data passed to frontend
interface SpiceScoreData {
    s: number;
    p: number;
    i: number;
    c: number;
    e: number;
    total: number;
    // justifications?: { scannability: string; personalization: string; etc... };
}

interface StoryData {
    title: string;
    source: string;
    author?: string | null;
    date: string;
    summary: string;
    highlights: string[];
    factSections: FactSection[];
    imageUrl?: string | null;
    imageUrls?: string[];
    originalUrl: string;
    spiceScore: SpiceScoreData | null; // Added SPICE score object
}

// Helper to generate simple IDs
const generateId = (title: string): string => {
    return title.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

// API Key Check
function getAnthropicClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.error("ANTHROPIC_API_KEY environment variable is not set.");
        throw new Error("Server configuration error: API key missing.");
    }
    return new Anthropic({ apiKey });
}

// JSON Cleanup Function
function cleanupJsonString(rawJson: string): string {
    let cleaned = rawJson;
    try { while (/\\\'/.test(cleaned)) { cleaned = cleaned.replace(/\\'/g, "'"); } } catch (e) { console.error("Error during \\' cleanup:", e); }
    try { cleaned = cleaned.replace(/(?<!\\)\\(\s)/g, '$1'); } catch (e) { console.error("Error during \\s cleanup:", e); }
    return cleaned;
}


// POST function
export async function POST(req: Request) {
    let anthropicClient;
    let originalUrl = '';

    try {
        anthropicClient = getAnthropicClient();
        const body = await req.json();
        const { articleUrl } = body;
        originalUrl = articleUrl;

        if (!articleUrl || typeof articleUrl !== 'string') {
            return NextResponse.json({ error: 'Article URL is required' }, { status: 400 });
        }
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
        let scrapedAuthor: string | null = null;
        let additionalImageUrls: string[] = [];

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(articleUrl, {
                headers: {
                    'User-Agent': 'SmartStorySuiteBot/1.0 (+https://your-domain.com/bot-info)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error(`Fetch failed for ${articleUrl} with status ${response.status} ${response.statusText}`);
                 if (response.status === 403) throw new Error(`Failed to fetch article: Access denied (403). The site may block automated requests.`);
                 if (response.status === 404) throw new Error(`Failed to fetch article: Not Found (404). Check the URL.`);
                 throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('text/html')) {
                console.warn(`Content type for ${articleUrl} is not HTML (${contentType}). Attempting parse anyway.`);
            }

            const html = await response.text();
            const doc = new JSDOM(html, { url: articleUrl });

            // --- Metadata Scraping ---
            try {
                const imageTag = doc.window.document.querySelector('meta[property="og:image"]');
                const potentialImageUrl = imageTag?.getAttribute('content') || null;
                if (potentialImageUrl) {
                     try {
                        const absoluteUrl = new URL(potentialImageUrl, articleUrl).toString();
                        const urlObj = new URL(absoluteUrl);
                         if (['http:', 'https:'].includes(urlObj.protocol)) {
                             scrapedImageUrl = absoluteUrl;
                             console.log(`DEBUG: Validated/Resolved primary image URL: ${scrapedImageUrl}`);
                         } else {
                             console.warn(`DEBUG: Resolved URL "${absoluteUrl}" has non-http(s) protocol (${urlObj.protocol}). Discarding.`);
                             scrapedImageUrl = null;
                         }
                    } catch (urlError: unknown) {
                        console.warn(`DEBUG: Could not parse or resolve og:image content "${potentialImageUrl}" as a valid URL. Error:`, urlError instanceof Error ? urlError.message : urlError);
                        scrapedImageUrl = null;
                    }
                } else {
                     console.log(`DEBUG: No og:image meta tag found for ${articleUrl}.`);
                     scrapedImageUrl = null;
                }

                const dateTag = doc.window.document.querySelector('meta[property="article:published_time"]')
                                 || doc.window.document.querySelector('meta[name="date"]')
                                 || doc.window.document.querySelector('meta[name="pubdate"]')
                                 || doc.window.document.querySelector('meta[name="timestamp"]')
                                 || doc.window.document.querySelector('time[datetime]');
                scrapedDate = dateTag?.getAttribute('content') || dateTag?.getAttribute('datetime') || null;
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

                const authorTag = doc.window.document.querySelector('meta[name="author"]')
                                || doc.window.document.querySelector('meta[property="article:author"]')
                                || doc.window.document.querySelector('meta[name="article:author"]')
                                || doc.window.document.querySelector('meta[property="book:author"]');
                 scrapedAuthor = authorTag?.getAttribute('content') || null;
                 if (scrapedAuthor) {
                    scrapedAuthor = scrapedAuthor.trim();
                    if (scrapedAuthor.toLowerCase().startsWith('by ')) {
                         scrapedAuthor = scrapedAuthor.substring(3).trim();
                     }
                    console.log(`DEBUG: Scraped author from meta tag: ${scrapedAuthor}`);
                 } else {
                    console.log(`DEBUG: No standard author meta tag found for ${articleUrl}.`);
                 }

            } catch (metaError: unknown) {
                console.error("DEBUG: Error scraping meta tags:", metaError);
                 scrapedImageUrl = null;
                 scrapedAuthor = null;
                 scrapedDate = null;
            }
            // --- End Metadata Scraping ---

            // --- Readability ---
            const reader = new Readability(doc.window.document.cloneNode(true) as Document);
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
                if (!scrapedAuthor && article.byline) {
                    scrapedAuthor = article.byline.replace(/^by\s+/i, '').trim();
                    console.log(`DEBUG: Using author from Readability byline: ${scrapedAuthor}`);
                }
                console.log(`Successfully extracted ~${articleText.length} characters via Readability.`);

                // --- Extract Images from Readability Content ---
                if (article.content) {
                    try {
                        const contentDom = new JSDOM(`<body>${article.content}</body>`, { url: articleUrl });
                        const imagesInContent = contentDom.window.document.querySelectorAll('img');
                        const seenUrls = new Set<string>();
                        if (scrapedImageUrl) {
                            seenUrls.add(scrapedImageUrl);
                        }

                        console.log(`DEBUG: Found ${imagesInContent.length} <img> tags within Readability content.`);

                        imagesInContent.forEach(img => {
                            const src = img.getAttribute('src');
                            const width = parseInt(img.getAttribute('width') || '0');
                            const height = parseInt(img.getAttribute('height') || '0');

                            if (src) {
                                try {
                                    const absoluteSrc = new URL(src, articleUrl).toString();
                                    const urlObj = new URL(absoluteSrc);
                                    const MIN_DIMENSION = 50;
                                    const isLikelyContent = (width === 0 && height === 0) || width >= MIN_DIMENSION || height >= MIN_DIMENSION;

                                    if (['http:', 'https:'].includes(urlObj.protocol) && !seenUrls.has(absoluteSrc) && isLikelyContent) {
                                         additionalImageUrls.push(absoluteSrc);
                                         seenUrls.add(absoluteSrc);
                                    }
                                } catch (urlError) {
                                    console.warn(`DEBUG: Could not parse or resolve image src "${src}" within content. Error:`, urlError instanceof Error ? urlError.message : urlError);
                                }
                            }
                        });
                         const MAX_ADDITIONAL_IMAGES = 10;
                         if (additionalImageUrls.length > MAX_ADDITIONAL_IMAGES) {
                             additionalImageUrls = additionalImageUrls.slice(0, MAX_ADDITIONAL_IMAGES);
                             console.log(`DEBUG: Limited additional images to ${MAX_ADDITIONAL_IMAGES}.`);
                         }
                         console.log(`DEBUG: Added ${additionalImageUrls.length} valid additional image URLs.`);

                    } catch(contentParseError) {
                        console.error("DEBUG: Error parsing Readability article.content HTML:", contentParseError);
                    }
                }
                // --- END: Extract Images ---
            }
             console.log(`DEBUG: Using Title='${fetchedTitle}', Source='${inferredSource}', Author='${scrapedAuthor || 'N/A'}', Date='${scrapedDate || 'N/A'}', PrimaryImage='${scrapedImageUrl || 'N/A'}', AdditionalImages=${additionalImageUrls.length}`);

        } catch (fetchError: unknown) {
            console.error(`Error fetching or parsing article (${articleUrl}):`, fetchError);
            let message = 'An unknown fetch/parse error occurred.';
            if(fetchError instanceof Error) {
                message = fetchError.message;
                if (fetchError.name === 'AbortError') {
                   return NextResponse.json({ error: 'Failed to fetch article: The request timed out.' }, { status: 504 });
                }
            }
            return NextResponse.json({ error: message }, { status: 500 });
        }

        if (articleText.length < 150) {
           console.warn(`Final extracted content for ${articleUrl} is very short (${articleText.length} chars). Analysis quality might be low.`);
        }


        // --- Step 2: Prepare Prompt for Claude (with SPICE scoring) ---
        const maxChars = 150000; // Claude's context window is larger, but keep this for cost/performance if needed
        const truncatedArticleText = articleText.length > maxChars ? articleText.substring(0, maxChars) + "\n[... content truncated ...]" : articleText;

        // *** THIS IS THE MODIFIED PROMPT ***
        const prompt = `Analyze the following article text and provide a structured summary AND a SPICE score IN VALID JSON format ONLY.

Context:
Article Source (if known): ${inferredSource}
Article Title (if known): ${fetchedTitle}
Article Date (if scraped): ${scrapedDate || 'Not found by scraper'}
Article Author (if scraped): ${scrapedAuthor || 'Not found by scraper'}

--- ARTICLE TEXT START ---
${truncatedArticleText}
--- ARTICLE TEXT END ---

Your task is to act as a meticulous JSON generation service. Based *only* on the text provided above, respond ONLY with a single, valid JSON object adhering strictly to the structure below. DO NOT include any introductory text, explanations, apologies, markdown formatting (like \`\`\`json), or closing remarks before or after the JSON object.

JSON Structure:
{
  "title": "(string) The main title of the article. Infer from the text or use '${fetchedTitle}' if accurate.",
  "source": "(string) The source publication or website. Use '${inferredSource}' or refine based *only* on the text.",
  "date": "(string) The publication date *explicitly mentioned* in the article text (e.g., "April 9, 2025", "last Tuesday"). If found, use that formatted as 'Month Day, Year'. If not explicitly mentioned in the text but a date was scraped ('${scrapedDate || 'None'}'), use the scraped date string provided. Only include a date if it was published in the year 2025. Otherwise, use the string 'Date not specified'.",
  "summary": "(string) A concise, neutral summary of the article's main points (2-4 sentences maximum).",
  "highlights": "(array of strings) Exactly 3 key, distinct takeaways or factual highlights directly supported by the article text. If 3 distinct highlights cannot be found, provide as many as possible up to 3. Each highlight should be a concise sentence.",
  "factSections": "(array of objects) <<< IMPORTANT: Generate this by segmenting the article into EXACT 150-word chunks. >>>
      1.  Take the entire '--- ARTICLE TEXT START ---' to '--- ARTICLE TEXT END ---' block (referred to as 'the article text' below).
      2.  Divide the article text into sequential segments, where each segment is EXACTLY 150 words long. Do not truncate or remove any content.
      3.  For each 150-word segment, create an object in this 'factSections' array.
      4.  Each object MUST have:
          -   \\"title\\": \\"(string) A concise, descriptive title for this specific segment of the article. For example, if the segment discusses the project's origin, a title could be 'Project Inception'. If a topic spans multiple segments, use sequential titles like 'Market Analysis - Part 1', 'Market Analysis - Part 2'. The title should reflect the main idea of *that specific segment's text*. Do NOT use generic titles like 'Section 1', 'Chunk 2'.
          -   \\"content\\": \\"(string) The exact text of this 150-word segment from the article. DO NOT summarize or rephrase this content. Preserve ALL original content including quotes, formatting, and special characters. <<< CRITICAL: Ensure this string value is valid JSON. Escape ALL necessary characters: double quotes must be \\\\\\", backslashes must be \\\\\\\\\\\\, newlines must be \\\\\\\\n, etc. Do NOT escape single quotes ('). >>>\\"
      5.  If the final segment is less than 150 words (but still contains text), include it as its own section with its actual content and an appropriate title.
      6.  If the total article text is less than 150 words, create a single 'factSection' containing the entire article text, with an appropriate descriptive title.
      7.  If the article text is extremely short (e.g., less than 20 words) or effectively empty after extraction, you may return an empty array \`[]\` for 'factSections'.
      8.  IMPORTANT: Do not truncate or remove any content from the original article. Every word must be preserved in one of the sections.",
  "spiceScore": "(object or null) <<< NEW: Analyze the article text according to the SPICE rubric below and provide the scores. If the article is too short or lacks substance for a meaningful score, return null for this entire 'spiceScore' field. >>>
    {
      \\"s\\": (number) Scannability score (1-5),
      \\"p\\": (number) Personalization score (1-5),
      \\"i\\": (number) Interactivity score (1-5),
      \\"c\\": (number) Curation score (1-5),
      \\"e\\": (number) Emotion score (1-5),
      \\"total\\": (number) Sum of s, p, i, c, e (MUST be between 5 and 25 if not null),
      \\"justifications\\": {
        \\"scannability\\": \\"(string) Brief justification for the Scannability score.\\",
        \\"personalization\\": \\"(string) Brief justification for the Personalization score.\\",
        \\"interactivity\\": \\"(string) Brief justification for the Interactivity score.\\",
        \\"curation\\": \\"(string) Brief justification for the Curation score.\\",
        \\"emotion\\": \\"(string) Brief justification for the Emotion score.\\"
      }
    }"
}

--- SPICE Scoring Rubric (Apply to the Article Text) ---
Assign a score from 1 to 5 for each category (S, P, I, C, E). Start with a base score of 1 for each category and award +1 point for *each distinct feature* present, up to a maximum of 5 points per category. Base your assessment ONLY on the provided article text. Provide brief justification strings.

1.  **Scannability (S):** Award +1 point for each (max 5):
    *   Contains bullet points or numbered lists (\`<ul>\`, \`<ol>\`, \`<li>\`).
    *   Has clear, descriptive headings/subheadings (beyond just the main title).
    *   Uses consistently short paragraphs (mostly 3-4 sentences or less).
    *   Highlights important keywords/phrases (bold, italic).
    *   Includes visual breaks (images inferred from context, blockquotes, distinct sections).
2.  **Personalization (P):** Award +1 point for each (max 5):
    *   Uses second-person language ("you", "your").
    *   Directly addresses reader concerns, goals, or motivations.
    *   Provides examples/scenarios relevant to a specific audience implied by the text.
    *   Recommends specific actions for the reader.
    *   Uses a tone/complexity appropriate for a specific (inferred) audience knowledge level.
3.  **Interactivity (I):** Award +1 point for each (max 5):
    *   Mentions or implies quizzes, polls, or embedded forms.
    *   Asks direct questions to the reader within the text.
    *   Describes clickable elements (buttons, jump links, widgets).
    *   Mentions comment sections or reader reactions.
    *   Includes links described as leading to interactive tools, downloads, or resources.
4.  **Curation (C):** Award +1 point for each (max 5):
    *   Mentions or implies links to external sources/websites.
    *   Mentions or implies links to related internal content (from the same source).
    *   Summarizes insights clearly attributed to other sources within the text.
    *   Suggests next steps or further readings.
    *   Cites or references authoritative sources/experts by name or title.
5.  **Emotion (E):** Award +1 point for each (max 5):
    *   Uses emotionally charged or empathetic language.
    *   Features relatable or compelling storytelling/narrative elements.
    *   Addresses common reader frustrations, hopes, or fears.
    *   Includes humor, inspiration, or surprise elements.
    *   Uses emotionally evocative imagery or metaphors in the language.

Calculate the 'total' score as the sum of the individual S, P, I, C, E scores (should be between 5 and 25). Provide all scores as numbers. Provide justifications as concise strings.

--- End SPICE Rubric ---

Critical JSON Rules & Escaping Guide:
1.  **OUTPUT JSON ONLY:** Start with '{', end with '}', nothing else.
2.  **VALID SYNTAX:** Use double quotes for all keys and string values. Correct commas (no trailing commas). Match brackets/braces.
3.  **MANDATORY ESCAPING inside STRING values:** Double Quote (") -> \\\\", Backslash (\\\\) -> \\\\\\\\, Newline -> \\\\n, etc.
4.  **DO NOT ESCAPE:** Single quotes ('). Leave them as is.
5.  **STICK TO STRUCTURE:** Use the exact field names and types specified.
6.  **BASE ON TEXT ONLY:** Do not add external information. Follow instructions for missing data. If SPICE scoring is not feasible, return null for 'spiceScore'.`;
        // *** END OF MODIFIED PROMPT ***


        // --- Step 3: Call Claude API ---
        console.log(`Sending request to Claude API for ${articleUrl}. Prompt length: ~${prompt.length} chars`);
        const claudeResponse = await anthropicClient.messages.create({
            model: "claude-3-haiku-20240307", // Consider Opus/Sonnet for complex instructions or longer context
            max_tokens: 4000, 
            system: "You are an expert data extraction and analysis tool. Your sole purpose is to return valid, correctly formatted JSON based precisely on the user's instructions and the provided text. You output ONLY the JSON object requested, nothing else. Ensure all special characters within JSON string values are properly escaped according to JSON specification. Perform the SPICE analysis accurately based *only* on the provided text. When creating 'factSections', adhere strictly to the 150-word segmentation rule and use the original text for content.",
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

            // Basic validation for SPICE score structure if present
            if (parsedData.spiceScore) {
                if (typeof parsedData.spiceScore.total !== 'number' ||
                    typeof parsedData.spiceScore.s !== 'number' ||
                    typeof parsedData.spiceScore.p !== 'number' ||
                    typeof parsedData.spiceScore.i !== 'number' ||
                    typeof parsedData.spiceScore.c !== 'number' ||
                    typeof parsedData.spiceScore.e !== 'number' ||
                    !parsedData.spiceScore.justifications) {
                   console.warn(`DEBUG: SPICE score structure seems invalid or incomplete in response for ${articleUrl}. Setting spiceScore to null.`);
                   parsedData.spiceScore = null;
                } else {
                   console.log(`DEBUG: Parsed SPICE score: Total=${parsedData.spiceScore.total}, S=${parsedData.spiceScore.s}, P=${parsedData.spiceScore.p}, I=${parsedData.spiceScore.i}, C=${parsedData.spiceScore.c}, E=${parsedData.spiceScore.e}`);
                }
            } else {
                console.log(`DEBUG: SPICE score not present or explicitly null in response for ${articleUrl}.`);
            }


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
            throw new Error(`Analysis service response was not valid JSON. ${errorMessage}`);
        }

        // --- Step 5: Format data for Frontend ---
        const storyData: StoryData = {
            title: parsedData.title || fetchedTitle,
            source: parsedData.source || inferredSource,
            author: scrapedAuthor, // Author from scraping
            date: parsedData.date, // Use date parsed/formatted by Claude or scraped
            summary: parsedData.summary,
            highlights: Array.isArray(parsedData.highlights) ? parsedData.highlights : [],
            imageUrl: scrapedImageUrl, // Primary image
            imageUrls: additionalImageUrls, // List of additional images
            originalUrl: originalUrl, // Original URL
            factSections: Array.isArray(parsedData.factSections)
                ? parsedData.factSections.map(section => ({
                    ...section,
                    id: generateId(section.title) // Ensure titles are reasonably unique for ID generation
                  }))
                : [],
            // Extract only necessary SPICE fields for frontend
            spiceScore: parsedData.spiceScore ? {
                s: parsedData.spiceScore.s,
                p: parsedData.spiceScore.p,
                i: parsedData.spiceScore.i,
                c: parsedData.spiceScore.c,
                e: parsedData.spiceScore.e,
                total: parsedData.spiceScore.total,
                // justifications: parsedData.spiceScore.justifications // Optionally pass justifications
            } : null,
        };

        console.log(`DEBUG: Final storyData: Title='${storyData.title}', Author='${storyData.author || 'N/A'}', Date='${storyData.date || 'N/A'}', PrimaryImage='${storyData.imageUrl || 'N/A'}', AdditionalImages=${storyData.imageUrls?.length ?? 0}, Sections=${storyData.factSections.length}, SPICE Score=${storyData.spiceScore?.total ?? 'N/A'}`);
        if (storyData.factSections.length > 0) {
            console.log(`DEBUG: Generated Section Titles: ${storyData.factSections.map(s => s.title).join('; ')}`);
        }


        // --- Step 6: Send Response to Frontend ---
        return NextResponse.json(storyData, { status: 200 });

    } catch (error: unknown) {
        console.error(`Critical Error in POST /api/process-article for URL ${originalUrl || 'unknown'}:`, error);
        let message = 'An internal server error occurred.';
        if (error instanceof Error) {
             message = error.message;
        }
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// --- GET Handler ---
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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