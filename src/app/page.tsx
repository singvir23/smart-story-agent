// src/app/page.tsx
"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Interfaces ---
interface FactSection {
    id: string;
    title: string;
    content: string;
}

// Updated StoryData interface to include imageUrl
interface StoryData {
    title: string;
    source: string;
    date: string;
    summary: string;
    highlights: string[];
    factSections: FactSection[];
    imageUrl?: string | null; // Added optional imageUrl
}

// --- Animation Variants (Ensure these are defined correctly) ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.1, // Reduced stagger slightly
    },
  },
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 120, damping: 18 } // Adjusted spring
  },
  exit: {
    y: -10,
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const sidebarItemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.25, ease: "easeOut" } } // Slightly faster ease
}

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
        key={section.id} // Key is important for AnimatePresence if used here, or list rendering
        variants={itemVariants}
        layout // Enable smooth layout animation
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

// --- Main Component ---
const SmartStorySuite: React.FC = () => {
  const [urlInput, setUrlInput] = useState<string>('');
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [readMode, setReadMode] = useState<'summary' | 'detailed'>('summary');

  // Add Dark Mode State back
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false); // Default light

  // Add Theme Toggle Function back
  const toggleTheme = (): void => setIsDarkMode(!isDarkMode);

  const handleSectionClick = (sectionId: string): void => {
    setActiveSectionId(sectionId);
    if (readMode === 'detailed' && storyData) {
      setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
       }, 50);
    }
  };

  const changeReadMode = (newMode: 'summary' | 'detailed'): void => {
     setReadMode(newMode);
     setActiveSectionId(null); // Reset selection when switching modes
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      if (!urlInput || isLoading) return;

      setIsLoading(true);
      setError(null);
      setStoryData(null);
      setActiveSectionId(null);
      setReadMode('summary');

      try {
           const response = await fetch('/api/process-article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ articleUrl: urlInput }),
           });
           const data = await response.json(); // Try to parse JSON regardless of status first
           if (!response.ok) {
                // Use error from JSON body if available, otherwise use status text
                throw new Error(data.error || `HTTP error! status: ${response.status} ${response.statusText}`);
           }
           setStoryData(data as StoryData); // Set data on success
       } catch (err: any) {
          console.error("Failed to process article:", err);
          // Improved error handling
          if (err instanceof SyntaxError) {
              // This means response.ok was likely true, but body wasn't JSON (shouldn't happen with proper API)
              // OR response.ok was false and body was HTML error page
              setError('Received an invalid response format from the server.');
          } else if (err instanceof Error) {
              setError(err.message || 'An unknown error occurred during processing.');
          } else {
              setError('An unexpected error occurred.');
          }
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
   }

   const activeSectionData = storyData?.factSections.find(s => s.id === activeSectionId);

  // --- Render Logic ---
  const bodyFont = 'font-sans';
  const titleFont = 'font-serif'; // Ensure configured in Tailwind or use 'font-sans font-bold'

  return (
    // Add conditional dark mode classes back
    <div className={`${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-100 text-gray-800'} min-h-screen transition-colors duration-300 ${bodyFont}`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

        {/* Input Form Area - Add conditional dark mode classes */}
        <motion.div layout className={`mb-6 p-5 rounded-lg shadow ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200/70'}`}>
            <form onSubmit={handleSubmit}>
                <label htmlFor="articleUrl" className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Enter Article URL
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
                        // Add conditional dark mode classes
                        className={`flex-grow p-2 border rounded-md text-sm ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:ring-teal-500 focus:border-teal-500 transition`}
                        disabled={isLoading}
                    />
                    {/* Analyze Button */}
                    <button
                        type="submit"
                        disabled={isLoading || !urlInput}
                        className={`px-4 py-2 rounded-md font-semibold text-sm transition flex items-center justify-center whitespace-nowrap ${
                            isLoading
                                ? `cursor-not-allowed ${isDarkMode ? 'bg-slate-600 text-slate-400' : 'bg-gray-300 text-gray-500'}`
                                : `text-white ${isDarkMode ? 'bg-teal-600 hover:bg-teal-700' : 'bg-teal-700 hover:bg-teal-800'} disabled:opacity-50 disabled:cursor-not-allowed`
                        }`}
                    >
                        {isLoading ? (
                             <> {/* Loading Spinner SVG */} </>
                        ) : ( 'Analyze Article' )}
                    </button>
                    {/* Reset Button - Add conditional dark mode classes */}
                    {storyData && !isLoading && (
                        <button
                            type="button"
                            onClick={handleReset}
                            title="Analyze another article"
                            className={`p-2 rounded-md text-sm transition ${isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                        >
                             {/* Reset Icon SVG */}
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0015.357 2m0 0H15" /></svg>
                        </button>
                    )}
                </div>
            </form>
            {/* Error Display */}
            <AnimatePresence>
                {error && ( <motion.div /* ... animation props ... */ className="mt-3 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm"> <strong>Error:</strong> {error} </motion.div> )}
            </AnimatePresence>
        </motion.div>

        {/* --- Story Display Area (Conditional) --- */}
        <AnimatePresence>
         {storyData && !isLoading && (
            // Main card - Add conditional dark mode classes
            <motion.div
                key="story-display"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5 }}
                className={`rounded-lg shadow-lg overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200/70'} border`}
            >
              {/* Header - Add conditional dark mode classes */}
              <header className={`p-5 sm:p-6 ${isDarkMode ? 'border-b border-slate-700' : 'border-b border-gray-200'}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                  {/* Title - Add conditional dark mode classes */}
                  <h1 className={`text-2xl lg:text-3xl font-bold ${titleFont} leading-tight mb-2 sm:mb-0 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {storyData.title}
                  </h1>
                   {/* !!! Add Theme Toggle Button back !!! */}
                   <motion.button
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.3 }}
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        // Add conditional dark mode classes
                        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-slate-600'}`}
                    >
                        {isDarkMode ? ( /* Sun Icon SVG */ <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
                         ) : ( /* Moon Icon SVG */ <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                         )}
                   </motion.button>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                   {/* Metadata p tag - Add conditional dark mode classes */}
                  <p className={`text-xs sm:text-sm mb-3 sm:mb-0 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Source: <span className="font-medium">{storyData.source}</span> | {storyData.date}
                  </p>
                   {/* Read mode toggle container - Add conditional dark mode classes and FIX SPACING */}
                  <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.3 }}
                      // Fixed spacing: Added space-x-2
                      className={`flex items-center space-x-2 p-1 rounded-md ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}
                    >
                     {/* Summary Button - Add conditional dark mode classes */}
                     <button onClick={() => changeReadMode('summary')} className={`px-3 py-1 text-xs sm:text-sm font-medium rounded transition-colors ${ readMode === 'summary' ? `${isDarkMode ? 'bg-teal-600 text-white shadow-sm' : 'bg-teal-700 text-white shadow-sm'}` : `${isDarkMode ? 'text-slate-300 hover:bg-slate-600/50' : 'text-gray-600 hover:bg-gray-200'}` }`} > Summary View </button>
                     {/* Detailed Button - Add conditional dark mode classes */}
                     <button onClick={() => changeReadMode('detailed')} className={`px-3 py-1 text-xs sm:text-sm font-medium rounded transition-colors ${ readMode === 'detailed' ? `${isDarkMode ? 'bg-teal-600 text-white shadow-sm' : 'bg-teal-700 text-white shadow-sm'}` : `${isDarkMode ? 'text-slate-300 hover:bg-slate-600/50' : 'text-gray-600 hover:bg-gray-200'}` }`} > Detailed View </button>
                  </motion.div>
                </div>
              </header>

              {/* Main content grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-5 sm:p-6">
                {/* Left Nav */}
                <motion.nav className="lg:col-span-3" variants={containerVariants} initial="hidden" animate="visible">
                    <div className="sticky top-6">
                        {/* Section title - Add conditional dark mode classes */}
                        <h2 className={`text-xs font-semibold mb-3 uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                        Explore Sections
                        </h2>
                        <div className="flex flex-col space-y-1.5">
                         {storyData.factSections.map((section: FactSection) => (
                            <motion.button
                                key={section.id}
                                variants={sidebarItemVariants}
                                onClick={() => handleSectionClick(section.id)}
                                // Nav button - Add conditional dark mode classes
                                className={`w-full py-2.5 px-4 text-left rounded-md transition-colors text-sm font-medium ${
                                    activeSectionId === section.id
                                    ? `${isDarkMode ? 'bg-teal-600 text-white' : 'bg-teal-700 text-white'}`
                                    : `${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600/70 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`
                                }`}
                            >
                                {section.title}
                            </motion.button>
                          ))}
                        </div>
                    </div>
                </motion.nav>

                {/* Center Content */}
                <motion.main className="lg:col-span-6 min-h-[400px]" variants={containerVariants} initial="hidden" animate="visible">
                    {/* Pass isDarkMode prop */}
                    <HighlightsSummaryComponent story={storyData} isDarkMode={isDarkMode} />

                    <div className="space-y-6 mt-6">
                        <AnimatePresence mode="wait">
                            {readMode === 'summary' && activeSectionData && (
                                <motion.div key={activeSectionData.id} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout>
                                    {/* Pass isDarkMode prop */}
                                    <FactSectionDisplay section={activeSectionData} isDarkMode={isDarkMode} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {readMode === 'detailed' && (
                             storyData.factSections.map((section: FactSection) => (
                                // Pass isDarkMode prop
                                <FactSectionDisplay key={section.id} section={section} isDarkMode={isDarkMode}/>
                             ))
                        )}
                    </div>

                    {/* Placeholder - Add conditional dark mode classes */}
                    {readMode === 'summary' && !activeSectionId && storyData.factSections.length > 0 && (
                        <AnimatePresence>
                            <motion.div variants={itemVariants} initial="hidden" animate="visible" exit="exit"
                                className={`text-center text-sm p-6 rounded-lg mt-6 ${isDarkMode ? 'text-slate-500 border-slate-700' : 'text-gray-400 border-gray-300'} border-2 border-dashed `}>
                                Select a section from the left menu to view its details here.
                            </motion.div>
                        </AnimatePresence>
                    )}
                     {/* Empty sections message - Add conditional dark mode classes */}
                     {storyData.factSections.length === 0 && (
                         <div className={`text-center text-sm p-6 rounded-lg mt-6 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                            No specific fact sections were generated for this article.
                         </div>
                     )}

                </motion.main>

                {/* Right Aside */}
                 <motion.aside className="lg:col-span-3" variants={containerVariants} initial="hidden" animate="visible">
                     <div className="sticky top-6 space-y-6">
                        {/* Image Display - Add conditional dark mode classes */}
                        <motion.div variants={itemVariants} className={`rounded-lg overflow-hidden shadow ${isDarkMode ? 'bg-slate-700/80 border-slate-600/50' : 'bg-gray-50 border-gray-200'} border `}>
                             {/* Conditional Image or Placeholder */}
                             {storyData.imageUrl ? (
                                <div className="aspect-w-16 aspect-h-9 w-full bg-gray-200 dark:bg-slate-600"> {/* Add bg color for loading state */}
                                    <img
                                        src={storyData.imageUrl}
                                        alt={storyData.title || 'Article image'}
                                        className="w-full h-full object-cover"
                                        // Optional: add error handling for broken images
                                        onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image fails
                                    />
                                     {/* You could show an icon overlay if onError triggers */}
                                </div>
                             ) : (
                                // Placeholder SVG Box
                                <div className={`aspect-w-16 aspect-h-9 w-full flex items-center justify-center ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${isDarkMode? 'text-slate-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}> <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> </svg>
                                </div>
                             )}
                            {/* Image caption - Add conditional dark mode classes */}
                            <div className={`p-3 text-xs text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                {storyData.imageUrl ? 'Article main image' : 'Article analysis complete'}
                            </div>
                        </motion.div>
                        {/* Metadata card - Add conditional dark mode classes */}
                        <motion.div variants={itemVariants} className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-700/50 border-slate-600/50' : 'bg-gray-50/80 border-gray-200'} border`}>
                            {/* Title - Add conditional dark mode classes */}
                            <h3 className={`text-xs font-semibold mb-2 uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>Story Details</h3>
                            {/* Text - Add conditional dark mode classes */}
                            <div className={`text-xs space-y-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                <p><span className="font-medium">Published:</span> {storyData.date}</p>
                                <p><span className="font-medium">Source:</span> {storyData.source}</p>
                            </div>
                        </motion.div>
                    </div>
                 </motion.aside>
              </div>

              {/* Footer - Add conditional dark mode classes */}
              <footer className={`p-4 text-center text-xs ${isDarkMode ? 'bg-slate-900 text-slate-500 border-t border-slate-700' : 'bg-gray-50 text-gray-500 border-t border-gray-200'}`}>
                Smart Story Suite - Powered by Anthropic Claude
              </footer>
            </motion.div>
         )}
        </AnimatePresence>
        {/* Initial state prompt - Add conditional dark mode classes */}
         {!storyData && !isLoading && !error && (
            <div className="text-center py-20">
                <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Ready to Analyze!</h2>
                <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Enter an article URL above to get started.</p>
            </div>
         )}

      </div>
    </div>
  );
};

export default SmartStorySuite;