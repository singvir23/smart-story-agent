"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { posthog } from '@/lib/posthog';

// --- Interfaces ---
interface FactSection {
        id: string;
        title: string;
        content: string;
}

// Interface for SPICE score data received from backend
interface SpiceScoreData {
        s: number;
        p: number;
        i: number;
        c: number;
        e: number;
        total: number;
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
        spiceScore?: SpiceScoreData | null;
        similarityScore?: number;
}

// --- Animation Variants ---
const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
                opacity: 1,
                transition: {
                        delayChildren: 0.1,
                        staggerChildren: 0.1,
                },
        },
};

const itemVariants = {
        hidden: { y: 15, opacity: 0 },
        visible: {
                y: 0,
                opacity: 1,
                transition: { type: 'spring', stiffness: 120, damping: 18 }
        },
        exit: {
                y: -10,
                opacity: 0,
                transition: { duration: 0.2 }
        }
};

const sidebarItemVariants = {
        hidden: { x: -20, opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { duration: 0.25, ease: "easeOut" } }
}

const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
};

const enlargedImageVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
                opacity: 1,
                scale: 1,
                transition: { type: 'spring', stiffness: 200, damping: 25 }
        },
        exit: { opacity: 0, scale: 0.8 }
};


// --- Reusable Display Components ---
interface HighlightsSummaryProps { story: StoryData | null; isDarkMode: boolean; }
const HighlightsSummaryComponent: React.FC<HighlightsSummaryProps> = ({ story, isDarkMode }) => {
        if (!story) return null;
        return (
                <motion.div
                        variants={itemVariants}
                        className={`rounded-lg p-5 mb-6 ${isDarkMode ? 'bg-slate-700/60 border-slate-600/50' : 'bg-gray-50 border-gray-200/80'} border`}
                >
                        <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Story Highlights</h2>
                        <ul className="mb-4 pl-5 list-disc space-y-1.5 text-sm">
                                {story.highlights.map((highlight: string, index: number) => (
                                        <li key={index} className={`${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{highlight}</li>
                                ))}
                        </ul>
                        <h3 className={`text-lg font-semibold mt-5 mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Summary</h3>
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{story.summary}</p>
                </motion.div>
        );
};

interface FactSectionDisplayProps { section: FactSection; isDarkMode: boolean; }
const FactSectionDisplay: React.FC<FactSectionDisplayProps> = ({ section, isDarkMode }) => (
        <motion.div
                id={section.id}
                key={section.id}
                variants={itemVariants}
                layout
                className={`rounded-lg p-5 shadow-sm ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} border`}
        >
                <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                        {section.title}
                </h2>
                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        {section.content}
                </p>
        </motion.div>
);

// --- Helper: Component for individual additional image with error handling & click ---
interface AdditionalImageProps {
        src: string;
        alt: string;
        isDarkMode: boolean;
        onClick: () => void; // Add onClick handler prop
}
const AdditionalImage: React.FC<AdditionalImageProps> = ({ src, alt, isDarkMode, onClick }) => {
        const [hasError, setHasError] = useState(false);

        if (hasError) {
                return (
                        <div className={`flex aspect-square items-center justify-center p-2 text-xs rounded border ${isDarkMode ? 'bg-slate-600 border-slate-500 text-slate-400' : 'bg-gray-200 border-gray-300 text-gray-500'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Failed</span>
                        </div>
                );
        }

        return (
                <motion.button
                        type="button"
                        onClick={onClick}
                        className={`w-full h-auto block rounded shadow-sm border overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkMode ? 'border-slate-600 focus:ring-teal-500 focus:ring-offset-slate-800' : 'border-gray-300 focus:ring-teal-600 focus:ring-offset-white'}`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        title="Click to enlarge"
                >
                        <img
                                src={src}
                                alt={alt}
                                className={`w-full h-auto object-cover aspect-square block`}
                                loading="lazy"
                                onError={() => {
                                        console.warn("<<< Additional IMAGE ERROR >>> Image failed:", src);
                                        setHasError(true);
                                }}
                        />
                </motion.button>
        );
};

// --- Component: Image Overlay ---
interface ImageOverlayProps {
        imageUrl: string;
        onClose: () => void;
}
const ImageOverlay: React.FC<ImageOverlayProps> = ({ imageUrl, onClose }) => {
        useEffect(() => {
                const handleKeyDown = (event: KeyboardEvent) => {
                        if (event.key === 'Escape') {
                                onClose();
                        }
                };
                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
        }, [onClose]);

        return (
                <motion.div
                        key="image-overlay"
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                >
                        <motion.div
                                className="relative max-w-full max-h-full"
                                variants={enlargedImageVariants}
                                onClick={(e) => e.stopPropagation()}
                        >
                                <img
                                        src={imageUrl}
                                        alt="Enlarged view"
                                        className="block max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                />
                                <button
                                        type="button"
                                        onClick={onClose}
                                        className="absolute -top-2 -right-2 z-10 p-1.5 bg-white/80 text-gray-700 rounded-full shadow-md hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-white transition"
                                        aria-label="Close enlarged image"
                                >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                </button>
                        </motion.div>
                </motion.div>
        );
};

// --- Component: SPICE Score Display ---
interface SpiceScoreDisplayProps {
        scoreData: SpiceScoreData;
        isDarkMode: boolean;
}
const SpiceScoreDisplay: React.FC<SpiceScoreDisplayProps> = ({ scoreData, isDarkMode }) => {
        // Calculate percentage for potential visual representation (optional)
        // const percentage = (scoreData.total / 25) * 100;

        // Simple Text display
        return (
                <div className="mt-3 pt-3 border-t border-dashed border-gray-300 dark:border-slate-600">
                        <h4 className={`text-xs font-semibold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                                Engagement Score (SPICE)
                        </h4>
                        <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                        Total: <span className="text-lg font-bold">{scoreData.total}</span> / 25
                                </p>
                                {/* Optional: Detailed breakdown on hover/tooltip? */}
                                <div className={`text-xs grid grid-cols-5 gap-1 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                        <span title={`Scannability: ${scoreData.s}/5`}>S:{scoreData.s}</span>
                                        <span title={`Personalization: ${scoreData.p}/5`}>P:{scoreData.p}</span>
                                        <span title={`Interactivity: ${scoreData.i}/5`}>I:{scoreData.i}</span>
                                        <span title={`Curation: ${scoreData.c}/5`}>C:{scoreData.c}</span>
                                        <span title={`Emotion: ${scoreData.e}/5`}>E:{scoreData.e}</span>
                                </div>
                        </div>
                </div>
        );
};

// Add the SimilarityScoreDisplay component
interface SimilarityScoreDisplayProps {
        score: number;
        isDarkMode: boolean;
}
const SimilarityScoreDisplay: React.FC<SimilarityScoreDisplayProps> = ({ score, isDarkMode }) => {
        const getScoreColor = (score: number) => {
                if (score >= 0.8) return isDarkMode ? 'text-green-400' : 'text-green-600';
                if (score >= 0.6) return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
                return isDarkMode ? 'text-red-400' : 'text-red-600';
        };

        return (
                <div className="mt-3 pt-3 border-t border-dashed border-gray-300 dark:border-slate-600">
                        <h4 className={`text-xs font-semibold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                                Content Similarity Score
                        </h4>
                        <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                        Score: <span className={`text-lg font-bold ${getScoreColor(score)}`}>{Math.round(score * 100)}%</span>
                                </p>
                                <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {score >= 0.8 ? 'Excellent' : score >= 0.6 ? 'Good' : 'Needs Review'}
                                </div>
                        </div>
                </div>
        );
};

// --- Edit Mode Components ---
interface EditableTitleProps {
        title: string;
        onChange: (title: string) => void;
        isDarkMode: boolean;
}
const EditableTitle: React.FC<EditableTitleProps> = ({ title, onChange, isDarkMode }) => (
        <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        Article Title
                </label>
                <input
                        type="text"
                        value={title}
                        onChange={(e) => onChange(e.target.value)}
                        className={`w-full p-3 text-xl font-bold rounded-md border ${isDarkMode
                                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                } focus:ring-teal-500 focus:border-teal-500 transition`}
                        placeholder="Enter article title..."
                />
        </div>
);

interface EditableSummaryProps {
        summary: string;
        onChange: (summary: string) => void;
        isDarkMode: boolean;
}
const EditableSummary: React.FC<EditableSummaryProps> = ({ summary, onChange, isDarkMode }) => (
        <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        Summary
                </label>
                <textarea
                        value={summary}
                        onChange={(e) => onChange(e.target.value)}
                        rows={4}
                        className={`w-full p-3 rounded-md border ${isDarkMode
                                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                } focus:ring-teal-500 focus:border-teal-500 transition resize-vertical`}
                        placeholder="Enter article summary..."
                />
        </div>
);

interface EditableHighlightsProps {
        highlights: string[];
        onChange: (highlights: string[]) => void;
        isDarkMode: boolean;
}
const EditableHighlights: React.FC<EditableHighlightsProps> = ({ highlights, onChange, isDarkMode }) => {
        const addHighlight = () => {
                onChange([...highlights, '']);
        };

        const updateHighlight = (index: number, value: string) => {
                const updated = [...highlights];
                updated[index] = value;
                onChange(updated);
        };

        const removeHighlight = (index: number) => {
                onChange(highlights.filter((_, i) => i !== index));
        };

        return (
                <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                Story Highlights
                        </label>
                        <div className="space-y-2">
                                {highlights.map((highlight, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                                <input
                                                        type="text"
                                                        value={highlight}
                                                        onChange={(e) => updateHighlight(index, e.target.value)}
                                                        className={`flex-1 p-2 text-sm rounded-md border ${isDarkMode
                                                                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                                                } focus:ring-teal-500 focus:border-teal-500 transition`}
                                                        placeholder={`Highlight ${index + 1}...`}
                                                />
                                                <button
                                                        type="button"
                                                        onClick={() => removeHighlight(index)}
                                                        className={`p-2 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition`}
                                                        title="Remove highlight"
                                                >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                </button>
                                        </div>
                                ))}
                                <button
                                        type="button"
                                        onClick={addHighlight}
                                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md border-2 border-dashed transition ${isDarkMode
                                                ? 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                                                : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
                                                }`}
                                >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Highlight
                                </button>
                        </div>
                </div>
        );
};

interface EditableFactSectionProps {
        section: FactSection;
        onChange: (section: FactSection) => void;
        onRemove: () => void;
        isDarkMode: boolean;
}
const EditableFactSection: React.FC<EditableFactSectionProps> = ({ section, onChange, onRemove, isDarkMode }) => (
        <motion.div
                layout
                className={`rounded-lg p-5 border ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'
                        }`}
        >
                <div className="flex items-start justify-between mb-3">
                        <input
                                type="text"
                                value={section.title}
                                onChange={(e) => onChange({ ...section, title: e.target.value })}
                                className={`flex-1 text-lg font-semibold bg-transparent border-none outline-none ${isDarkMode ? 'text-teal-400' : 'text-teal-700'
                                        } focus:ring-2 focus:ring-teal-500 rounded px-1`}
                                placeholder="Section title..."
                        />
                        <button
                                type="button"
                                onClick={onRemove}
                                className={`ml-2 p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition`}
                                title="Remove section"
                        >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                        </button>
                </div>
                <textarea
                        value={section.content}
                        onChange={(e) => onChange({ ...section, content: e.target.value })}
                        rows={6}
                        className={`w-full p-3 text-sm rounded-md border ${isDarkMode
                                ? 'bg-slate-600 border-slate-500 text-slate-300 placeholder-slate-400'
                                : 'bg-gray-50 border-gray-300 text-gray-700 placeholder-gray-400'
                                } focus:ring-teal-500 focus:border-teal-500 transition resize-vertical`}
                        placeholder="Section content..."
                />
        </motion.div>
);

// --- Main Component ---
const SmartStorySuite: React.FC = () => {
        const [urlInput, setUrlInput] = useState<string>('');
        const [storyData, setStoryData] = useState<StoryData | null>(null);
        const [isLoading, setIsLoading] = useState<boolean>(false);
        const [error, setError] = useState<string | null>(null);
        const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
        const [readMode, setReadMode] = useState<'summary' | 'detailed'>('summary');
        const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
        const [imageLoadError, setImageLoadError] = useState<boolean>(false);
        const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
        const [isEditMode, setIsEditMode] = useState<boolean>(false);
        const [editableStoryData, setEditableStoryData] = useState<StoryData | null>(null);

        useEffect(() => {
                const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                const storedPreference = localStorage.getItem('darkMode');
                if (storedPreference !== null) {
                        setIsDarkMode(storedPreference === 'true');
                } else {
                        setIsDarkMode(prefersDark);
                }
                // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        useEffect(() => {
                localStorage.setItem('darkMode', String(isDarkMode));
                document.documentElement.classList.toggle('dark', isDarkMode); // Add/remove 'dark' class on <html>
        }, [isDarkMode]);


        const toggleTheme = (): void => setIsDarkMode(!isDarkMode);

        const handleSectionClick = (sectionId: string): void => {
                setActiveSectionId(sectionId);
                if (readMode === 'detailed' && storyData) {
                        setTimeout(() => {
                                document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                } else if (readMode === 'summary') {
                        const mainContentElement = document.querySelector('main');
                        mainContentElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
        };

        const changeReadMode = (newMode: 'summary' | 'detailed'): void => {
                setReadMode(newMode);
                setActiveSectionId(null);
        }

        const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
                event.preventDefault();
                if (!urlInput || isLoading) return;

                setIsLoading(true);
                setError(null);
                setStoryData(null);
                setActiveSectionId(null);
                setReadMode('summary');
                setImageLoadError(false);
                setEnlargedImageUrl(null);
                setIsEditMode(false);
                setEditableStoryData(null);

                try {
                        const response = await fetch('/api/process-article', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ articleUrl: urlInput, editMode: true }),
                        });
                        const data = await response.json();

                        console.log('<<< API RESPONSE >>> Raw data received:', data);

                        if (!response.ok) {
                                const errorMsg = data?.error || `Request failed with status: ${response.status} ${response.statusText}`;
                                if (response.status >= 500 && response.status < 600) {
                                        throw new Error("Something wasn't right with the analysis service. Please try pasting the URL again or try a different article.");
                                } else if (response.status === 400) {
                                        throw new Error(`Invalid request${data?.error ? `: ${data.error}` : '.'} Please check the URL.`);
                                } else if (response.status === 403 || response.status === 404) {
                                        throw new Error(`Could not access article: ${errorMsg}`);
                                }
                                throw new Error(errorMsg);
                        }

                        console.log('<<< API RESPONSE >>> Primary imageUrl:', data?.imageUrl);
                        console.log('<<< API RESPONSE >>> Additional imageUrls count:', data?.imageUrls?.length ?? 0);
                        console.log('<<< API RESPONSE >>> SPICE Score:', data?.spiceScore); // Log SPICE score

                        const processedData = data as StoryData;
                        setStoryData(processedData);
                        setEditableStoryData(JSON.parse(JSON.stringify(processedData))); // Deep copy for editing
                        setIsEditMode(true); // Enter edit mode after processing
                } catch (err: unknown) {
                        console.error("Failed to process article:", err);
                        let message = 'An unexpected error occurred. Please try again.';
                        if (err instanceof Error) {
                                message = err.message;
                        }
                        if (message.toLowerCase().includes('fetch') || message.toLowerCase().includes('network') || message.toLowerCase().includes('service')) {
                                message = "Something wasn't right. Please check your connection and try pasting the URL again.";
                        }
                        setError(message);
                        setStoryData(null);
                } finally {
                        setIsLoading(false);
                }
        };

        const handleReset = () => {
                setUrlInput('');
                setStoryData(null);
                setError(null);
                setIsLoading(false);
                setActiveSectionId(null);
                setImageLoadError(false);
                setEnlargedImageUrl(null);
                setIsEditMode(false);
                setEditableStoryData(null);
        }

        useEffect(() => {
                if (storyData?.imageUrl) {
                        setImageLoadError(false);
                        console.log("<<< EFFECT >>> Reset primary imageLoadError to false because storyData.imageUrl exists.");
                }
        }, [storyData?.imageUrl]);

        const activeSectionData = storyData?.factSections.find(s => s.id === activeSectionId);

        const handleImageClick = (imageUrl: string) => {
                setEnlargedImageUrl(imageUrl);
        };

        const closeImageOverlay = () => {
                setEnlargedImageUrl(null);
        };

        // Edit mode handlers
        const handleSaveEdits = () => {
                if (editableStoryData) {
                        setStoryData(editableStoryData);
                        setIsEditMode(false);
                        setActiveSectionId(null);
                        setReadMode('summary');
                }
        };

        const handleCancelEdits = () => {
                setIsEditMode(false);
                setEditableStoryData(null);
        };

        const updateEditableData = (updates: Partial<StoryData>) => {
                if (editableStoryData) {
                        setEditableStoryData({ ...editableStoryData, ...updates });
                }
        };

        const updateFactSection = (index: number, updatedSection: FactSection) => {
                if (editableStoryData) {
                        const updatedSections = [...editableStoryData.factSections];
                        updatedSections[index] = updatedSection;
                        setEditableStoryData({ ...editableStoryData, factSections: updatedSections });
                }
        };

        const removeFactSection = (index: number) => {
                if (editableStoryData) {
                        const updatedSections = editableStoryData.factSections.filter((_, i) => i !== index);
                        setEditableStoryData({ ...editableStoryData, factSections: updatedSections });
                }
        };

        const addFactSection = () => {
                if (editableStoryData) {
                        const newSection: FactSection = {
                                id: `section-${Date.now()}`,
                                title: 'New Section',
                                content: ''
                        };
                        setEditableStoryData({
                                ...editableStoryData,
                                factSections: [...editableStoryData.factSections, newSection]
                        });
                }
        };


        const bodyFont = 'font-sans';
        const titleFont = 'font-serif';

        // Initializaing PostHog
        useEffect(() => {
                posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
                        api_host: 'https://us.i.posthog.com',
                        capture_pageview: true,
                        autocapture: true,
                        rageclick: true
                })

                // // Capturing what text has been highlighted
                // const handleTextSelect = () => {
                //     const selection = window.getSelection()
                //     const selectedText = selection?.toString().trim()

                //     if (selectedText) {
                //     console.log("Highlight captured:", selectedText)
                //       posthog.capture('text_selected', {
                //         text: selectedText,
                //         length: selectedText.length
                //       })
                //     }

                //     document.addEventListener('mouseup', handleTextSelect)
                //     document.addEventListener('keyup', handleTextSelect)

                //     return () => {
                //         document.removeEventListener('mouseup', handleTextSelect)
                //         document.removeEventListener('keyup', handleTextSelect)
                //     }
                // }
        }, [])

        return (
                <div className={`${isDarkMode ? 'dark bg-slate-900 text-slate-200' : 'bg-gray-100 text-gray-800'} min-h-screen transition-colors duration-300 ${bodyFont}`}>
                        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

                                {!storyData && !isLoading && !error && (
                                        <div className="text-center mb-8 pt-10">
                                                <h2 className={`text-2xl font-semibold mb-3 ${titleFont} ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                                        New View News Analyzer - Beta
                                                </h2>
                                                <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-500'} text-sm max-w-md mx-auto`}>
                                                        Enter the article URL below to either scan details or dive deep into its structure and content.
                                                </p>
                                        </div>
                                )}

                                <motion.div layout className={`mb-8 p-5 rounded-lg shadow ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border-gray-200/70 border'}`}>
                                        <form onSubmit={handleSubmit}>
                                                <label htmlFor="articleUrl" className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                                        Article URL
                                                </label>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                        <input
                                                                type="url"
                                                                id="articleUrl"
                                                                name="articleUrl"
                                                                value={urlInput}
                                                                onChange={(e) => setUrlInput(e.target.value)}
                                                                placeholder="https://www.example.com/news/article-name"
                                                                required
                                                                className={`flex-grow p-2 border rounded-md text-sm ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:ring-teal-500 focus:border-teal-500 transition`}
                                                                disabled={isLoading}
                                                        />
                                                        <button
                                                                type="submit"
                                                                disabled={isLoading || !urlInput}
                                                                className={`px-4 py-2 rounded-md font-semibold text-sm transition flex items-center justify-center whitespace-nowrap ${isLoading
                                                                        ? `cursor-not-allowed ${isDarkMode ? 'bg-slate-600 text-slate-400' : 'bg-gray-300 text-gray-500'}`
                                                                        : `text-white ${isDarkMode ? 'bg-teal-600 hover:bg-teal-700' : 'bg-teal-700 hover:bg-teal-800'} disabled:opacity-50 disabled:cursor-not-allowed`
                                                                        }`}
                                                        >
                                                                {isLoading ? (<> <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> Processing... </>) : ('Analyze Article')}
                                                        </button>
                                                        {storyData && !isLoading && (
                                                                <button
                                                                        type="button"
                                                                        onClick={handleReset}
                                                                        title="Analyze another article"
                                                                        className={`p-2 rounded-md text-sm transition ${isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                                                                >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0015.357 2m0 0H15" /></svg>
                                                                </button>
                                                        )}
                                                </div>
                                        </form>
                                        <AnimatePresence>
                                                {error && (
                                                        <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm dark:bg-red-900/30 dark:border-red-700/50 dark:text-red-300"
                                                                role="alert"
                                                        >
                                                                <strong>Error:</strong> {error}
                                                        </motion.div>
                                                )}
                                        </AnimatePresence>
                                </motion.div>


                                {/* --- Story Display Area (Conditional) --- */}
                                <AnimatePresence>
                                        {storyData && !isLoading && (
                                                <motion.div
                                                        key="story-display"
                                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5 }}
                                                        className={`rounded-lg shadow-lg overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200/70'} border`}
                                                >
                                                        {/* Edit Mode Display */}
                                                        {isEditMode && editableStoryData ? (
                                                                <>
                                                                        {/* Edit Mode Header */}
                                                                        <header className={`p-5 sm:p-6 ${isDarkMode ? 'border-b border-slate-700 bg-amber-900/20' : 'border-b border-gray-200 bg-amber-50'}`}>
                                                                                <div className="flex items-center justify-between mb-4">
                                                                                        <div className="flex items-center gap-3">
                                                                                                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-amber-600' : 'bg-amber-500'}`}>
                                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                                        </svg>
                                                                                                </div>
                                                                                                <div>
                                                                                                        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                                                                Edit Mode
                                                                                                        </h1>
                                                                                                        <p className={`text-sm ${isDarkMode ? 'text-amber-200' : 'text-amber-700'}`}>
                                                                                                                Review and edit the processed article before finalizing
                                                                                                        </p>
                                                                                                </div>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2">
                                                                                                <button
                                                                                                        onClick={handleCancelEdits}
                                                                                                        className={`px-4 py-2 text-sm font-medium rounded-md transition ${isDarkMode
                                                                                                                ? 'bg-slate-600 text-white hover:bg-slate-700'
                                                                                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                                                                }`}
                                                                                                >
                                                                                                        Cancel
                                                                                                </button>
                                                                                                <button
                                                                                                        onClick={handleSaveEdits}
                                                                                                        className={`px-4 py-2 text-sm font-medium text-white rounded-md transition ${isDarkMode
                                                                                                                ? 'bg-teal-600 hover:bg-teal-700'
                                                                                                                : 'bg-teal-700 hover:bg-teal-800'
                                                                                                                }`}
                                                                                                >
                                                                                                        Done Editing
                                                                                                </button>
                                                                                        </div>
                                                                                </div>
                                                                        </header>

                                                                        {/* Edit Mode Content */}
                                                                        <div className="p-5 sm:p-6 space-y-6">
                                                                                <EditableTitle
                                                                                        title={editableStoryData.title}
                                                                                        onChange={(title) => updateEditableData({ title })}
                                                                                        isDarkMode={isDarkMode}
                                                                                />

                                                                                <EditableSummary
                                                                                        summary={editableStoryData.summary}
                                                                                        onChange={(summary) => updateEditableData({ summary })}
                                                                                        isDarkMode={isDarkMode}
                                                                                />

                                                                                <EditableHighlights
                                                                                        highlights={editableStoryData.highlights}
                                                                                        onChange={(highlights) => updateEditableData({ highlights })}
                                                                                        isDarkMode={isDarkMode}
                                                                                />

                                                                                <div>
                                                                                        <div className="flex items-center justify-between mb-4">
                                                                                                <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                                                                                        Fact Sections
                                                                                                </label>
                                                                                                <button
                                                                                                        type="button"
                                                                                                        onClick={addFactSection}
                                                                                                        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition ${isDarkMode
                                                                                                                ? 'bg-teal-600 text-white hover:bg-teal-700'
                                                                                                                : 'bg-teal-700 text-white hover:bg-teal-800'
                                                                                                                }`}
                                                                                                >
                                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                                                                        </svg>
                                                                                                        Add Section
                                                                                                </button>
                                                                                        </div>
                                                                                        <div className="space-y-4">
                                                                                                {editableStoryData.factSections.map((section, index) => (
                                                                                                        <EditableFactSection
                                                                                                                key={section.id}
                                                                                                                section={section}
                                                                                                                onChange={(updatedSection) => updateFactSection(index, updatedSection)}
                                                                                                                onRemove={() => removeFactSection(index)}
                                                                                                                isDarkMode={isDarkMode}
                                                                                                        />
                                                                                                ))}
                                                                                                {editableStoryData.factSections.length === 0 && (
                                                                                                        <div className={`text-center p-6 border-2 border-dashed rounded-lg ${isDarkMode ? 'border-slate-600 text-slate-400' : 'border-gray-300 text-gray-500'
                                                                                                                }`}>
                                                                                                                <p className="text-sm">No sections yet. Click &quot;Add Section&quot; to create one.</p>
                                                                                                        </div>
                                                                                                )}
                                                                                        </div>
                                                                                </div>

                                                                                {/* Score Displays for Edit Mode */}
                                                                                {(editableStoryData.spiceScore || editableStoryData.similarityScore !== undefined) && (
                                                                                        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-700/50 border-slate-600/50' : 'bg-gray-50/80 border-gray-200'} border`}>
                                                                                                <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                                                                                                        Analysis Scores
                                                                                                </h3>
                                                                                                <div className="space-y-3">
                                                                                                        {editableStoryData.spiceScore && (
                                                                                                                <SpiceScoreDisplay scoreData={editableStoryData.spiceScore} isDarkMode={isDarkMode} />
                                                                                                        )}
                                                                                                        {editableStoryData.similarityScore !== undefined && (
                                                                                                                <SimilarityScoreDisplay score={editableStoryData.similarityScore} isDarkMode={isDarkMode} />
                                                                                                        )}
                                                                                                </div>
                                                                                        </div>
                                                                                )}
                                                                        </div>
                                                                </>
                                                        ) : (
                                                                <>
                                                                        {/* View Mode Display (existing content) */}
                                                                        {/* Header */}
                                                                        <header className={`p-5 sm:p-6 ${isDarkMode ? 'border-b border-slate-700' : 'border-b border-gray-200'}`}>
                                                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                                                                                        <h1 className={`text-2xl lg:text-3xl font-bold ${titleFont} leading-tight mb-2 sm:mb-0 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}> {storyData.title} </h1>
                                                                                        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.3 }} onClick={toggleTheme} aria-label="Toggle theme" className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-slate-600'}`} >
                                                                                                {isDarkMode ? (
                                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
                                                                                                ) : (
                                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                                                                                                )}
                                                                                        </motion.button>
                                                                                </div>
                                                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                                                                        <p className={`text-xs sm:text-sm mb-3 sm:mb-0 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                                                Source: <span className="font-medium">{storyData.source}</span>
                                                                                                {storyData.author && (<> | By: <span className="font-medium">{storyData.author}</span></>)}
                                                                                                {storyData.date && storyData.date !== 'Date not specified' && (<> | {storyData.date}</>)}
                                                                                        </p>
                                                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.3 }} className={`flex items-center space-x-2 p-1 rounded-md ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`} >
                                                                                                <button onClick={() => changeReadMode('summary')} className={`px-3 py-1 text-xs sm:text-sm font-medium rounded transition-colors ${readMode === 'summary' ? `${isDarkMode ? 'bg-teal-600 text-white shadow-sm' : 'bg-teal-700 text-white shadow-sm'}` : `${isDarkMode ? 'text-slate-300 hover:bg-slate-600/50' : 'text-gray-600 hover:bg-gray-200'}`}`} > Summary View </button>
                                                                                                <button onClick={() => changeReadMode('detailed')} className={`px-3 py-1 text-xs sm:text-sm font-medium rounded transition-colors ${readMode === 'detailed' ? `${isDarkMode ? 'bg-teal-600 text-white shadow-sm' : 'bg-teal-700 text-white shadow-sm'}` : `${isDarkMode ? 'text-slate-300 hover:bg-slate-600/50' : 'text-gray-600 hover:bg-gray-200'}`}`} > Detailed View </button>
                                                                                        </motion.div>
                                                                                </div>
                                                                        </header>


                                                                        {/* Main content grid */}
                                                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-5 sm:p-6">
                                                                                {/* Left Nav */}
                                                                                <motion.nav className="lg:col-span-3" variants={containerVariants} initial="hidden" animate="visible">
                                                                                        <div className="sticky top-6">
                                                                                                <h2 className={`text-xs font-semibold mb-3 uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                                                                                                        Explore Sections
                                                                                                </h2>
                                                                                                <div className="flex flex-col space-y-1.5">
                                                                                                        {(storyData.factSections ?? []).map((section: FactSection) => (
                                                                                                                <motion.button
                                                                                                                        key={section.id}
                                                                                                                        variants={sidebarItemVariants}
                                                                                                                        onClick={() => handleSectionClick(section.id)}
                                                                                                                        className={`w-full py-2.5 px-4 text-left rounded-md transition-colors text-sm font-medium ${activeSectionId === section.id ? `${isDarkMode ? 'bg-teal-600 text-white' : 'bg-teal-700 text-white'}` : `${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600/70 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`}`} > {section.title} </motion.button>
                                                                                                        ))}
                                                                                                        {(!storyData.factSections || storyData.factSections.length === 0) && (
                                                                                                                <motion.p variants={sidebarItemVariants} className={`text-sm px-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>No specific sections found.</motion.p>
                                                                                                        )}
                                                                                                </div>
                                                                                        </div>
                                                                                </motion.nav>

                                                                                {/* Center Content */}
                                                                                <motion.main className="lg:col-span-6 min-h-[400px]" variants={containerVariants} initial="hidden" animate="visible">
                                                                                        <HighlightsSummaryComponent story={storyData} isDarkMode={isDarkMode} />
                                                                                        <div className="space-y-6 mt-6">
                                                                                                <AnimatePresence mode="wait">
                                                                                                        {readMode === 'summary' && activeSectionData && (
                                                                                                                <motion.div key={activeSectionData.id} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout>
                                                                                                                        <FactSectionDisplay section={activeSectionData} isDarkMode={isDarkMode} />
                                                                                                                </motion.div>
                                                                                                        )}
                                                                                                </AnimatePresence>
                                                                                                {readMode === 'detailed' && (
                                                                                                        (storyData.factSections ?? []).map((section: FactSection) => (
                                                                                                                <FactSectionDisplay key={section.id} section={section} isDarkMode={isDarkMode} />
                                                                                                        ))
                                                                                                )}
                                                                                        </div>
                                                                                        {readMode === 'summary' && !activeSectionId && storyData.factSections && storyData.factSections.length > 0 && (
                                                                                                <AnimatePresence>
                                                                                                        <motion.div
                                                                                                                variants={itemVariants} initial="hidden" animate="visible" exit="exit"
                                                                                                                className={`text-center text-sm p-6 rounded-lg mt-6 ${isDarkMode ? 'text-slate-500 border-slate-700' : 'text-gray-400 border-gray-300'} border-2 border-dashed `}>
                                                                                                                Select a section from the left menu to view its details here.
                                                                                                        </motion.div>
                                                                                                </AnimatePresence>
                                                                                        )}
                                                                                        {(!storyData.factSections || storyData.factSections.length === 0) && (
                                                                                                <div className={`text-center text-sm p-6 rounded-lg mt-6 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                                                                                        No specific fact sections were generated for this article.
                                                                                                </div>
                                                                                        )}
                                                                                </motion.main>


                                                                                {/* ===== START: UPDATED Right Aside - Image & SPICE Display ===== */}
                                                                                <motion.aside className="lg:col-span-3" variants={containerVariants} initial="hidden" animate="visible">
                                                                                        <div className="sticky top-6 space-y-6">

                                                                                                {/* Story Details card (including SPICE score) */}
                                                                                                <motion.div variants={itemVariants} className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-700/50 border-slate-600/50' : 'bg-gray-50/80 border-gray-200'} border`}>
                                                                                                        <h3 className={`text-xs font-semibold mb-2.5 uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>Story Details</h3>
                                                                                                        <div className={`text-xs space-y-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                                                                                                {storyData.date && storyData.date !== 'Date not specified' && (<p><span className="font-medium">Published:</span> {storyData.date}</p>)}
                                                                                                                <p><span className="font-medium">Source:</span> {storyData.source}</p>
                                                                                                                <p><span className="font-medium">By:</span> {storyData.author || 'Not Available'}</p>
                                                                                                        </div>
                                                                                                        <a
                                                                                                                href={storyData.originalUrl}
                                                                                                                target="_blank"
                                                                                                                rel="noopener noreferrer"
                                                                                                                className={`mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded transition-colors shadow-sm ${isDarkMode
                                                                                                                        ? 'bg-teal-600 text-white hover:bg-teal-500'
                                                                                                                        : 'bg-teal-700 text-white hover:bg-teal-800'
                                                                                                                        }`}
                                                                                                        >
                                                                                                                View Original Article
                                                                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                                                                </svg>
                                                                                                        </a>

                                                                                                        {/* --- SPICE Score Display --- */}
                                                                                                        {isEditMode && storyData.spiceScore && (
                                                                                                                <SpiceScoreDisplay scoreData={storyData.spiceScore} isDarkMode={isDarkMode} />
                                                                                                        )}
                                                                                                        {/* --- End SPICE Score Display --- */}

                                                                                                        {/* Similarity Score Display */}
                                                                                                        {isEditMode && storyData.similarityScore !== undefined && (
                                                                                                                <SimilarityScoreDisplay score={storyData.similarityScore} isDarkMode={isDarkMode} />
                                                                                                        )}

                                                                                                </motion.div>

                                                                                                {/* --- Primary Image Display --- */}
                                                                                                {(storyData.imageUrl || imageLoadError) && (
                                                                                                        <motion.div variants={itemVariants} className={`rounded-lg overflow-hidden shadow ${isDarkMode ? 'bg-slate-700/80 border-slate-600/50' : 'bg-gray-50 border-gray-200'} border `}>
                                                                                                                <div className={`relative ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                                                                                                                        {storyData.imageUrl && !imageLoadError ? (
                                                                                                                                <motion.button
                                                                                                                                        type="button"
                                                                                                                                        onClick={() => storyData.imageUrl && handleImageClick(storyData.imageUrl)}
                                                                                                                                        className="w-full block cursor-pointer focus:outline-none group"
                                                                                                                                        whileHover={{ scale: 1.02 }}
                                                                                                                                        whileTap={{ scale: 0.99 }}
                                                                                                                                        title="Click to enlarge"
                                                                                                                                        disabled={!storyData.imageUrl}
                                                                                                                                >
                                                                                                                                        <img
                                                                                                                                                key={storyData.imageUrl}
                                                                                                                                                src={storyData.imageUrl}
                                                                                                                                                alt={storyData.title ? `${storyData.title} - primary image` : 'Article primary image'}
                                                                                                                                                className="w-full h-auto object-cover block transition-transform duration-200 group-hover:scale-105"
                                                                                                                                                loading="lazy"
                                                                                                                                                onError={() => {
                                                                                                                                                        console.warn("<<< Primary IMAGE ERROR >>> Primary image failed to load:", storyData.imageUrl);
                                                                                                                                                        setImageLoadError(true);
                                                                                                                                                }}
                                                                                                                                                onLoad={() => { if (imageLoadError) setImageLoadError(false); }}
                                                                                                                                        />
                                                                                                                                </motion.button>
                                                                                                                        ) : (
                                                                                                                                <div className="w-full aspect-video flex items-center justify-center">
                                                                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}> <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> </svg>
                                                                                                                                </div>
                                                                                                                        )}
                                                                                                                </div>
                                                                                                                <div className={`p-3 text-xs text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                                                                        {imageLoadError
                                                                                                                                ? 'Primary image could not be loaded'
                                                                                                                                : storyData.imageUrl
                                                                                                                                        ? 'Article primary image (click to enlarge)'
                                                                                                                                        : ''
                                                                                                                        }
                                                                                                                </div>
                                                                                                        </motion.div>
                                                                                                )}

                                                                                                {/* --- Additional Images Display --- */}
                                                                                                {storyData.imageUrls && storyData.imageUrls.length > 0 && (
                                                                                                        <motion.div variants={itemVariants} className="space-y-3">
                                                                                                                <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                                                                                                                        More Images
                                                                                                                </h4>
                                                                                                                <div className="grid grid-cols-2 gap-3">
                                                                                                                        {storyData.imageUrls.map((imgUrl, index) => (
                                                                                                                                <AdditionalImage
                                                                                                                                        key={imgUrl + '-' + index}
                                                                                                                                        src={imgUrl}
                                                                                                                                        alt={`Additional article image ${index + 1}`}
                                                                                                                                        isDarkMode={isDarkMode}
                                                                                                                                        onClick={() => handleImageClick(imgUrl)}
                                                                                                                                />
                                                                                                                        ))}
                                                                                                                </div>
                                                                                                        </motion.div>
                                                                                                )}
                                                                                                {/* --- END: Additional Images Display --- */}

                                                                                        </div>
                                                                                </motion.aside>
                                                                                {/* ===== END: UPDATED Right Aside ===== */}
                                                                        </div>

                                                                        {/* Footer */}
                                                                        <footer className={`p-4 text-center text-xs ${isDarkMode ? 'bg-slate-900 text-slate-500 border-t border-slate-700' : 'bg-gray-50 text-gray-500 border-t border-gray-200'}`}>
                                                                                New View News - Beta
                                                                        </footer>
                                                                </>
                                                        )}
                                                </motion.div>
                                        )}
                                </AnimatePresence>

                                {/* --- Image Overlay --- */}
                                <AnimatePresence>
                                        {enlargedImageUrl && (
                                                <ImageOverlay
                                                        imageUrl={enlargedImageUrl}
                                                        onClose={closeImageOverlay}
                                                />
                                        )}
                                </AnimatePresence>

                        </div>
                </div>
        );
};

export default SmartStorySuite;