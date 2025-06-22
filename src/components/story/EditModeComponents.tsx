"use client"

import React, { useState } from 'react';
import { FactSection, EditablePicturesProps, EditableTitleProps, EditableSummaryProps, EditableHighlightsProps, EditableFactSectionProps, EditableVideoSectionProps } from '@/lib/types';
import { AdditionalImage } from './ImageComponents';

export const EditablePictures: React.FC<EditablePicturesProps> = ({ imageUrls, isDarkMode, onChange, onImageClick }) => {
    const [newImageUrl, setNewImageUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [urlError, setUrlError] = useState<string>('');

    const handleAddImage = () => {
        if (newImageUrl.trim()) {
            onChange([...imageUrls, newImageUrl.trim()]);
            setNewImageUrl('');
            setIsAdding(false);
        }
    };

    const handleRemoveImage = (urlToRemove: string) => {
        onChange(imageUrls.filter(url => url !== urlToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddImage();
        }
    };

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Pictures</h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                    Add Image
                </button>
            </div>

            {isAdding && (
                <div className="mb-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={newImageUrl}
                            onChange={(e) => {
                                setNewImageUrl(e.target.value);
                                setUrlError('');
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter image URL..."
                            className={`w-full px-4 py-2 rounded-lg border ${
                                urlError ? 'border-red-500' : 'border-slate-600 bg-slate-800 text-white'
                            } focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder-slate-400`}
                        />
                        {urlError && (
                            <p className="text-sm text-red-400">{urlError}</p>
                        )}
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setIsAdding(false);
                                    setUrlError('');
                                }}
                                className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-500 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddImage}
                                className={`px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition ${
                                    urlError || !newImageUrl.trim() ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                disabled={!!urlError || !newImageUrl.trim()}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {imageUrls.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                        <AdditionalImage
                            src={imageUrl}
                            alt={`Image ${index + 1}`}
                            isDarkMode={isDarkMode}
                            onClick={() => onImageClick(imageUrl)}
                        />
                        <button
                            onClick={() => handleRemoveImage(imageUrl)}
                            className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/80 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all group-hover:opacity-100 opacity-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const EditableTitle: React.FC<EditableTitleProps> = ({ title, onChange, isDarkMode }) => (
    <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
            Article Title
        </label>
        <input
            type="text"
            value={title}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full p-3 text-xl font-bold rounded-md border ${
                isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            } focus:ring-teal-500 focus:border-teal-500 transition`}
            placeholder="Enter article title..."
        />
    </div>
);

export const EditableSummary: React.FC<EditableSummaryProps> = ({ summary, onChange, isDarkMode }) => (
    <div className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
            Summary
        </label>
        <textarea
            value={summary}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className={`w-full p-3 rounded-md border ${
                isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            } focus:ring-teal-500 focus:border-teal-500 transition resize-vertical`}
            placeholder="Enter article summary..."
        />
    </div>
);

export const EditableHighlights: React.FC<EditableHighlightsProps> = ({ highlights, onChange, isDarkMode }) => {
    const addHighlight = () => {
        onChange([...highlights, '']);
    };

    const updateHighlight = (index: number, value: string) => {
        const newHighlights = [...highlights];
        newHighlights[index] = value;
        onChange(newHighlights);
    };

    const removeHighlight = (index: number) => {
        onChange(highlights.filter((_, i) => i !== index));
    };

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Highlights
                </label>
                <button
                    type="button"
                    onClick={addHighlight}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                </button>
            </div>
            <div className="space-y-2">
                {highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-2">
                        <div className="flex-1">
                            <textarea
                                value={highlight}
                                onChange={(e) => updateHighlight(index, e.target.value)}
                                rows={2}
                                className={`w-full p-2 text-sm rounded-md border ${
                                    isDarkMode 
                                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                } focus:ring-teal-500 focus:border-teal-500 transition resize-none`}
                                placeholder={`Highlight ${index + 1}...`}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeHighlight(index)}
                            className={`p-1.5 rounded-md transition ${
                                isDarkMode 
                                    ? 'text-red-400 hover:bg-red-900/20' 
                                    : 'text-red-500 hover:bg-red-100'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}
                {highlights.length === 0 && (
                    <div className={`text-center p-4 border-2 border-dashed rounded-lg ${
                        isDarkMode ? 'border-slate-600 text-slate-400' : 'border-gray-300 text-gray-500'
                    }`}>
                        <p className="text-sm">No highlights yet. Click &quot;Add&quot; to create one.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const EditableFactSection: React.FC<EditableFactSectionProps> = ({ section, onChange, onRemove, isDarkMode }) => (
    <div className={`p-4 rounded-lg border ${
        isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'
    }`}>
        <div className="flex items-start justify-between mb-3">
            <div className="flex-1 mr-3">
                <input
                    type="text"
                    value={section.title}
                    onChange={(e) => onChange({ ...section, title: e.target.value })}
                    className={`w-full p-2 text-lg font-semibold rounded-md border ${
                        isDarkMode 
                            ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' 
                            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:ring-teal-500 focus:border-teal-500 transition`}
                    placeholder="Section title..."
                />
            </div>
            <button
                type="button"
                onClick={onRemove}
                className={`p-2 rounded-md transition ${
                    isDarkMode 
                        ? 'text-red-400 hover:bg-red-900/20' 
                        : 'text-red-500 hover:bg-red-100'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
        <textarea
            value={section.content}
            onChange={(e) => onChange({ ...section, content: e.target.value })}
            rows={4}
            className={`w-full p-3 rounded-md border ${
                isDarkMode 
                    ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
            } focus:ring-teal-500 focus:border-teal-500 transition resize-vertical`}
            placeholder="Section content..."
        />
    </div>
);

export const EditableVideoSection: React.FC<EditableVideoSectionProps> = ({ videos, onChange, isDarkMode }) => {
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    function getEmbedUrl(rawUrl: string): string | null {
        if (!rawUrl || typeof rawUrl !== 'string') return null;
        const trimmed = rawUrl.trim();
        if (!trimmed) return null;

        // YouTube patterns
        const youtubeMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (youtubeMatch) {
            return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        }

        // Vimeo patterns
        const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }

        // If it's already an embed URL, return as-is
        if (trimmed.includes('/embed/') || trimmed.includes('player.vimeo.com')) {
            return trimmed;
        }

        return null;
    }

    const addVideoURL = () => {
        if (newVideoUrl.trim()) {
            const embedUrl = getEmbedUrl(newVideoUrl.trim());
            if (embedUrl) {
                onChange([...videos, embedUrl]);
                setNewVideoUrl('');
                setIsAdding(false);
            }
        }
    };

    const removeVideo = (index: number) => {
        onChange(videos.filter((_, i) => i !== index));
    };

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Videos</h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                    Add Video
                </button>
            </div>

            {isAdding && (
                <div className="mb-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <input
                        type="text"
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        placeholder="Enter YouTube or Vimeo URL..."
                        className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white placeholder-slate-400 mb-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setNewVideoUrl('');
                            }}
                            className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-500 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={addVideoURL}
                            className={`px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition ${
                                !newVideoUrl.trim() ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={!newVideoUrl.trim()}
                        >
                            Add Video
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {videos.map((videoUrl, index) => (
                    <div key={index} className="relative">
                        <div className="aspect-video w-full overflow-hidden rounded-md">
                            <iframe
                                src={videoUrl}
                                allow="autoplay; fullscreen"
                                allowFullScreen
                                className="w-full h-full"
                            />
                        </div>
                        <button
                            onClick={() => removeVideo(index)}
                            className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/80 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            {videos.length === 0 && (
                <div className="text-center p-6 border-2 border-dashed rounded-lg border-slate-600 text-slate-400">
                    <p className="text-sm">No videos yet. Click &quot;Add Video&quot; to add one.</p>
                </div>
            )}
        </div>
    );
}; 