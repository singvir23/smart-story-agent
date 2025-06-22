"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { StoryData } from '@/lib/types';

interface StoryHeaderProps {
  storyData: StoryData;
  isDarkMode: boolean;
  readMode: 'summary' | 'detailed';
  changeReadMode: (mode: 'summary' | 'detailed') => void;
}

export const StoryHeader: React.FC<StoryHeaderProps> = ({
  storyData,
  isDarkMode,
  readMode,
  changeReadMode
}) => {
  const titleFont = 'font-serif';

  return (
    <header className={`p-5 sm:p-6 ${isDarkMode ? 'border-b border-slate-700' : 'border-b border-gray-200'}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
        <h1 className={`text-2xl lg:text-3xl font-bold ${titleFont} leading-tight mb-2 sm:mb-0 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {storyData.title}
        </h1>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <p className={`text-xs sm:text-sm mb-3 sm:mb-0 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          Source: <span className="font-medium">{storyData.source}</span>
          {storyData.author && (<> | By: <span className="font-medium">{storyData.author}</span></>)}
          {storyData.date && storyData.date !== 'Date not specified' && (<> | {storyData.date}</>)}
        </p>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.4, duration: 0.3 }} 
          className={`flex items-center space-x-2 p-1 rounded-md ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}
        >
          <button 
            onClick={() => changeReadMode('summary')} 
            className={`px-3 py-1 text-xs sm:text-sm font-medium rounded transition-colors ${ 
              readMode === 'summary' 
                ? `${isDarkMode ? 'bg-teal-600 text-white shadow-sm' : 'bg-teal-700 text-white shadow-sm'}` 
                : `${isDarkMode ? 'text-slate-300 hover:bg-slate-600/50' : 'text-gray-600 hover:bg-gray-200'}` 
            }`}
          > 
            Summary View 
          </button>
          <button 
            onClick={() => changeReadMode('detailed')} 
            className={`px-3 py-1 text-xs sm:text-sm font-medium rounded transition-colors ${ 
              readMode === 'detailed' 
                ? `${isDarkMode ? 'bg-teal-600 text-white shadow-sm' : 'bg-teal-700 text-white shadow-sm'}` 
                : `${isDarkMode ? 'text-slate-300 hover:bg-slate-600/50' : 'text-gray-600 hover:bg-gray-200'}` 
            }`}
          > 
            Detailed View 
          </button>
        </motion.div>
      </div>
    </header>
  );
}; 