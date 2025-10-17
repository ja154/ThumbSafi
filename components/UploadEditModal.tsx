/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useCallback } from 'react';
import { SparkleIcon, UploadIcon } from './icons';

// Helper to convert a File object to a base64 data URL
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

interface UploadEditModalProps {
  onClose: () => void;
  onCreate: (baseImage: string, prompt: string) => void;
}

const UploadEditModal: React.FC<UploadEditModalProps> = ({ onClose, onCreate }) => {
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = [
    { name: 'Vibrant & Cinematic', prompt: 'Make the colors more vibrant and cinematic. Enhance the lighting to be more dramatic.' },
    { name: 'Studio Look', prompt: 'Give the subject professional studio lighting and a clean, slightly blurred background.' },
    { name: 'Remove Background', prompt: 'Isolate the main subject and completely remove the background, making it fully transparent.' },
    { name: 'Cartoonify', prompt: 'Turn this photo into a stylized cartoon or anime style image.' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceImage && prompt.trim()) {
      onCreate(sourceImage, prompt);
    }
  };
  
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const dataUrl = await fileToDataURL(file);
      setSourceImage(dataUrl);
    }
  }, []);
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <SparkleIcon className="w-8 h-8 text-purple-400" />
          <h2 className="text-3xl font-bold text-gray-100">Create Thumbnail from Photo</h2>
        </div>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto pr-2">
          {/* Left: Uploader */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-gray-200">1. Upload Your Image</h3>
            <div onClick={() => fileInputRef.current?.click()} className="flex-grow w-full border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-800/50 hover:border-blue-500 transition-colors flex items-center justify-center">
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              {sourceImage ? (
                <img src={sourceImage} alt="Uploaded preview" className="max-h-80 w-auto object-contain rounded-md" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <UploadIcon className="w-12 h-12"/>
                  <p className="font-semibold">Click to upload or drag & drop</p>
                  <p className="text-sm text-gray-500">PNG, JPG, WEBP accepted.</p>
                </div>
              )}
            </div>
          </div>
          {/* Right: Prompt */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-gray-200">2. Describe Transformation</h3>
            <p className="text-sm text-gray-400 -mt-2">Tell the AI how to turn your photo into an awesome thumbnail.</p>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g., Make the colors more vibrant and add a dramatic sky."
              rows={4}
              className="bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full text-base resize-none"
              required
            />
            <h4 className="text-md font-semibold text-gray-300">Or try a preset:</h4>
            <div className="grid grid-cols-2 gap-2">
              {presets.map(p => (
                <button type="button" key={p.name} onClick={() => setPrompt(p.prompt)} className="text-center bg-white/5 border border-white/10 text-gray-300 font-medium py-2 px-3 rounded-md transition-colors hover:bg-white/10 text-sm disabled:opacity-50">
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-700">
            <button type="button" onClick={onClose} className="w-full sm:w-auto flex-grow text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base">
                Cancel
            </button>
            <button type="submit" className="w-full sm:w-auto flex-grow bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-3 px-5 text-base rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:opacity-50 disabled:cursor-not-allowed" disabled={!sourceImage || !prompt.trim()}>
                Generate Thumbnail
            </button>
        </div>
      </form>
    </div>
  );
};

export default UploadEditModal;