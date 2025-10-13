/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UploadIcon, MagicWandIcon } from './icons';
import Spinner from './Spinner';

interface StartScreenProps {
  onGenerate: (prompt: string) => void;
  onUpload: (file: File) => void;
  isLoading: boolean;
}

const StartScreen: React.FC<StartScreenProps> = ({ onGenerate, onUpload, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const handleGenerateClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto text-center p-8 flex flex-col items-center justify-center animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl" style={{fontFamily: "'Archivo Black', sans-serif"}}>
          AI Thumbnail <span className="text-blue-400">Studio</span>
        </h1>
        <p className="max-w-3xl mt-4 text-lg text-gray-400 md:text-xl">
          Create stunning, click-worthy thumbnails in seconds. Describe your idea to generate a unique background with AI, or upload your own image to get started.
        </p>
        
        <div className="mt-12 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* AI Generation Card */}
            <form onSubmit={handleGenerateClick} className="bg-gray-800/50 border border-gray-700/80 rounded-xl p-6 flex flex-col gap-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <MagicWandIcon className="w-7 h-7 text-purple-400" />
                    <h2 className="text-2xl font-bold text-left text-gray-100">Generate with AI</h2>
                </div>
                <p className="text-gray-400 text-left text-base">Describe the background image you want for your thumbnail.</p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A futuristic city skyline at sunset, cyberpunk aesthetic"
                    className="flex-grow bg-gray-900/80 border border-gray-700 text-gray-200 rounded-lg p-3.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full text-base resize-none h-24"
                    disabled={isLoading}
                />
                <button 
                    type="submit"
                    className="w-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                    disabled={isLoading || !prompt.trim()}
                >
                    {isLoading ? <Spinner /> : 'Generate'}
                </button>
            </form>

            {/* Upload Card */}
             <div 
                className={`relative bg-gray-800/50 border ${isDraggingOver ? 'border-dashed border-blue-400' : 'border-gray-700/80'} rounded-xl p-6 flex flex-col items-center justify-center gap-4 backdrop-blur-sm transition-all duration-300 min-h-[300px]`}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      onUpload(e.dataTransfer.files[0]);
                    }
                }}
             >
                <div className="flex items-center gap-3">
                    <UploadIcon className="w-7 h-7 text-green-400" />
                    <h2 className="text-2xl font-bold text-gray-100">Upload an Image</h2>
                </div>
                 <p className="text-gray-400 text-base">Or drag and drop a file here</p>
                <label htmlFor="image-upload-start" className="mt-4 relative inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-white bg-white/10 border border-white/20 rounded-lg cursor-pointer group hover:bg-white/20 transition-colors">
                    Choose File
                </label>
                <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isLoading} />
            </div>
        </div>
    </div>
  );
};

export default StartScreen;
