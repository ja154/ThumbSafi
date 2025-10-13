/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { generateImage } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import StartScreen from './components/StartScreen';
import ControlPanel from './components/FilterPanel'; // Repurposed to be the ControlPanel
import { TextIcon, StartOverIcon } from './components/icons';

// Helper to convert a File object to a base64 data URL
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

// Define the structure for a text element on the thumbnail
export type TextElement = {
  id: string;
  content: string;
  color: string;
  fontSize: number;
  fontFamily: string;
  top: number; // Percentage
  left: number; // Percentage
  outlineColor: string;
  outlineWidth: number;
};

const App: React.FC = () => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const imageUrl = await generateImage(prompt);
      setBaseImage(imageUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const imageUrl = await fileToDataURL(file);
      setBaseImage(imageUrl);
    } catch (err) {
      setError('Failed to load the image file.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStartOver = useCallback(() => {
    setBaseImage(null);
    setTextElements([]);
    setSelectedTextId(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const addText = useCallback(() => {
    const newText: TextElement = {
      id: `text-${Date.now()}`,
      content: 'Your Text Here',
      color: '#FFFFFF',
      fontSize: 80,
      fontFamily: 'Anton',
      top: 40,
      left: 20,
      outlineColor: '#000000',
      outlineWidth: 5,
    };
    setTextElements(prev => [...prev, newText]);
    setSelectedTextId(newText.id);
  }, []);

  const updateText = useCallback((id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => prev.map(text => text.id === id ? { ...text, ...updates } : text));
  }, []);
  
  const deleteText = useCallback((id: string) => {
    setTextElements(prev => prev.filter(text => text.id !== id));
    if (selectedTextId === id) {
        setSelectedTextId(null);
    }
  }, [selectedTextId]);


  const handleDownload = useCallback(() => {
    if (!baseImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const thumbnailWidth = 1280;
    const thumbnailHeight = 720;
    canvas.width = thumbnailWidth;
    canvas.height = thumbnailHeight;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = baseImage;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, thumbnailWidth, thumbnailHeight);

      // It's important to draw text elements in order
      textElements.forEach(text => {
        const x = (text.left / 100) * thumbnailWidth;
        const y = (text.top / 100) * thumbnailHeight;

        ctx.font = `900 ${text.fontSize}px ${text.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Draw outline
        if (text.outlineWidth > 0) {
            ctx.strokeStyle = text.outlineColor;
            ctx.lineWidth = text.outlineWidth * 2; // Canvas lineWidth is centered on the path
            ctx.strokeText(text.content, x, y);
        }

        // Draw fill
        ctx.fillStyle = text.color;
        ctx.fillText(text.content, x, y);
      });

      const link = document.createElement('a');
      link.download = 'thumbnail.jpg';
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    };
  }, [baseImage, textElements]);
  
  const getTextShadow = (text: TextElement) => {
    if (text.outlineWidth <= 0) return 'none';
    const w = text.outlineWidth;
    const c = text.outlineColor;
    return `${-w}px ${-w}px 0 ${c}, ${w}px ${-w}px 0 ${c}, ${-w}px ${w}px 0 ${c}, ${w}px ${w}px 0 ${c}, ${-w}px 0 0 ${c}, ${w}px 0 0 ${c}, 0 ${-w}px 0 ${c}, 0 ${w}px 0 ${c}`;
  };

  const renderContent = () => {
    if (error) {
       return (
           <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-300">An Error Occurred</h2>
            <p className="text-md text-red-400">{error}</p>
            <button
                onClick={() => { setError(null); if (!baseImage) handleStartOver(); }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                Try Again
            </button>
          </div>
        );
    }
    
    if (!baseImage) {
      return <StartScreen onGenerate={handleGenerate} onUpload={handleUpload} isLoading={isLoading} />;
    }

    return (
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-start gap-6 animate-fade-in">
        {/* Left Side: Preview & Actions */}
        <div className="flex-grow w-full flex flex-col gap-4">
            {/* Preview Canvas */}
            <div className="w-full aspect-video bg-black/50 rounded-lg shadow-2xl overflow-hidden relative border border-gray-700">
                {isLoading && (
                    <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                        <Spinner />
                    </div>
                )}
                <img src={baseImage} alt="Thumbnail background" className="w-full h-full object-cover" />
                {textElements.map(text => (
                    <div
                        key={text.id}
                        onClick={() => setSelectedTextId(text.id)}
                        className={`absolute cursor-pointer p-2 ${selectedTextId === text.id ? 'outline-dashed outline-2 outline-blue-400' : ''}`}
                        style={{
                            top: `${text.top}%`,
                            left: `${text.left}%`,
                            color: text.color,
                            fontSize: `${text.fontSize}px`,
                            fontFamily: `'${text.fontFamily}', sans-serif`,
                            fontWeight: 900,
                            lineHeight: 1,
                            textShadow: getTextShadow(text)
                        }}
                    >
                        {text.content}
                    </div>
                ))}
            </div>
            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                 <button 
                    onClick={handleStartOver}
                    className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
                >
                    <StartOverIcon className="w-5 h-5 mr-2" />
                    Start Over
                </button>
                 <button 
                    onClick={addText}
                    className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
                >
                    <TextIcon className="w-5 h-5 mr-2" />
                    Add Text
                </button>
                <button 
                    onClick={handleDownload}
                    className="col-span-2 sm:col-span-1 bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-5 rounded-md transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base"
                >
                    Download Thumbnail
                </button>
            </div>
        </div>
        {/* Right Side: Control Panel */}
        <div className="w-full lg:w-96 lg:max-w-sm flex-shrink-0">
            <ControlPanel
                textElements={textElements}
                selectedTextId={selectedTextId}
                onSelectText={setSelectedTextId}
                onAddText={addText}
                onDeleteText={deleteText}
                onUpdateText={updateText}
            />
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header />
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex justify-center ${baseImage ? 'items-start' : 'items-center'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
