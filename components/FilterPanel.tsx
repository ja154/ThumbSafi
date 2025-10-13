/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { TrashIcon } from './icons';
import type { TextElement } from '../App';

interface ControlPanelProps {
  textElements: TextElement[];
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
  onDeleteText: (id: string) => void;
  onUpdateText: (id: string, updates: Partial<TextElement>) => void;
}

const fonts = ['Anton', 'Bebas Neue', 'Archivo Black', 'Inter'];

const ControlPanel: React.FC<ControlPanelProps> = ({
  textElements,
  selectedTextId,
  onSelectText,
  onDeleteText,
  onUpdateText
}) => {
  const selectedText = textElements.find(t => t.id === selectedTextId);

  const handleUpdate = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!selectedText) return;
    const { name, value } = e.target;
    let processedValue: string | number = value;
    if (e.target.type === 'range' || e.target.type === 'number') {
        processedValue = parseFloat(value);
    }
    onUpdateText(selectedText.id, { [name]: processedValue });
  };

  const InputField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
      <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-400">{label}</label>
          {children}
      </div>
  );

  return (
    <div className="w-full bg-gray-900/50 border border-gray-700/80 rounded-lg p-4 flex flex-col gap-4 backdrop-blur-sm max-h-[80vh] overflow-y-auto">
      <div>
        <h3 className="text-lg font-bold text-gray-200 mb-2">Text Layers</h3>
        <div className="flex flex-col gap-2">
            {textElements.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Add some text to get started!</p>
            )}
            {textElements.map(text => (
                <div 
                    key={text.id}
                    onClick={() => onSelectText(text.id)}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${selectedTextId === text.id ? 'bg-blue-500/30' : 'bg-white/10 hover:bg-white/20'}`}
                >
                    <span className="truncate text-gray-200" style={{fontFamily: text.fontFamily}}>{text.content}</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeleteText(text.id); }}
                        className="p-1 rounded-full text-gray-400 hover:bg-red-500/50 hover:text-white transition-colors"
                        aria-label="Delete text layer"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
      </div>

      {selectedText && (
        <div className="border-t border-gray-700 pt-4 flex flex-col gap-4 animate-fade-in">
          <h3 className="text-lg font-bold text-gray-200">Edit Text</h3>
          
          <InputField label="Content">
            <textarea name="content" value={selectedText.content} onChange={(e) => onUpdateText(selectedText.id, { content: e.target.value })} rows={2} className="bg-gray-700/80 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none" />
          </InputField>
          
          <InputField label="Font Family">
            <select name="fontFamily" value={selectedText.fontFamily} onChange={handleUpdate} className="bg-gray-700/80 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none appearance-none">
              {fonts.map(font => <option key={font} value={font}>{font}</option>)}
            </select>
          </InputField>
          
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Font Size">
              <input name="fontSize" type="number" value={selectedText.fontSize} onChange={handleUpdate} className="bg-gray-700/80 border border-gray-600 text-gray-200 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
            </InputField>
            <InputField label="Color">
              <input name="color" type="color" value={selectedText.color} onChange={handleUpdate} className="bg-transparent w-full h-10 p-0 border-none rounded-md cursor-pointer" />
            </InputField>
          </div>
          
          <InputField label={`Top: ${selectedText.top}%`}>
            <input name="top" type="range" min="0" max="100" step="0.5" value={selectedText.top} onChange={handleUpdate} />
          </InputField>

          <InputField label={`Left: ${selectedText.left}%`}>
            <input name="left" type="range" min="0" max="100" step="0.5" value={selectedText.left} onChange={handleUpdate} />
          </InputField>
          
          <div className="border-t border-gray-700 pt-4 flex flex-col gap-3">
            <h4 className="text-md font-semibold text-gray-300">Outline</h4>
            <div className="grid grid-cols-2 gap-3">
                <InputField label="Width">
                    <input name="outlineWidth" type="number" min="0" max="20" value={selectedText.outlineWidth} onChange={handleUpdate} className="bg-gray-700/80 border border-gray-600 text-gray-200 rounded-md p-2" />
                </InputField>
                <InputField label="Color">
                    <input name="outlineColor" type="color" value={selectedText.outlineColor} onChange={handleUpdate} className="bg-transparent w-full h-10 p-0 border-none rounded-md cursor-pointer" />
                </InputField>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
