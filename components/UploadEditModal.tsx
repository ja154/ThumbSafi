/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { MagicWandIcon } from './icons';

interface UploadEditModalProps {
  imageSrc: string;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
}

const UploadEditModal: React.FC<UploadEditModalProps> = ({ imageSrc, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row gap-6 p-6 overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="md:w-1/2 flex-shrink-0 flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-gray-100">Enhance Your Image</h2>
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/50">
                <img src={imageSrc} alt="Uploaded preview" className="w-full h-full object-contain" />
            </div>
        </div>

        <form onSubmit={handleGenerate} className="md:w-1/2 flex flex-col gap-4 justify-center">
            <div className="flex items-center gap-3">
                <MagicWandIcon className="w-7 h-7 text-purple-400" />
                <h3 className="text-xl font-bold text-left text-gray-200">Describe the thumbnail you want</h3>
            </div>
            <p className="text-gray-400 text-left text-base">
                Use your uploaded image as a starting point. Tell the AI how to transform it into the perfect thumbnail.
            </p>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Change the background to a neon city, make the lighting more dramatic"
                className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-3.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full text-base resize-none h-28"
                autoFocus
            />
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto flex-grow text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
                >
                    Cancel
                </button>
                <button 
                    type="submit"
                    className="w-full sm:w-auto flex-grow bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-3 px-5 text-base rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:opacity-50"
                    disabled={!prompt.trim()}
                >
                    Generate Thumbnail
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default UploadEditModal;