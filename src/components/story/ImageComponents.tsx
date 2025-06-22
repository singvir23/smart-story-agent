"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdditionalImageProps, ImageOverlayProps } from '@/lib/types';
import { overlayVariants, enlargedImageVariants } from '@/lib/animations';

export const AdditionalImage: React.FC<AdditionalImageProps> = ({ src, alt, isDarkMode, onClick }) => {
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

export const ImageOverlay: React.FC<ImageOverlayProps> = ({ imageUrl, onClose }) => {
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