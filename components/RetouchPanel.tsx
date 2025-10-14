/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { BrushIcon, TrashIcon } from './icons';

interface RetouchPanelProps {
  onApplyRetouch: (prompt: string) => void;
  isLoading: boolean;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClearMask: () => void;
  hasMask: boolean;
}

const RetouchPanel: React.FC<RetouchPanelProps> = ({
  onApplyRetouch,
  isLoading,
  brushSize,
  onBrushSizeChange,
  onClearMask,
  hasMask,
}) => {
  const [prompt, setPrompt] = useState('');

  const presets = [
    { name: 'Smooth Skin', prompt: 'Smooth the skin in the selected area, removing minor blemishes and wrinkles for a natural look.' },
    { name: 'Remove Object', prompt: 'Remove the object/person in the selected area, seamlessly blending it with the surroundings.' },
    { name: 'Enhance Eyes', prompt: 'Make the eyes in the selected area slightly brighter and sharper.' },
    { name: 'Whiten Teeth', prompt: 'Gently whiten the teeth in the selected area.' },
  ];

  const handleApply = () => {
    if (prompt.trim()) {
      onApplyRetouch(prompt);
      setPrompt('');
    }
  };

  const handlePresetClick = (presetPrompt: string) => {
    setPrompt(presetPrompt);
  };

  const InputField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-400">{label}</label>
        {children}
    </div>
  );

  return (
    <div className="w-full bg-gray-900/50 border border-gray-700/80 rounded-lg p-4 flex flex-col gap-4 backdrop-blur-sm max-h-[80vh] overflow-y-auto animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-gray-200">AI Retouch</h3>
        <p className="text-sm text-gray-400">Brush over an area on the image, then describe the change you want to make.</p>
      </div>
      
      <div className="border-t border-gray-700 pt-4 flex flex-col gap-4">
        <InputField label={`Brush Size: ${brushSize}px`}>
          <input 
            type="range" 
            min="10" 
            max="100" 
            step="2" 
            value={brushSize} 
            onChange={(e) => onBrushSizeChange(parseInt(e.target.value, 10))}
            disabled={isLoading}
            className="w-full"
          />
        </InputField>

        <button
          onClick={onClearMask}
          disabled={isLoading || !hasMask}
          className="w-full flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-red-500/20 hover:border-red-500/30 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:bg-white/10 disabled:hover:border-white/20"
        >
          <TrashIcon className="w-4 h-4 mr-2" />
          Clear Selection
        </button>
      </div>

      <div className="border-t border-gray-700 pt-4 flex flex-col gap-4">
        <h3 className="text-md font-semibold text-gray-300">Describe Your Edit</h3>
        <div className="grid grid-cols-2 gap-2">
          {presets.map(preset => (
            <button key={preset.name} onClick={() => handlePresetClick(preset.prompt)} disabled={isLoading} 
              className="text-center bg-white/5 border border-white/10 text-gray-300 font-medium py-2 px-3 rounded-md transition-colors hover:bg-white/10 text-xs disabled:opacity-50"
            >
              {preset.name}
            </button>
          ))}
        </div>
        <textarea
            name="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="e.g., remove the person on the left"
            className="bg-gray-700/80 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none disabled:opacity-50"
            disabled={isLoading}
        />
        <button
            onClick={handleApply}
            className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-3 px-5 rounded-md transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !prompt.trim() || !hasMask}
        >
            <div className="flex items-center justify-center gap-2">
              <BrushIcon className="w-5 h-5" />
              <span>Apply Retouch</span>
            </div>
        </button>
      </div>
    </div>
  );
};

export default RetouchPanel;
