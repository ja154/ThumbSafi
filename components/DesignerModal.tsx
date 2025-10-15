/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { MagicWandIcon, UploadIcon } from './icons';
import type { DesignerData } from '../App';

interface DesignerModalProps {
  onClose: () => void;
  onDesign: (data: DesignerData) => void;
}

const DesignerModal: React.FC<DesignerModalProps> = ({ onClose, onDesign }) => {
  const [topic, setTopic] = useState('');
  const [mainText, setMainText] = useState('');
  const [secondaryText, setSecondaryText] = useState('');
  const [subjectImage, setSubjectImage] = useState<File | null>(null);
  const [subjectPreview, setSubjectPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && mainText.trim()) {
      onDesign({ topic, mainText, secondaryText, subjectImage });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSubjectImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSubjectPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const FormField: React.FC<{label: string, children: React.ReactNode, isOptional?: boolean}> = ({label, children, isOptional}) => (
    <div className="flex flex-col gap-2">
        <label className="text-md font-semibold text-gray-300 text-left">{label}
            {isOptional && <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span>}
        </label>
        {children}
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <form 
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col gap-6 p-8 overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
            <MagicWandIcon className="w-8 h-8 text-purple-400" />
            <h2 className="text-3xl font-bold text-gray-100">AI Thumbnail Designer</h2>
        </div>
        
        <p className="text-gray-400 text-left text-base -mt-2">Provide the details, and our AI will design a professional thumbnail for you.</p>

        <div className="flex flex-col gap-5">
            <FormField label="What is your video about?">
                <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g., A review of the new Gemma 3 AI model"
                    className="bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full text-base"
                    required
                />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Main Text (Power Word)">
                    <input
                        type="text"
                        value={mainText}
                        onChange={e => setMainText(e.target.value)}
                        placeholder="e.g., VIRAL"
                        className="bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full text-base"
                        required
                    />
                </FormField>
                <FormField label="Secondary Text" isOptional>
                    <input
                        type="text"
                        value={secondaryText}
                        onChange={e => setSecondaryText(e.target.value)}
                        placeholder="e.g., GEMMA 3"
                        className="bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full text-base"
                    />
                </FormField>
            </div>
            
            <FormField label="Upload a Subject Image" isOptional>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-800/50 hover:border-blue-500 transition-colors"
                >
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    {subjectPreview ? (
                        <img src={subjectPreview} alt="Subject preview" className="max-h-32 mx-auto rounded-md" />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                           <UploadIcon className="w-8 h-8"/>
                           <p>Click to upload or drag & drop</p>
                           <p className="text-xs text-gray-500">A clear photo of a person or object works best.</p>
                        </div>
                    )}
                </div>
            </FormField>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
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
                disabled={!topic.trim() || !mainText.trim()}
            >
                Design My Thumbnail!
            </button>
        </div>
      </form>
    </div>
  );
};

export default DesignerModal;
