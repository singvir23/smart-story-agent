"use client"

import React from 'react';
import { SpiceScoreDisplayProps, SimilarityScoreDisplayProps } from '@/lib/types';

export const SpiceScoreDisplay: React.FC<SpiceScoreDisplayProps> = ({ scoreData, isDarkMode }) => {
    return (
        <div className="mt-3 pt-3 border-t border-dashed border-gray-300 dark:border-slate-600">
            <h4 className={`text-xs font-semibold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                Engagement Score (SPICE)
            </h4>
            <div className="flex items-center justify-between">
                 <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                     Total: <span className="text-lg font-bold">{scoreData.total}</span> / 25
                 </p>
                 <div className={`text-xs grid grid-cols-5 gap-1 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    <span title={`Scannability: ${scoreData.s}/5`}>S:{scoreData.s}</span>
                    <span title={`Personalization: ${scoreData.p}/5`}>P:{scoreData.p}</span>
                    <span title={`Interactivity: ${scoreData.i}/5`}>I:{scoreData.i}</span>
                    <span title={`Curation: ${scoreData.c}/5`}>C:{scoreData.c}</span>
                    <span title={`Emotion: ${scoreData.e}/5`}>E:{scoreData.e}</span>
                 </div>
            </div>
        </div>
    );
};

export const SimilarityScoreDisplay: React.FC<SimilarityScoreDisplayProps> = ({ score, isDarkMode }) => {
    const getScoreColor = (score: number) => {
        if (score >= 0.8) return isDarkMode ? 'text-green-400' : 'text-green-600';
        if (score >= 0.6) return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
        return isDarkMode ? 'text-red-400' : 'text-red-600';
    };

    return (
        <div className="mt-3 pt-3 border-t border-dashed border-gray-300 dark:border-slate-600">
            <h4 className={`text-xs font-semibold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                Content Similarity Score
            </h4>
            <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                    Score: <span className={`text-lg font-bold ${getScoreColor(score)}`}>{Math.round(score * 100)}%</span>
                </p>
                <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {score >= 0.8 ? 'Excellent' : score >= 0.6 ? 'Good' : 'Needs Review'}
                </div>
            </div>
        </div>
    );
}; 