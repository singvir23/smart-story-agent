"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { FactSection } from '@/lib/types';
import { containerVariants, sidebarItemVariants } from '@/lib/animations';

interface StoryNavigationProps {
  factSections: FactSection[];
  activeSectionId: string | null;
  handleSectionClick: (sectionId: string) => void;
  isDarkMode: boolean;
}

export const StoryNavigation: React.FC<StoryNavigationProps> = ({
  factSections,
  activeSectionId,
  handleSectionClick,
  isDarkMode
}) => {
  return (
    <motion.nav className="lg:col-span-3" variants={containerVariants} initial="hidden" animate="visible">
      <div className="sticky top-6">
        <h2 className={`text-xs font-semibold mb-3 uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
          Explore Sections
        </h2>
        <div className="flex flex-col space-y-1.5">
          {(factSections ?? []).map((section: FactSection) => (
            <motion.button
              key={section.id}
              variants={sidebarItemVariants}
              onClick={() => handleSectionClick(section.id)}
              className={`w-full py-2.5 px-4 text-left rounded-md transition-colors text-sm font-medium ${ 
                activeSectionId === section.id 
                  ? `${isDarkMode ? 'bg-teal-600 text-white' : 'bg-teal-700 text-white'}` 
                  : `${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600/70 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'}` 
              }`}
            > 
              {section.title} 
            </motion.button>
          ))}
          {(!factSections || factSections.length === 0) && (
            <motion.p 
              variants={sidebarItemVariants} 
              className={`text-sm px-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}
            >
              No specific sections found.
            </motion.p>
          )}
        </div>
      </div>
    </motion.nav>
  );
}; 