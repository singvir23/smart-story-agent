"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { StoryData } from '@/lib/types';
import { containerVariants, itemVariants } from '@/lib/animations';

import { AdditionalImage } from './ImageComponents';

interface StorySidebarProps {
  storyData: StoryData;
  isDarkMode: boolean;
  handleImageClick: (imageUrl: string) => void;
}

export const StorySidebar: React.FC<StorySidebarProps> = ({
  storyData,
  isDarkMode,
  handleImageClick
}) => {
  const [imageLoadError, setImageLoadError] = useState(false);

  return (
    <motion.aside className="lg:col-span-3" variants={containerVariants} initial="hidden" animate="visible">
      <div className="sticky top-6 space-y-6">
        {/* Story Details card */}
        <motion.div variants={itemVariants} className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-700/50 border-slate-600/50' : 'bg-gray-50/80 border-gray-200'} border`}>
          <h3 className={`text-xs font-semibold mb-2.5 uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>Story Details</h3>
          <div className={`text-xs space-y-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
            {storyData.date && storyData.date !== 'Date not specified' && ( 
              <p><span className="font-medium">Published:</span> {storyData.date}</p> 
            )}
            <p><span className="font-medium">Source:</span> {storyData.source}</p>
            <p><span className="font-medium">By:</span> {storyData.author || 'Not Available'}</p>
          </div>
          <a
            href={storyData.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
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

        {/* Primary Image Display */}
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
                    onLoad={() => { if(imageLoadError) setImageLoadError(false); }}
                  />
                </motion.button>
              ) : (
                <div className="w-full aspect-video flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${isDarkMode? 'text-slate-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}> 
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> 
                  </svg>
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

        {/* Additional Images Display */}
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


      </div>
    </motion.aside>
  );
}; 