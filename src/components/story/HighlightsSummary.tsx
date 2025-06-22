"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { HighlightsSummaryProps } from '@/lib/types';
import { itemVariants } from '@/lib/animations';

export const StorySummary: React.FC<HighlightsSummaryProps> = ({ story, isDarkMode }) => {
    if (!story) return null;
    return (
      <motion.div
        variants={itemVariants}
        className={`rounded-lg p-5 mb-6 ${isDarkMode ? 'bg-slate-700/60 border-slate-600/50' : 'bg-gray-50 border-gray-200/80'} border`}
      >
         <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Summary</h2>
         <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{story.summary}</p>
      </motion.div>
    );
};

export const HighlightsSummary: React.FC<HighlightsSummaryProps> = ({ story, isDarkMode }) => {
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
      </motion.div>
    );
}; 