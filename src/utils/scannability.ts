import { JSDOM } from 'jsdom';

interface ScannabilityMetrics {
    headerScore: number;
    listScore: number;
    paragraphScore: number;
    specialTextScore: number;
    mediaScore: number;
    totalScore: number;
}

// Weights for different elements
const WEIGHTS = {
    HEADER: 0.25,
    LIST: 0.20,
    PARAGRAPH: 0.20,
    SPECIAL_TEXT: 0.15,
    MEDIA: 0.20
};

// Constants for scoring
const MAX_SCORE = 5;
const SCANNABLE_PARAGRAPH_WORD_LIMIT = 50;
const MIN_HEADERS_PER_1000_WORDS = 2;
const MIN_LISTS_PER_1000_WORDS = 1;
const MIN_SPECIAL_TEXT_PER_1000_WORDS = 5;
const MIN_MEDIA_PER_1000_WORDS = 1;

export function calculateScannabilityScore(htmlContent: string): ScannabilityMetrics {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Get total word count
    const totalWords = document.body.textContent?.split(/\s+/).length || 0;
    const wordsPer1000 = totalWords / 1000;

    // Calculate header score
    const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headerCount = headers.length;
    const headerScore = Math.min(
        MAX_SCORE,
        (headerCount / (MIN_HEADERS_PER_1000_WORDS * wordsPer1000)) * MAX_SCORE
    );

    // Calculate list score
    const lists = document.querySelectorAll('ul, ol');
    const listItems = document.querySelectorAll('li');
    const listScore = Math.min(
        MAX_SCORE,
        (listItems.length / (MIN_LISTS_PER_1000_WORDS * wordsPer1000)) * MAX_SCORE
    );

    // Calculate paragraph score
    const paragraphs = document.querySelectorAll('p');
    let scannableParagraphs = 0;
    paragraphs.forEach(p => {
        const wordCount = p.textContent?.split(/\s+/).length || 0;
        if (wordCount <= SCANNABLE_PARAGRAPH_WORD_LIMIT) {
            scannableParagraphs++;
        }
    });
    const paragraphScore = Math.min(
        MAX_SCORE,
        (scannableParagraphs / paragraphs.length) * MAX_SCORE
    );

    // Calculate special text score
    const specialText = document.querySelectorAll('b, strong, i, em, u, mark');
    const specialTextScore = Math.min(
        MAX_SCORE,
        (specialText.length / (MIN_SPECIAL_TEXT_PER_1000_WORDS * wordsPer1000)) * MAX_SCORE
    );

    // Calculate media score
    const media = document.querySelectorAll('img, video, iframe');
    const mediaScore = Math.min(
        MAX_SCORE,
        (media.length / (MIN_MEDIA_PER_1000_WORDS * wordsPer1000)) * MAX_SCORE
    );

    // Calculate weighted total score
    const totalScore = Math.round(
        (headerScore * WEIGHTS.HEADER) +
        (listScore * WEIGHTS.LIST) +
        (paragraphScore * WEIGHTS.PARAGRAPH) +
        (specialTextScore * WEIGHTS.SPECIAL_TEXT) +
        (mediaScore * WEIGHTS.MEDIA)
    );

    return {
        headerScore: Math.round(headerScore),
        listScore: Math.round(listScore),
        paragraphScore: Math.round(paragraphScore),
        specialTextScore: Math.round(specialTextScore),
        mediaScore: Math.round(mediaScore),
        totalScore
    };
} 