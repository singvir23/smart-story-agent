// src/app/page.tsx
"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Interfaces ---
interface FactSection {
    id: string;
    title: string;
    content: string;
}

interface StoryData {
    title: string;
    source: string;
    author?: string | null; // Author (optional)
    date: string;
    summary: string;
    highlights: string[];
    factSections: FactSection[];
    imageUrl?: string | null; // Primary image
    imageUrls?: string[]; // Additional images
    originalUrl: string; // Original URL
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
        // Wrap image in a button for accessibility and click handling
        <motion.button
            type="button"
            onClick={onClick}
            className={`w-full h-auto block rounded shadow-sm border overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkMode ? 'border-slate-600 focus:ring-teal-500 focus:ring-offset-slate-800' : 'border-gray-300 focus:ring-teal-600 focus:ring-offset-white'}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            title="Click to enlarge" // Tooltip
        >
            <img
                src={src}
                alt={alt}
                className={`w-full h-auto object-cover aspect-square block`} // aspect-square keeps it tidy
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
  // Close on escape key press
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
      key="image-overlay" // Key for AnimatePresence
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose} // Close when clicking the background
    >
      <motion.div
        className="relative max-w-full max-h-full"
        variants={enlargedImageVariants}
        onClick={(e) => e.stopPropagation()} // Prevent background click when clicking image itself
      >
        <img
          src={imageUrl}
          alt="Enlarged view"
          className="block max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" // Limit height, maintain aspect ratio
        />
         {/* Optional: Add a close button */}
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


// --- Main Component ---
const SmartStorySuite: React.FC = () => {
  const [urlInput, setUrlInput] = useState<string>('');
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [readMode, setReadMode] = useState<'summary' | 'detailed'>('summary');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false); // For PRIMARY image
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null); // State for enlarged image

  // Attempt to read initial dark mode preference from localStorage
  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedPreference = localStorage.getItem('darkMode');
    if (storedPreference !== null) {
      setIsDarkMode(storedPreference === 'true');
    } else {
      setIsDarkMode(prefersDark);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on initial load

  // Save dark mode preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);


  const toggleTheme = (): void => setIsDarkMode(!isDarkMode);

  const handleSectionClick = (sectionId: string): void => {
    setActiveSectionId(sectionId);
    if (readMode === 'detailed' && storyData) {
      // Scroll the detailed section into view
      setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Use 'start'
       }, 50); // Small delay allows DOM update
    } else if (readMode === 'summary') {
        // Optional: Scroll the main content area slightly if needed when section appears below summary
        const mainContentElement = document.querySelector('main'); // Adjust selector if needed
        mainContentElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const changeReadMode = (newMode: 'summary' | 'detailed'): void => {
     setReadMode(newMode);
     setActiveSectionId(null); // Reset active section when changing mode
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      if (!urlInput || isLoading) return;

      setIsLoading(true);
      setError(null);
      setStoryData(null); // Clear previous data
      setActiveSectionId(null);
      setReadMode('summary');
      setImageLoadError(false); // Reset primary image error state
      setEnlargedImageUrl(null); // Close any enlarged image on new submit

      try {
           const response = await fetch('/api/process-article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ articleUrl: urlInput }),
           });
           const data = await response.json();

           console.log('<<< API RESPONSE >>> Raw data received:', data);

           if (!response.ok) {
                // Prioritize error message from API response if available
                const errorMsg = data?.error || `Request failed with status: ${response.status} ${response.statusText}`;
                // Provide a more user-friendly message for common backend/network issues
                 if (response.status >= 500 && response.status < 600) {
                     throw new Error("Something wasn’t right with the analysis service. Please try pasting the URL again or try a different article.");
                 } else if (response.status === 400) {
                     // Include specific message if available (e.g., Invalid URL)
                     throw new Error(`Invalid request${data?.error ? `: ${data.error}` : '.'} Please check the URL.`);
                 } else if (response.status === 403 || response.status === 404) {
                     // Include specific message like 'Access denied' or 'Not Found'
                     throw new Error(`Could not access article: ${errorMsg}`);
                 }
                throw new Error(errorMsg); // Use the specific error from backend if not caught above
           }

           console.log('<<< API RESPONSE >>> Primary imageUrl:', data?.imageUrl);
           console.log('<<< API RESPONSE >>> Additional imageUrls count:', data?.imageUrls?.length ?? 0);

           setStoryData(data as StoryData); // Cast to StoryData
       } catch (err: unknown) {
          console.error("Failed to process article:", err);
          let message = 'An unexpected error occurred. Please try again.'; // Default friendly message
           if (err instanceof Error) {
               // Use the specific error message thrown in the try block or caught here
               message = err.message;
           }
           // Add specific message for the USA Today scenario mentioned (transient fetch issues)
           if (message.toLowerCase().includes('fetch') || message.toLowerCase().includes('network') || message.toLowerCase().includes('service')) {
              message = "Something wasn’t right. Please check your connection and try pasting the URL again.";
           }
           setError(message);
           setStoryData(null); // Ensure data is null on error
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
        setEnlargedImageUrl(null); // Close enlarged image on reset
   }

   // Reset primary image error state when new data arrives with a primary image
   useEffect(() => {
        if (storyData?.imageUrl) {
            setImageLoadError(false); // Reset primary image error specifically
            console.log("<<< EFFECT >>> Reset primary imageLoadError to false because storyData.imageUrl exists.");
        }
   }, [storyData?.imageUrl]); // Dependency is ONLY the primary image URL

   const activeSectionData = storyData?.factSections.find(s => s.id === activeSectionId);

   // Function to handle image click
   const handleImageClick = (imageUrl: string) => {
       setEnlargedImageUrl(imageUrl);
   };

   // Function to close the overlay
   const closeImageOverlay = () => {
       setEnlargedImageUrl(null);
   };


  const bodyFont = 'font-sans';
  const titleFont = 'font-serif'; // Keep serif for titles

  return (
    <div className={`${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-100 text-gray-800'} min-h-screen transition-colors duration-300 ${bodyFont}`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

        {/* --- Initial Instructions Area --- */}
         {!storyData && !isLoading && !error && (
          <div className="text-center mb-8 pt-10">
              <h2 className={`text-2xl font-semibold mb-3 ${titleFont} ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  New View News Analyzer
              </h2>
             <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-500'} text-sm max-w-md mx-auto`}>
                 Enter the article URL below to either scan details or dive deep into its structure and content.
             </p>
          </div>
        )}

        {/* Input Form Area */}
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
                        // Full input styles:
                        className={`flex-grow p-2 border rounded-md text-sm ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:ring-teal-500 focus:border-teal-500 transition`}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !urlInput}
                         // Full submit button styles:
                        className={`px-4 py-2 rounded-md font-semibold text-sm transition flex items-center justify-center whitespace-nowrap ${
                            isLoading
                                ? `cursor-not-allowed ${isDarkMode ? 'bg-slate-600 text-slate-400' : 'bg-gray-300 text-gray-500'}`
                                : `text-white ${isDarkMode ? 'bg-teal-600 hover:bg-teal-700' : 'bg-teal-700 hover:bg-teal-800'} disabled:opacity-50 disabled:cursor-not-allowed`
                        }`}
                    >
                         {isLoading ? ( <> <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> Processing... </> ) : ( 'Analyze Article' )}
                    </button>
                    {storyData && !isLoading && (
                        <button
                            type="button"
                            onClick={handleReset}
                            title="Analyze another article"
                             // Full reset button styles:
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
                        // Full error message styles:
                        className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm"
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
              {/* Header */}
               <header className={`p-5 sm:p-6 ${isDarkMode ? 'border-b border-slate-700' : 'border-b border-gray-200'}`}>
                    {/* Title, Theme Toggle */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                        <h1 className={`text-2xl lg:text-3xl font-bold ${titleFont} leading-tight mb-2 sm:mb-0 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}> {storyData.title} </h1>
                        {/* Full Theme Toggle Button */}
                        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.3 }} onClick={toggleTheme} aria-label="Toggle theme" className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-slate-600'}`} >
                            {isDarkMode ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
                             ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                             )}
                        </motion.button>
                    </div>
                    {/* Source/Author/Date, View Mode Toggle */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <p className={`text-xs sm:text-sm mb-3 sm:mb-0 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            Source: <span className="font-medium">{storyData.source}</span>
                            {storyData.author && (<> | By: <span className="font-medium">{storyData.author}</span></>)}
                            {storyData.date && storyData.date !== 'Date not specified' && (<> | {storyData.date}</>)}
                        </p>
                        {/* Full View Mode Buttons */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.3 }} className={`flex items-center space-x-2 p-1 rounded-md ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`} >
                            <button onClick={() => changeReadMode('summary')} className={`px-3 py-1 text-xs sm:text-sm font-medium rounded transition-colors ${ readMode === 'summary' ? `${isDarkMode ? 'bg-teal-600 text-white shadow-sm' : 'bg-teal-700 text-white shadow-sm'}` : `${isDarkMode ? 'text-slate-300 hover:bg-slate-600/50' : 'text-gray-600 hover:bg-gray-200'}` }`} > Summary View </button>
                            <button onClick={() => changeReadMode('detailed')} className={`px-3 py-1 text-xs sm:text-sm font-medium rounded transition-colors ${ readMode === 'detailed' ? `${isDarkMode ? 'bg-teal-600 text-white shadow-sm' : 'bg-teal-700 text-white shadow-sm'}` : `${isDarkMode ? 'text-slate-300 hover:bg-slate-600/50' : 'text-gray-600 hover:bg-gray-200'}` }`} > Detailed View </button>
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
                                // Full Section Button Styles:
                                className={`w-full py-2.5 px-4 text-left rounded-md transition-colors text-sm font-medium ${ activeSectionId === section.id ? `${isDarkMode ? 'bg-teal-600 text-white' : 'bg-teal-700 text-white'}` : `${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600/70 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'}` }`} > {section.title} </motion.button>
                           ))}
                           {(!storyData.factSections || storyData.factSections.length === 0) && (
                             // Full No Sections Message Styles:
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
                                <FactSectionDisplay key={section.id} section={section} isDarkMode={isDarkMode}/>
                             ))
                         )}
                     </div>
                      {/* Prompt to select section */}
                     {readMode === 'summary' && !activeSectionId && storyData.factSections && storyData.factSections.length > 0 && (
                        <AnimatePresence>
                            <motion.div
                                variants={itemVariants} initial="hidden" animate="visible" exit="exit"
                                // Full Dashed Box Styles:
                                className={`text-center text-sm p-6 rounded-lg mt-6 ${isDarkMode ? 'text-slate-500 border-slate-700' : 'text-gray-400 border-gray-300'} border-2 border-dashed `}>
                                Select a section from the left menu to view its details here.
                            </motion.div>
                        </AnimatePresence>
                     )}
                      {/* Message if no sections */}
                      {(!storyData.factSections || storyData.factSections.length === 0) && (
                        // Full No Sections Message (Detailed View) Styles:
                        <div className={`text-center text-sm p-6 rounded-lg mt-6 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                            No specific fact sections were generated for this article.
                        </div>
                      )}
                 </motion.main>


                 {/* ===== START: UPDATED Right Aside - Image Display ===== */}
                 <motion.aside className="lg:col-span-3" variants={containerVariants} initial="hidden" animate="visible">
                     <div className="sticky top-6 space-y-6">

                        {/* Story Details card */}
                        <motion.div variants={itemVariants} className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-700/50 border-slate-600/50' : 'bg-gray-50/80 border-gray-200'} border`}>
                            <h3 className={`text-xs font-semibold mb-2.5 uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>Story Details</h3>
                            <div className={`text-xs space-y-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                {storyData.date && storyData.date !== 'Date not specified' && ( <p><span className="font-medium">Published:</span> {storyData.date}</p> )}
                                <p><span className="font-medium">Source:</span> {storyData.source}</p>
                                <p><span className="font-medium">By:</span> {storyData.author || 'Not Available'}</p>
                            </div>
                             {/* Full View Original Button */}
                             <a
                                href={storyData.originalUrl} // Use the URL passed from backend
                                target="_blank" // Open in new tab
                                rel="noopener noreferrer" // Security best practice
                                className={`mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded transition-colors shadow-sm ${
                                    isDarkMode
                                    ? 'bg-teal-600 text-white hover:bg-teal-500'
                                    : 'bg-teal-700 text-white hover:bg-teal-800'
                                }`}
                            >
                                View Original Article
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </motion.div>

                        {/* --- Primary Image Display (with click handler) --- */}
                        {(storyData.imageUrl || imageLoadError) && (
                            <motion.div variants={itemVariants} className={`rounded-lg overflow-hidden shadow ${isDarkMode ? 'bg-slate-700/80 border-slate-600/50' : 'bg-gray-50 border-gray-200'} border `}>
                                <div className={`relative ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                                    {storyData.imageUrl && !imageLoadError ? (
                                        // Make the image clickable
                                        <motion.button
                                            type="button"
                                            onClick={() => handleImageClick(storyData.imageUrl!)}
                                            className="w-full block cursor-pointer focus:outline-none group" // group for hover effect
                                            whileHover={{ scale: 1.02 }} // Framer motion hover
                                            whileTap={{ scale: 0.99 }}   // Framer motion tap
                                            title="Click to enlarge"
                                        >
                                            <img
                                                key={storyData.imageUrl}
                                                src={storyData.imageUrl}
                                                alt={storyData.title ? `${storyData.title} - primary image` : 'Article primary image'}
                                                className="w-full h-auto object-cover block transition-transform duration-200 group-hover:scale-105" // Tailwind CSS hover (optional fallback/addition)
                                                loading="lazy"
                                                onError={() => {
                                                    console.warn("<<< Primary IMAGE ERROR >>> Primary image failed to load:", storyData.imageUrl);
                                                    setImageLoadError(true);
                                                }}
                                                onLoad={() => { if(imageLoadError) setImageLoadError(false); }}
                                            />
                                        </motion.button>
                                    ) : (
                                        // Placeholder shown if no URL or if error occurred
                                        <div className="w-full aspect-video flex items-center justify-center"> {/* Aspect ratio placeholder */}
                                            {/* Full Placeholder SVG */}
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${isDarkMode? 'text-slate-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}> <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> </svg>
                                        </div>
                                    )}
                                </div>
                                {/* Primary Image caption */}
                                <div className={`p-3 text-xs text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {imageLoadError
                                        ? 'Primary image could not be loaded'
                                        : storyData.imageUrl
                                        ? 'Article primary image (click to enlarge)' // Updated caption
                                        : ''
                                    }
                                </div>
                            </motion.div>
                        )}

                        {/* --- Additional Images Display (with click handler) --- */}
                        {storyData.imageUrls && storyData.imageUrls.length > 0 && (
                           <motion.div variants={itemVariants} className="space-y-3">
                              <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                                  More Images
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                  {storyData.imageUrls.map((imgUrl, index) => (
                                     <AdditionalImage
                                         key={imgUrl + '-' + index} // Use URL + index as key
                                         src={imgUrl}
                                         alt={`Additional article image ${index + 1}`}
                                         isDarkMode={isDarkMode}
                                         onClick={() => handleImageClick(imgUrl)} // Pass click handler
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
                New View News
              </footer>
            </motion.div>
         )}
        </AnimatePresence>

        {/* --- Image Overlay (Rendered Conditionally at the bottom) --- */}
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