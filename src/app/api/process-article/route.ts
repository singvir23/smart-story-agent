// src/app/api/process-article/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import fetch from 'node-fetch';

// Define the structure we expect from Claude (matching frontend interfaces)
interface ExpectedClaudeResponse {
    title: string;
    source: string;
    date: string;
    summary: string;
    highlights: string[];
    factSections: Array<{
        title: string;
        content: string;
    }>;
}

// Define interfaces used within this file and potentially shared with frontend
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
}

// Helper to generate simple IDs
const generateId = (title: string): string => {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Ensure API key is loaded (add error handling if it's missing)
if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY environment variable is not set.");
    // Optionally throw an error or handle it gracefully depending on your needs
    // throw new Error("ANTHROPIC_API_KEY is not configured.");
}

const anthropiClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Use standard Request object for App Router
export async function POST(req: Request) {
    try {
        if (!process.env.ANTHROPIC_API_KEY) {
             return NextResponse.json({ error: 'Server configuration error: API key missing.' }, { status: 500 });
        }

        const body = await req.json(); // Get body using await req.json()
        const { articleUrl } = body;

        if (!articleUrl || typeof articleUrl !== 'string') {
            // Use NextResponse for responses
            return NextResponse.json({ error: 'Article URL is required' }, { status: 400 });
        }

        // Basic URL validation (optional but recommended)
        try {
            new URL(articleUrl);
        } catch (_) {
            return NextResponse.json({ error: 'Invalid URL format provided' }, { status: 400 });
        }

        console.log(`Processing URL: ${articleUrl}`);

        // --- Step 1: Fetch and Extract Article Content ---
        let articleText = '';
        let inferredSource = '';
        let fetchedTitle = '';

        try {
            // Add a timeout to the fetch request (e.g., 15 seconds)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(articleUrl, {
                headers: {
                    'User-Agent': 'SmartStorySuiteBot/1.0 (+https://your-domain.com/bot-info)', // Be a good citizen
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' // Common accept header
                },
                signal: controller.signal // Add timeout signal
            });

            clearTimeout(timeoutId); // Clear the timeout if fetch completes

            if (!response.ok) {
                 // Log more details on fetch failure
                console.error(`Fetch failed for ${articleUrl} with status ${response.status} ${response.statusText}`);
                throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`);
            }

            // Check content type - only proceed if it looks like HTML
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('text/html')) {
                console.warn(`Content type for ${articleUrl} is not HTML (${contentType}). Skipping Readability.`);
                 throw new Error(`Expected HTML content, but received ${contentType}`);
            }


            const html = await response.text();
            const doc = new JSDOM(html, { url: articleUrl }); // Provide URL for Readability context
            const reader = new Readability(doc.window.document);
            const article = reader.parse();

            if (!article || !article.textContent) {
                 // Try falling back to body text if Readability fails significantly
                 const bodyText = doc.window.document.body.textContent?.trim();
                 if (bodyText && bodyText.length > 200) {
                     console.warn(`Readability failed for ${articleUrl}. Falling back to body text.`);
                     articleText = bodyText;
                     fetchedTitle = doc.window.document.title || 'Title not found';
                     inferredSource = new URL(articleUrl).hostname;
                 } else {
                    console.error(`Could not extract meaningful content for ${articleUrl} using Readability or body fallback.`);
                    throw new Error('Could not extract article content.');
                 }
            } else {
                articleText = article.textContent.trim();
                fetchedTitle = article.title || doc.window.document.title; // Use Readability title or fallback
                inferredSource = article.siteName || new URL(articleUrl).hostname; // Use Readability siteName or fallback
                console.log(`Successfully extracted ~${articleText.length} characters via Readability. Title: ${fetchedTitle}, Source: ${inferredSource}`);
            }


        } catch (fetchError: any) {
            console.error(`Error fetching or parsing article (${articleUrl}):`, fetchError);
             // Distinguish between fetch timeout and other errors
             if (fetchError.name === 'AbortError') {
                return NextResponse.json({ error: 'Failed to fetch article: The request timed out.' }, { status: 504 }); // Gateway Timeout
             }
            return NextResponse.json({ error: `Failed to fetch or parse article: ${fetchError.message}` }, { status: 500 });
        }

         // Increased minimum length slightly
         if (articleText.length < 200) {
            console.warn(`Extracted content for ${articleUrl} is very short (${articleText.length} chars). May result in poor analysis.`);
            // Decide whether to proceed or return an error
            // return NextResponse.json({ error: 'Extracted content seems too short to analyze meaningfully.' }, { status: 400 });
         }

        // --- Step 2: Prepare Prompt for Claude ---
        // Define the sections we want Claude to populate
        const desiredSections = [
            "Key Points",           // Core findings/arguments
            "Context/Background",   // What led to this? Relevant history?
            "Impact/Consequences", // What are the results or potential effects?
            "Quotes/Sources",       // Notable quotes or cited sources/experts
            "Data/Figures",         // Any specific numbers, stats, or figures mentioned
            "Future Outlook",       // What might happen next? Predictions?
            // Add/remove based on desired output focus
        ];

        // Truncate article text to fit context window limits reasonably
        // Claude 3 Haiku context window is large (200k tokens), but let's be practical for cost/performance.
        // ~4 chars per token is a rough estimate. Max ~150k chars = ~37.5k tokens.
        const maxChars = 150000;
        const truncatedArticleText = articleText.length > maxChars
            ? articleText.substring(0, maxChars) + "\n[... content truncated ...]"
            : articleText;


        const prompt = `Analyze the following article text and provide a structured summary in JSON format.

Article Source (if known): ${inferredSource}
Article Title (if known): ${fetchedTitle}

--- ARTICLE TEXT START ---
${truncatedArticleText}
--- ARTICLE TEXT END ---

Based *only* on the text provided above, respond ONLY with a valid JSON object adhering strictly to the following structure:
{
  "title": "(string) The main title of the article. Infer from the text or use '${fetchedTitle}' if accurate.",
  "source": "(string) The source publication or website. Use '${inferredSource}' or refine based *only* on the text.",
  "date": "(string) The publication date *explicitly mentioned* in the article (e.g., "April 9, 2025", "last Tuesday", "yesterday"). If no date is explicitly mentioned, use the string "Date not specified in text". Do not guess.",
  "summary": "(string) A concise, neutral summary of the article's main points (2-4 sentences maximum).",
  "highlights": "(array of strings) A list of 3-5 key, distinct takeaways or factual highlights directly supported by the article text.",
  "factSections": "(array of objects) Create an object for each of the following section titles *if and only if* relevant information is present in the article text. If no relevant information is found for a title, *omit* that section object entirely from this array. Do not invent information. Each object must have:
      - "title": (string) Exactly one of the following: ${desiredSections.join(', ')}
      - "content": (string) A summary of the information *directly found* in the text relevant to this specific section title. Be concise. If the section title is 'Quotes/Sources', list 1-3 notable direct quotes or explicitly mentioned sources/experts."
}

Example for 'factSections':
[
  { "title": "Key Points", "content": "The agreement sets binding targets..." },
  { "title": "Impact/Consequences", "content": "Experts predict a 1.8°C limit if implemented..." },
  { "title": "Quotes/Sources", "content": "Activist Jane Doe called it 'a step forward'. Dr. Smith from Climate Institute mentioned..." }
]

Important Rules:
- Your entire response MUST be a single, valid JSON object, starting with { and ending with }.
- Do not include any explanatory text or markdown formatting before or after the JSON.
- Base all information strictly on the provided article text. Do not add external knowledge or guess information not present.
- If a field (like 'date') or a specific 'factSection' cannot be reliably determined from the text, follow the instructions precisely (e.g., use "Date not specified in text" or omit the section).`;


        // --- Step 3: Call Claude API ---
        console.log(`Sending request to Claude API for ${articleUrl}. Prompt length: ~${prompt.length} chars`);
        const claudeResponse = await anthropiClient.messages.create({
            model: "claude-3-haiku-20240307", // Fastest/cheapest for this task
            max_tokens: 3072, // Increased slightly for potentially complex JSON structure
            messages: [{ role: 'user', content: prompt }],
            // Consider adding system prompt for stricter JSON output if needed:
            // system: "You are an AI assistant that strictly follows instructions and outputs only valid JSON.",
            temperature: 0.2, // Lower temperature for more factual, less creative JSON generation
        });

        console.log(`Received response from Claude API for ${articleUrl}. Output tokens: ${claudeResponse.usage.output_tokens}`);

        // --- Step 4: Parse Claude's Response ---
        // Guard against empty or unexpected response content
        if (!claudeResponse.content || claudeResponse.content.length === 0 || claudeResponse.content[0].type !== 'text' || !claudeResponse.content[0].text) {
             console.error('Unexpected or empty response structure from Claude API:', JSON.stringify(claudeResponse));
             throw new Error('Received an unexpected or empty response from the analysis service.');
        }
        const jsonString = claudeResponse.content[0].text;

        let parsedData: ExpectedClaudeResponse;
        try {
            // More robust JSON extraction: find the first '{' and the last '}'
            const jsonStart = jsonString.indexOf('{');
            const jsonEnd = jsonString.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
                 console.error('Could not find valid JSON object delimiters { } in Claude response:', jsonString);
                throw new Error('Analysis service response did not contain a valid JSON object.');
            }
            const extractedJson = jsonString.substring(jsonStart, jsonEnd + 1);

            parsedData = JSON.parse(extractedJson);
            console.log(`Successfully parsed Claude JSON response for ${articleUrl}.`);

        } catch (parseError: any) {
            console.error(`Error parsing Claude JSON response for ${articleUrl}:`, parseError);
            console.error('--- Raw Claude response string ---');
            console.error(jsonString); // Log the problematic string
            console.error('--- End Raw Claude response ---');
            throw new Error(`Failed to process the analysis service response (JSON parse error): ${parseError.message}`);
        }

        // --- Step 5: Format data for Frontend ---
        // Add IDs to factSections that were returned by Claude
        const storyData: StoryData = {
            ...parsedData, // Spread the parsed data (title, source, date, summary, highlights)
            factSections: parsedData.factSections.map(section => ({
                    ...section,
                    id: generateId(section.title) // Generate ID based on the title Claude provided
            })),
        };

        // --- Step 6: Send Response to Frontend ---
        return NextResponse.json(storyData, { status: 200 }); // Use NextResponse

    } catch (error: any) {
        console.error(`Critical Error in POST /api/process-article for URL ${req.url}:`, error);
        // Provide a generic error message to the client but log the specific one
        return NextResponse.json({ error: error.message || 'An internal server error occurred while processing the article.' }, { status: 500 });
    }
}

// Optional: Add a GET handler for testing the route existence
export async function GET(req: Request) {
    return NextResponse.json({ message: "API route is active. Use POST method to process an article URL." });
}