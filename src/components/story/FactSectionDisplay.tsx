"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { FactSectionDisplayProps } from '@/lib/types';
import { itemVariants } from '@/lib/animations';

export const FactSectionDisplay: React.FC<FactSectionDisplayProps> = ({ section, isDarkMode }) => (
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