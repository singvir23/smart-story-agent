"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { itemVariants } from '@/lib/animations';
import { VideoCarousel } from './VideoCarousel';

interface StoryVideosProps {
  videos: string[];
  isDarkMode: boolean;
}

export const StoryVideos: React.FC<StoryVideosProps> = ({ videos, isDarkMode }) => {
    if (!videos || videos.length === 0) return null;
    
    return (
      <motion.div
        variants={itemVariants}
        className={`rounded-lg p-5 mb-6 ${isDarkMode ? 'bg-slate-700/60 border-slate-600/50' : 'bg-gray-50 border-gray-200/80'} border`}
      >
         <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Videos</h2>
         <VideoCarousel 
           videos={videos} 
           isDarkMode={isDarkMode}
         />
      </motion.div>
    );
}; 