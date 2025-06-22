// Type definitions for the Smart Story Suite application

export interface FactSection {
    id: string;
    title: string;
    content: string;
}

export interface SpiceScoreData {
    s: number;
    p: number;
    i: number;
    c: number;
    e: number;
    total: number;
}

export interface StoryData {
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
    spiceScore: SpiceScoreData | null;
    similarityScore: number;
    videos: string[];
}

export interface HighlightsSummaryProps { 
    story: StoryData | null; 
    isDarkMode: boolean; 
}

export interface FactSectionDisplayProps { 
    section: FactSection; 
    isDarkMode: boolean; 
}

export interface AdditionalImageProps {
    src: string;
    alt: string;
    isDarkMode: boolean;
    onClick: () => void;
}

export interface ImageOverlayProps {
    imageUrl: string;
    onClose: () => void;
}

export interface VideoCarouselProps {
    videos: string[];
    isDarkMode: boolean;
}

export interface SpiceScoreDisplayProps {
    scoreData: SpiceScoreData;
    isDarkMode: boolean;
}

export interface SimilarityScoreDisplayProps {
    score: number;
    isDarkMode: boolean;
}

export interface EditablePicturesProps {
    imageUrls: string[];
    isDarkMode: boolean;
    onChange: (urls: string[]) => void;
    onImageClick: (imageUrl: string) => void;
}

export interface EditableTitleProps {
    title: string;
    onChange: (title: string) => void;
    isDarkMode: boolean;
}

export interface EditableSummaryProps {
    summary: string;
    onChange: (summary: string) => void;
    isDarkMode: boolean;
}

export interface EditableHighlightsProps {
    highlights: string[];
    onChange: (highlights: string[]) => void;
    isDarkMode: boolean;
}

export interface EditableFactSectionProps {
    section: FactSection;
    onChange: (section: FactSection) => void;
    onRemove: () => void;
    isDarkMode: boolean;
}

export interface EditableVideoSectionProps {
    videos: string[];
    onChange: (videos: string[]) => void;
    isDarkMode: boolean;
} 