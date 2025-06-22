"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { posthog } from '@/lib/posthog';
import { StoryData, FactSection } from '@/lib/types';
import { StoryHeader } from '@/components/story/StoryHeader';
import { StoryNavigation } from '@/components/story/StoryNavigation';
import { StoryContent } from '@/components/story/StoryContent';
import { StorySidebar } from '@/components/story/StorySidebar';
import { ImageOverlay } from '@/components/story/ImageComponents';
import { EditableTitle, EditableSummary, EditableHighlights, EditableFactSection, EditableVideoSection, EditablePictures } from '@/components/story/EditModeComponents';
import { SpiceScoreDisplay, SimilarityScoreDisplay } from '@/components/story/ScoreDisplays';

const SmartStorySuite: React.FC = () => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [readMode, setReadMode] = useState<'summary' | 'detailed'>('summary');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const isDarkMode = true; // Always use dark mode
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editableStoryData, setEditableStoryData] = useState<StoryData | null>(null);

  const activeSectionData = storyData?.factSections?.find(section => section.id === activeSectionId) || null;

  // Removed dark mode toggle - always dark mode

  const handleSectionClick = (sectionId: string): void => {
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
      const offsetTop = targetElement.offsetTop - 100;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
    setActiveSectionId(sectionId);
  };

  const changeReadMode = (newMode: 'summary' | 'detailed'): void => {
    setReadMode(newMode);
    setActiveSectionId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!urlInput.trim()) return;

    setIsLoading(true);
    setError('');
    setStoryData(null);
    setActiveSectionId(null);

    try {
      const response = await fetch('/api/process-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleUrl: urlInput.trim() }),
      });

      const data = await response.json();

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

      const processedData = data as StoryData;
      processedData.videos = processedData?.videos ?? [];
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
    setError('');
    setIsLoading(false);
    setActiveSectionId(null);
    setEnlargedImageUrl(null);
    setIsEditMode(false);
    setEditableStoryData(null);
  };

  const handleImageClick = (imageUrl: string) => {
    setEnlargedImageUrl(imageUrl);
  };

  const closeImageOverlay = () => {
    setEnlargedImageUrl(null);
  };

  const handleSaveEdits = () => {
    if (editableStoryData) {
      setStoryData(editableStoryData);
      setIsEditMode(false);
      setEditableStoryData(null);
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
      const newSections = [...editableStoryData.factSections];
      newSections[index] = updatedSection;
      setEditableStoryData({
        ...editableStoryData,
        factSections: newSections
      });
    }
  };

  const removeFactSection = (index: number) => {
    if (editableStoryData) {
      setEditableStoryData({
        ...editableStoryData,
        factSections: editableStoryData.factSections.filter((_, i) => i !== index)
      });
    }
  };

  const addFactSection = () => {
    if (editableStoryData) {
      const newSection: FactSection = {
        id: `section_${Date.now()}`,
        title: 'New Section',
        content: ''
      };
      setEditableStoryData({
        ...editableStoryData,
        factSections: [...editableStoryData.factSections, newSection]
      });
    }
  };

  const updateVideoSection = (videos: string[]) => {
    if (editableStoryData) {
      setEditableStoryData({ 
        ...editableStoryData, 
        videos
      });
    }
  };

  const bodyFont = 'font-sans';
  const titleFont = 'font-serif';

  // Initialize PostHog
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: 'https://us.i.posthog.com',
      capture_pageview: true,
      autocapture: true,
      rageclick: true
    })
  }, []);

  return (
    <div className={`${isDarkMode ? 'dark bg-slate-900 text-slate-200' : 'bg-gray-100 text-gray-800'} min-h-screen transition-colors duration-300 ${bodyFont}`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

        {/* Welcome Message */}
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

        {/* URL Input Form */}
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
                className={`px-4 py-2 rounded-md font-semibold text-sm transition flex items-center justify-center whitespace-nowrap ${
                  isLoading
                    ? `cursor-not-allowed ${isDarkMode ? 'bg-slate-600 text-slate-400' : 'bg-gray-300 text-gray-500'}`
                    : `text-white ${isDarkMode ? 'bg-teal-600 hover:bg-teal-700' : 'bg-teal-700 hover:bg-teal-800'} disabled:opacity-50 disabled:cursor-not-allowed`
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Analyze Article'
                )}
              </button>
              {storyData && !isLoading && (
                <button
                  type="button"
                  onClick={handleReset}
                  title="Analyze another article"
                  className={`p-2 rounded-md text-sm transition ${isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0015.357 2m0 0H15" />
                  </svg>
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

        {/* Story Display Area */}
        <AnimatePresence>
          {storyData && !isLoading && (
            <motion.div
              key="story-display"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              transition={{ duration: 0.5 }}
              className={`rounded-lg shadow-lg overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200/70'} border`}
            >
              {/* Edit Mode Display */}
              {isEditMode && editableStoryData ? (
                <>
                  {/* Edit Mode Header */}
                  <header className="bg-slate-800 border-b border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-teal-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold text-white">Story Editor</h1>
                          <p className="text-slate-400">Edit and enhance your article content</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleCancelEdits}
                          className="px-6 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdits}
                          className="px-6 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
                        >
                          Publish Story
                        </button>
                      </div>
                    </div>
                  </header>

                  {/* Edit Mode Layout */}
                  <div className="grid grid-cols-12 gap-0 min-h-screen">
                    {/* Main Content Area */}
                    <div className="col-span-8 bg-slate-900 p-8">
                      <div className="max-w-4xl mx-auto space-y-8">
                        {/* Article Content */}
                        <div className="space-y-6">
                          <EditableTitle
                            title={editableStoryData.title}
                            onChange={(title) => updateEditableData({ title })}
                            isDarkMode={isDarkMode}
                          />
                          <EditableHighlights
                            highlights={editableStoryData.highlights}
                            onChange={(highlights) => updateEditableData({ highlights })}
                            isDarkMode={isDarkMode}
                          />                   
                          <EditableVideoSection
                            videos={editableStoryData.videos}
                            onChange={(videos) => {updateVideoSection(videos)}}
                            isDarkMode={isDarkMode}
                          />
                          <EditableSummary
                            summary={editableStoryData.summary}
                            onChange={(summary) => updateEditableData({ summary })}
                            isDarkMode={isDarkMode}
                          />
                          
                          
                        </div>

                        {/* Fact Sections */}
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-white">Article Sections</h3>
                            <button
                              type="button"
                              onClick={addFactSection}
                              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition"
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
                              <div className="text-center p-8 border-2 border-dashed border-slate-600 rounded-lg">
                                <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <p className="text-slate-400 text-lg">No sections yet</p>
                                <p className="text-slate-500 text-sm">Click "Add Section" to create your first content section</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tools Sidebar */}
                    <div className="col-span-4 bg-slate-800 border-l border-slate-700 p-6 overflow-y-auto">
                      <div className="space-y-8">
                        {/* Analytics */}
                        {(editableStoryData.spiceScore || editableStoryData.similarityScore) && (
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Analytics</h3>
                            <div className="space-y-4">
                              {editableStoryData.spiceScore && (
                                <div className="p-4 bg-slate-700/50 rounded-lg">
                                  <SpiceScoreDisplay scoreData={editableStoryData.spiceScore} isDarkMode={isDarkMode} />
                                </div>
                              )}
                              <div className="p-4 bg-slate-700/50 rounded-lg">
                                <SimilarityScoreDisplay score={editableStoryData.similarityScore} isDarkMode={isDarkMode} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Media Tools */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4">Media & Enhancements</h3>
                          
                          {/* Images Tool */}
                          <div>
                            <EditablePictures
                              imageUrls={editableStoryData.imageUrls || []}
                              isDarkMode={isDarkMode}
                              onImageClick={handleImageClick}
                              onChange={(newUrls) => updateEditableData({ imageUrls: newUrls })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* View Mode Display */}
                  <StoryHeader
                    storyData={storyData}
                    isDarkMode={isDarkMode}
                    readMode={readMode}
                    changeReadMode={changeReadMode}
                  />

                  {/* Main content grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-5 sm:p-6">
                    <StoryNavigation
                      factSections={storyData.factSections || []}
                      activeSectionId={activeSectionId}
                      handleSectionClick={handleSectionClick}
                      isDarkMode={isDarkMode}
                    />

                    <StoryContent
                      storyData={storyData}
                      readMode={readMode}
                      activeSectionId={activeSectionId}
                      activeSectionData={activeSectionData}
                      isDarkMode={isDarkMode}
                    />

                    <StorySidebar
                      storyData={storyData}
                      isDarkMode={isDarkMode}
                      handleImageClick={handleImageClick}
                    />
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

        {/* Image Overlay */}
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