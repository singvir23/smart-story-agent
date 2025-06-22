"use client"

import React, { useState } from 'react';
import { VideoCarouselProps } from '@/lib/types';

export const VideoCarousel: React.FC<VideoCarouselProps> = ({ videos, isDarkMode }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const slantStyle = (side: 'left' | 'right') => ({
    clipPath:
      side === 'left'
        ? 'polygon(10% 0%, 100% 0%, 100% 100%, 0% 100%)'
        : 'polygon(0% 0%, 100% 0%, 90% 100%, 0% 100%)',
  });

  return (
    <div className="relative max-w-xl mx-auto space-y-2">
      <div className="aspect-video w-full overflow-hidden rounded-md">
        <iframe
          src={videos[currentIndex]}
          allow="autoplay; fullscreen"
          allowFullScreen
          className="w-full h-full"
        />
      </div>

      {videos.length > 1 && <div className="flex justify-between items-center gap-1 mt-2">
        {videos.map((_, index) => {
          const isFirst = index === 0;
          const isLast = index === videos.length - 1;
          return (
            <button
              key={`${index}`}
              onClick={() => setCurrentIndex(index)}
              style={{
                ...(isFirst ? slantStyle('left') : {}),
                ...(isLast ? slantStyle('right') : {}),
              }}
              className={`h-2 flex-1 transition-all duration-200 ${
                index === currentIndex ? 
                        (`${isDarkMode
                        ? 'bg-teal-700 hover:bg-teal-600'
                        : 'bg-teal-600 hover:bg-teal-700'}`) 
                    : 
                        (`${isDarkMode
                        ? 'bg-slate-600 hover:bg-slate-500'
                        : 'bg-gray-200 hover:bg-gray-300'}`)
              }`}
              title={`Video ${index + 1}`}
            />
          );
        })}
      </div>}
    </div>
  );
}; 