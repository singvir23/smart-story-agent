"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryData, FactSection } from '@/lib/types';
import { containerVariants, itemVariants } from '@/lib/animations';
import { StorySummary, HighlightsSummary } from './HighlightsSummary';
import { StoryVideos } from './StoryVideos';
import { FactSectionDisplay } from './FactSectionDisplay';

interface StoryContentProps {
  storyData: StoryData;
  readMode: 'summary' | 'detailed';
  activeSectionId: string | null;
  activeSectionData: FactSection | null;
  isDarkMode: boolean;
}

export const StoryContent: React.FC<StoryContentProps> = ({
  storyData,
  readMode,
  activeSectionId,
  activeSectionData,
  isDarkMode
}) => {
  return (
    <motion.main className="lg:col-span-6 min-h-[400px]" variants={containerVariants} initial="hidden" animate="visible">
      <HighlightsSummary story={storyData} isDarkMode={isDarkMode} />
      <StoryVideos videos={storyData.videos || []} isDarkMode={isDarkMode} />
      <StorySummary story={storyData} isDarkMode={isDarkMode} />
      <div className="space-y-6 mt-6">
        <AnimatePresence mode="wait">
          {readMode === 'summary' && activeSectionData && (
            <motion.div 
              key={activeSectionData.id} 
              variants={itemVariants} 
              initial="hidden" 
              animate="visible" 
              exit="exit" 
              layout
            >
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
      {readMode === 'summary' && !activeSectionId && storyData.factSections && storyData.factSections.length > 0 && (
        <AnimatePresence>
          <motion.div
            variants={itemVariants} 
            initial="hidden" 
            animate="visible" 
            exit="exit"
            className={`text-center text-sm p-6 rounded-lg mt-6 ${isDarkMode ? 'text-slate-500 border-slate-700' : 'text-gray-400 border-gray-300'} border-2 border-dashed `}
          >
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
  );
}; 