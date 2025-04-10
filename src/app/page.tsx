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
    date: string;
    summary: string;
    highlights: string[];
    factSections: FactSection[];
    imageUrl?: string | null;
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

  // --- DEBUG LOG: Log state on re-render ---
  console.log("<<< RENDER CYCLE >>> storyData state:", storyData);
  console.log("<<< RENDER CYCLE >>> imageLoadError state:", imageLoadError);
  // --- END DEBUG LOG ---

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
     setActiveSectionId(null);
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      if (!urlInput || isLoading) return;

      setIsLoading(true);
      setError(null);
      setStoryData(null); // Clear previous data
      setActiveSectionId(null);
      setReadMode('summary');
      setImageLoadError(false);

      try {
           const response = await fetch('/api/process-article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ articleUrl: urlInput }),
           });
           const data = await response.json();

           // --- DEBUG LOG: Log raw data received from API ---
           console.log('<<< API RESPONSE >>> Raw data received:', data);
           // --- END DEBUG LOG ---

           if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status} ${response.statusText}`);
           }

           // --- DEBUG LOG: Check specifically for imageUrl before setting state ---
           console.log('<<< API RESPONSE >>> imageUrl in received data:', data?.imageUrl);
           // --- END DEBUG LOG ---

           setStoryData(data as StoryData);
       } catch (err: unknown) {
          console.error("Failed to process article:", err);
          let message = 'An unexpected error occurred.';
           if (err instanceof SyntaxError) {
               message = 'Received an invalid response format from the server.';
           } else if (err instanceof Error) {
               message = err.message || 'An unknown error occurred during processing.';
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
   }

   useEffect(() => {
        // --- DEBUG LOG: Log when this effect runs ---
        console.log("<<< EFFECT >>> Checking storyData.imageUrl:", storyData?.imageUrl);
        // --- END DEBUG LOG ---
        if (storyData?.imageUrl) {
            setImageLoadError(false);
            console.log("<<< EFFECT >>> Reset imageLoadError to false because imageUrl exists.");
        }
   }, [storyData?.imageUrl]); // Dependency is correct

   const activeSectionData = storyData?.factSections.find(s => s.id === activeSectionId);

  const bodyFont = 'font-sans';
  const titleFont = 'font-serif';

  return (
    <div className={`${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-gray-100 text-gray-800'} min-h-screen transition-colors duration-300 ${bodyFont}`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

        {/* Input Form Area */}
        <motion.div layout className={`mb-6 p-5 rounded-lg shadow ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border-gray-200/70'}`}>
             {/* Form content... */}
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
                        className={`flex-grow p-2 border rounded-md text-sm ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:ring-teal-500 focus:border-teal-500 transition`}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !urlInput}
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
                            className={`p-2 rounded-md text-sm transition ${isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0015.357 2m0 0H15" /></svg>
                        </button>
                    )}
                </div>
            </form>
            <AnimatePresence>
                {error && ( <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm"> <strong>Error:</strong> {error} </motion.div> )}
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
                 {/* Header content... */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                   <h1 className={`text-2xl lg:text-3xl font-bold ${titleFont} leading-tight mb-2 sm:mb-0 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}> {storyData.title} </h1>
                   <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.3 }} onClick={toggleTheme} aria-label="Toggle theme" className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-slate-600'}`} > {isDarkMode ? ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg> ) : ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg> )} </motion.button>
                 </div>
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                   <p className={`text-xs sm:text-sm mb-3 sm:mb-0 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}> Source: <span className="font-medium">{storyData.source}</span> | {storyData.date} </p>
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
                     {/* Nav content... */}
                      <div className="sticky top-6">
                         <h2 className={`text-xs font-semibold mb-3 uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}> Explore Sections </h2>
                         <div className="flex flex-col space-y-1.5">
                          {storyData.factSections.map((section: FactSection) => (
                             <motion.button key={section.id} variants={sidebarItemVariants} onClick={() => handleSectionClick(section.id)} className={`w-full py-2.5 px-4 text-left rounded-md transition-colors text-sm font-medium ${ activeSectionId === section.id ? `${isDarkMode ? 'bg-teal-600 text-white' : 'bg-teal-700 text-white'}` : `${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600/70 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'}` }`} > {section.title} </motion.button>
                           ))}
                         </div>
                     </div>
                 </motion.nav>

                {/* Center Content */}
                 <motion.main className="lg:col-span-6 min-h-[400px]" variants={containerVariants} initial="hidden" animate="visible">
                     {/* Main content... */}
                      <HighlightsSummaryComponent story={storyData} isDarkMode={isDarkMode} />
                     <div className="space-y-6 mt-6">
                         <AnimatePresence mode="wait"> {readMode === 'summary' && activeSectionData && ( <motion.div key={activeSectionData.id} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout> <FactSectionDisplay section={activeSectionData} isDarkMode={isDarkMode} /> </motion.div> )} </AnimatePresence>
                         {readMode === 'detailed' && ( storyData.factSections.map((section: FactSection) => ( <FactSectionDisplay key={section.id} section={section} isDarkMode={isDarkMode}/> )) )}
                     </div>
                     {readMode === 'summary' && !activeSectionId && storyData.factSections.length > 0 && ( <AnimatePresence> <motion.div variants={itemVariants} initial="hidden" animate="visible" exit="exit" className={`text-center text-sm p-6 rounded-lg mt-6 ${isDarkMode ? 'text-slate-500 border-slate-700' : 'text-gray-400 border-gray-300'} border-2 border-dashed `}> Select a section from the left menu to view its details here. </motion.div> </AnimatePresence> )}
                      {storyData.factSections.length === 0 && ( <div className={`text-center text-sm p-6 rounded-lg mt-6 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}> No specific fact sections were generated for this article. </div> )}
                 </motion.main>

                 {/* ===== START: UPDATED Right Aside - Image Display ===== */}
                 <motion.aside className="lg:col-span-3" variants={containerVariants} initial="hidden" animate="visible">
                     <div className="sticky top-6 space-y-6">
                        {/* Image Display with standard <img> and error handling */}
                        <motion.div variants={itemVariants} className={`rounded-lg overflow-hidden shadow ${isDarkMode ? 'bg-slate-700/80 border-slate-600/50' : 'bg-gray-50 border-gray-200'} border `}>

                            {/* --- TEMPORARILY SIMPLIFIED IMAGE RENDERING --- */}
                            <div className={`p-2 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}> {/* Added simple container */}
                                {(() => { console.log("<<< IMAGE RENDER (Simplified) >>> storyData.imageUrl:", storyData?.imageUrl); return null; })()}
                                {(() => { console.log("<<< IMAGE RENDER (Simplified) >>> imageLoadError:", imageLoadError); return null; })()}

                                {storyData.imageUrl && !imageLoadError ? (
                                    <img
                                        key={storyData.imageUrl + '-simplified'} // Change key slightly
                                        src={storyData.imageUrl}
                                        alt={storyData.title || 'Article image'}
                                        className="max-w-full h-auto block mx-auto" // Basic responsive image styling
                                        loading="lazy"
                                        onError={(e) => {
                                            console.warn("<<< IMAGE ERROR >>> Image failed to load, setting imageLoadError=true. URL:", storyData.imageUrl, "Event:", e);
                                            setImageLoadError(true);
                                        }}
                                        onLoad={() => {
                                            console.log("<<< IMAGE LOADED (Simplified) >>> Image successfully loaded:", storyData.imageUrl);
                                        }}
                                    />
                                ) : (
                                    // Show placeholder if no URL OR if error occurred
                                    <div className={`w-full h-24 flex items-center justify-center ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}> {/* Placeholder with defined height */}
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${isDarkMode? 'text-slate-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}> <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> </svg>
                                    </div>
                                )}
                            </div>
                             {/* --- END OF SIMPLIFIED BLOCK --- */}

                            {/* Image caption */}
                            <div className={`p-3 text-xs text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                {imageLoadError
                                    ? 'Image could not be loaded'
                                    : storyData.imageUrl
                                    ? 'Article main image'
                                    : 'No image found'}
                            </div>
                        </motion.div>

                        {/* Metadata card */}
                        <motion.div variants={itemVariants} className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-700/50 border-slate-600/50' : 'bg-gray-50/80 border-gray-200'} border`}>
                           {/* Metadata content... */}
                            <h3 className={`text-xs font-semibold mb-2 uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>Story Details</h3>
                            <div className={`text-xs space-y-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                <p><span className="font-medium">Published:</span> {storyData.date}</p>
                                <p><span className="font-medium">Source:</span> {storyData.source}</p>
                            </div>
                        </motion.div>
                    </div>
                 </motion.aside>
                 {/* ===== END: UPDATED Right Aside - Image Display ===== */}
              </div>

              {/* Footer */}
              <footer className={`p-4 text-center text-xs ${isDarkMode ? 'bg-slate-900 text-slate-500 border-t border-slate-700' : 'bg-gray-50 text-gray-500 border-t border-gray-200'}`}>
                Smart Story Suite - Powered by Anthropic Claude
              </footer>
            </motion.div>
         )}
        </AnimatePresence>
        {/* Initial state prompt */}
         {!storyData && !isLoading && !error && (
            <div className="text-center py-20">
               {/* Initial prompt content... */}
                <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Ready to Analyze!</h2>
               <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Enter an article URL above to get started.</p>
            </div>
         )}
      </div>
    </div>
  );
};

export default SmartStorySuite;