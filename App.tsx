/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { generateImage, editImage, getThumbnailDesign, removeImageBackground, createThumbnailFromImage, DesignSpecification, TextSpec } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import StartScreen from './components/StartScreen';
import ControlPanel from './components/FilterPanel';
import EditorPreview from './components/EditorPreview';
import RetouchPanel from './components/RetouchPanel';
import CropPanel from './components/CropPanel';
import DesignerModal from './components/DesignerModal';
import UploadEditModal from './components/UploadEditModal';
import { TextIcon, StartOverIcon, BrushIcon, CropIcon } from './components/icons';

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

export type DesignerData = {
    topic: string;
    mainText: string;
    secondaryText: string;
    subjectImage: File | null;
};

type EditorMode = 'text' | 'retouch' | 'crop';

const App: React.FC = () => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Generating...');
  const [error, setError] = useState<string | null>(null);
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [editorMode, setEditorMode] = useState<EditorMode>('text');
  
  // Retouch state
  const [retouchMask, setRetouchMask] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState<number>(40);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Crop state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const imgRef = useRef<HTMLImageElement>(null);


  const handleDesignThumbnail = useCallback(async (data: DesignerData) => {
    setIsDesignerOpen(false);
    setIsLoading(true);
    setError(null);

    try {
        // Step 1: Get the design spec from the AI
        setLoadingMessage('Designing layout...');
        const design: DesignSpecification = await getThumbnailDesign(data.topic, data.mainText, data.secondaryText);
        
        // Step 2: Generate the background image
        setLoadingMessage('Creating background...');
        const generatedBackground = await generateImage(design.backgroundPrompt);
        
        let finalImage = generatedBackground;

        // Step 3 (Optional): Process and composite the subject image
        if (data.subjectImage) {
            setLoadingMessage('Removing background from subject...');
            const subjectDataUrl = await fileToDataURL(data.subjectImage);
            const subjectWithAlpha = await removeImageBackground(subjectDataUrl);

            setLoadingMessage('Compositing image...');
            const bgImg = new Image();
            bgImg.src = generatedBackground;
            const subjectImg = new Image();
            subjectImg.src = subjectWithAlpha;

            await Promise.all([
                new Promise(res => { bgImg.onload = res; }),
                new Promise(res => { subjectImg.onload = res; }),
            ]);

            const canvas = document.createElement('canvas');
            canvas.width = 1280;
            canvas.height = 720;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");
            
            ctx.drawImage(bgImg, 0, 0, 1280, 720);
            
            // Smartly place subject on the right third, scaled nicely
            const maxSubHeight = 720 * 0.9;
            const maxSubWidth = 1280 / 3;
            const scale = Math.min(maxSubWidth / subjectImg.width, maxSubHeight / subjectImg.height);
            const sw = subjectImg.width * scale;
            const sh = subjectImg.height * scale;
            const sx = 1280 - sw - (1280 * 0.05); // place with 5% margin from right
            const sy = (720 - sh) / 2; // vertically center
            ctx.drawImage(subjectImg, sx, sy, sw, sh);

            finalImage = canvas.toDataURL('image/png');
        }

        setBaseImage(finalImage);

        // Step 4: Populate text elements from the design spec
        const newTextElements = design.textElements.map((spec: TextSpec, index: number) => ({
            id: `text-${Date.now()}-${index}`,
            ...spec
        }));
        setTextElements(newTextElements);
        setEditorMode('text');

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
    } finally {
        setIsLoading(false);
        setLoadingMessage('Generating...');
    }
  }, []);

    const handleCreateFromUpload = useCallback(async (baseImage: string, prompt: string) => {
        setIsUploadModalOpen(false);
        setIsLoading(true);
        setLoadingMessage('Transforming your image...');
        setError(null);
        try {
            const newImage = await createThumbnailFromImage(baseImage, prompt);
            setBaseImage(newImage);
            setTextElements([]); // Start with a clean slate for text
            setEditorMode('text');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
            setLoadingMessage('Generating...');
        }
    }, []);

  const handleStartOver = useCallback(() => {
    setBaseImage(null);
    setTextElements([]);
    setSelectedTextId(null);
    setError(null);
    setIsLoading(false);
    setRetouchMask(null);
    setEditorMode('text');
    setCrop(undefined);
    setCompletedCrop(undefined);
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

  const handleClearMask = useCallback(() => {
    if (maskCanvasRef.current) {
        const canvas = maskCanvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setRetouchMask(null);
  }, []);
  
  const handleApplyRetouch = useCallback(async (prompt: string) => {
    if (!baseImage || !retouchMask) return;

    setIsLoading(true);
    setLoadingMessage('Applying AI retouch...');
    setError(null);
    try {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = baseImage;
        const mask = new Image();
        mask.crossOrigin = 'anonymous';
        mask.src = retouchMask;

        await Promise.all([
            new Promise(res => { image.onload = res; image.onerror = () => { throw new Error('Failed to load base image for editing.')}}),
            new Promise(res => { mask.onload = res; mask.onerror = () => { throw new Error('Failed to load mask for editing.')}}),
        ]);

        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");

        ctx.drawImage(image, 0, 0);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(mask, 0, 0, image.width, image.height);

        const imageWithTransparency = canvas.toDataURL('image/png');
        const editedImageUrl = await editImage(imageWithTransparency, prompt);
        
        setBaseImage(editedImageUrl);
        handleClearMask();
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
    } finally {
        setIsLoading(false);
        setLoadingMessage('Generating...');
    }
  }, [baseImage, retouchMask, handleClearMask]);

  const handleApplyCrop = useCallback(async () => {
    if (!completedCrop || !imgRef.current) {
      return;
    }
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    const croppedImageUrl = canvas.toDataURL('image/png');
    setBaseImage(croppedImageUrl);
    setEditorMode('text');
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, [completedCrop]);
    
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
      if (aspect) {
          const { width, height } = e.currentTarget;
          setCrop(centerCrop(
              makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
              width,
              height
          ));
      }
  }

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

      textElements.forEach(text => {
        const x = (text.left / 100) * thumbnailWidth;
        const y = (text.top / 100) * thumbnailHeight;
        ctx.font = `900 ${text.fontSize}px ${text.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        if (text.outlineWidth > 0) {
            ctx.strokeStyle = text.outlineColor;
            ctx.lineWidth = text.outlineWidth * 2;
            ctx.strokeText(text.content, x, y);
        }
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
    if (isLoading) {
        return (
            <div className="text-center animate-fade-in flex flex-col items-center gap-4">
                <Spinner />
                <p className="text-xl text-gray-300">{loadingMessage}</p>
            </div>
        );
    }

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
      return <StartScreen onStartDesigner={() => setIsDesignerOpen(true)} onStartFromUpload={() => setIsUploadModalOpen(true)} isLoading={isLoading} />;
    }

    const editorButtonClasses = (mode: EditorMode) => `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${editorMode === mode ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'}`;

    return (
      <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
        {/* Editor Mode Toolbar */}
        <div className="bg-gray-800/60 border border-gray-700 p-1 rounded-lg flex items-center gap-1 backdrop-blur-sm">
            <button onClick={() => setEditorMode('text')} className={editorButtonClasses('text')}>
                <TextIcon className="w-5 h-5" /> Text & Layers
            </button>
            <button onClick={() => setEditorMode('retouch')} className={editorButtonClasses('retouch')}>
                <BrushIcon className="w-5 h-5" /> AI Retouch
            </button>
            <button onClick={() => setEditorMode('crop')} className={editorButtonClasses('crop')}>
                <CropIcon className="w-5 h-5" /> Crop
            </button>
        </div>

        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-start gap-6">
            {/* Left Side: Preview & Actions */}
            <div className="flex-grow w-full flex flex-col gap-4">
                <EditorPreview
                    baseImage={baseImage}
                    textElements={textElements}
                    selectedTextId={selectedTextId}
                    onSelectText={setSelectedTextId}
                    getTextShadow={getTextShadow}
                    editorMode={editorMode}
                    brushSize={brushSize}
                    onMaskChange={setRetouchMask}
                    isLoading={isLoading}
                    maskCanvasRef={maskCanvasRef}
                    crop={crop}
                    onCropChange={setCrop}
                    onCropComplete={setCompletedCrop}
                    aspect={aspect}
                    imgRef={imgRef}
                    onImageLoad={onImageLoad}
                />
                {/* Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button 
                        onClick={handleStartOver}
                        className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
                    >
                        <StartOverIcon className="w-5 h-5 mr-2" />
                        Start Over
                    </button>
                    {editorMode === 'text' && (
                        <button 
                            onClick={addText}
                            className="flex items-center justify-center text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
                        >
                            <TextIcon className="w-5 h-5 mr-2" />
                            Add Text
                        </button>
                    )}
                    <button 
                        onClick={handleDownload}
                        className={`col-span-2 ${editorMode === 'text' ? 'sm:col-span-1' : 'sm:col-span-2'} bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-5 rounded-md transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base`}
                    >
                        Download Thumbnail
                    </button>
                </div>
            </div>
            {/* Right Side: Control Panel */}
            <div className="w-full lg:w-96 lg:max-w-sm flex-shrink-0">
                {editorMode === 'text' && (
                    <ControlPanel
                        textElements={textElements}
                        selectedTextId={selectedTextId}
                        onSelectText={setSelectedTextId}
                        onDeleteText={deleteText}
                        onUpdateText={updateText}
                    />
                )}
                {editorMode === 'retouch' && (
                    <RetouchPanel
                        onApplyRetouch={handleApplyRetouch}
                        isLoading={isLoading}
                        brushSize={brushSize}
                        onBrushSizeChange={setBrushSize}
                        onClearMask={handleClearMask}
                        hasMask={!!retouchMask}
                    />
                )}
                {editorMode === 'crop' && (
                    <CropPanel
                        onApplyCrop={handleApplyCrop}
                        onSetAspect={setAspect}
                        isLoading={isLoading}
                        isCropping={!!completedCrop}
                    />
                )}
            </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header />
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex justify-center items-center`}>
        {renderContent()}
        {isDesignerOpen && (
            <DesignerModal
                onClose={() => setIsDesignerOpen(false)}
                onDesign={handleDesignThumbnail}
            />
        )}
        {isUploadModalOpen && (
            <UploadEditModal
                onClose={() => setIsUploadModalOpen(false)}
                onCreate={handleCreateFromUpload}
            />
        )}
      </main>
    </div>
  );
};

export default App;