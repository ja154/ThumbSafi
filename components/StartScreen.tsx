/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { MagicWandIcon } from './icons';

interface StartScreenProps {
  onStartDesigner: () => void;
  isLoading: boolean;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartDesigner, isLoading }) => {
  return (
    <div className="w-full max-w-3xl mx-auto text-center p-8 flex flex-col items-center justify-center animate-fade-in">
      <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl" style={{fontFamily: "'Archivo Black', sans-serif"}}>
        Thumb<span className="text-blue-400">Safi</span>
      </h1>
      <p className="max-w-3xl mt-4 text-lg text-gray-400 md:text-xl">
        The AI-powered tool that designs stunning, click-worthy thumbnails for you in seconds.
      </p>
      
      <div className="mt-12 w-full bg-gray-800/50 border border-gray-700/80 rounded-xl p-8 flex flex-col gap-5 backdrop-blur-sm shadow-2xl shadow-blue-500/10">
        <div className="flex items-center gap-4 justify-center">
          <MagicWandIcon className="w-8 h-8 text-purple-400" />
          <h2 className="text-3xl font-bold text-gray-100">AI Thumbnail Designer</h2>
        </div>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Let our AI design a complete thumbnail for you. It will generate a background, choose fonts, and create a professional layout based on your video topic.
        </p>
        <div className="mt-4">
          <button 
            onClick={onStartDesigner}
            className="w-full max-w-sm mx-auto flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 text-xl rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading}
          >
            Start Designing
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
