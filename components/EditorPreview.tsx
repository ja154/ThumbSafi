/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import type { TextElement } from '../App';

interface EditorPreviewProps {
  baseImage: string | null;
  textElements: TextElement[];
  selectedTextId: string | null;
  onSelectText: (id: string) => void;
  getTextShadow: (text: TextElement) => string;
  editorMode: 'text' | 'retouch' | 'crop';
  brushSize: number;
  onMaskChange: (maskDataUrl: string | null) => void;
  isLoading: boolean;
  maskCanvasRef: React.RefObject<HTMLCanvasElement>;
  crop: Crop | undefined;
  onCropChange: (crop: Crop) => void;
  onCropComplete: (crop: PixelCrop) => void;
  aspect: number | undefined;
  imgRef: React.RefObject<HTMLImageElement>;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const EditorPreview: React.FC<EditorPreviewProps> = ({
  baseImage,
  textElements,
  selectedTextId,
  onSelectText,
  getTextShadow,
  editorMode,
  brushSize,
  onMaskChange,
  isLoading,
  maskCanvasRef,
  crop,
  onCropChange,
  onCropComplete,
  aspect,
  imgRef,
  onImageLoad,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushCursor, setBrushCursor] = useState('crosshair');

  useEffect(() => {
    if (editorMode !== 'retouch') return;
    const canvas = document.createElement('canvas');
    const size = Math.max(brushSize, 2);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 1, 0, 2 * Math.PI);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, 1, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        setBrushCursor(`url(${canvas.toDataURL()}) ${size / 2} ${size / 2}, auto`);
    }
  }, [brushSize, editorMode]);


  const getCoords = (e: React.MouseEvent<HTMLCanvasElement>): { x: number, y: number } | null => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
    };
  }

  const drawOnCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !maskCanvasRef.current) return;
    const coords = getCoords(e);
    if (!coords) return;
    
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editorMode !== 'retouch' || isLoading) return;
    setIsDrawing(true);
    drawOnCanvas(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editorMode !== 'retouch' || isLoading) return;
    drawOnCanvas(e);
  };
  
  const handleMouseUp = () => {
    if (editorMode !== 'retouch' || !isDrawing) return;
    setIsDrawing(false);
    
    if (maskCanvasRef.current) {
        const displayCanvas = maskCanvasRef.current;
        const bwMaskCanvas = document.createElement('canvas');
        bwMaskCanvas.width = displayCanvas.width;
        bwMaskCanvas.height = displayCanvas.height;
        const bwCtx = bwMaskCanvas.getContext('2d', { willReadFrequently: true });
        if (!bwCtx) return;

        bwCtx.drawImage(displayCanvas, 0, 0);
        const imageData = bwCtx.getImageData(0, 0, bwMaskCanvas.width, bwMaskCanvas.height);
        const data = imageData.data;
        let hasDrawing = false;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) { // Check if pixel is not transparent
                hasDrawing = true;
                // Make it pure white for the mask
                data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
            } else {
                // Make it pure black for the mask
                data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255;
            }
        }
        bwCtx.putImageData(imageData, 0, 0);
        
        onMaskChange(hasDrawing ? bwMaskCanvas.toDataURL('image/png') : null);
    }
  };

  const resizeCanvas = useCallback(() => {
    if (maskCanvasRef.current && containerRef.current) {
        maskCanvasRef.current.width = containerRef.current.clientWidth;
        maskCanvasRef.current.height = containerRef.current.clientHeight;
    }
  }, [maskCanvasRef]);
  
  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  return (
    <div ref={containerRef} className="w-full aspect-video bg-black/50 rounded-lg shadow-2xl overflow-hidden relative border border-gray-700">
        {baseImage && (
            <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => onCropChange(percentCrop)}
                onComplete={c => onCropComplete(c)}
                aspect={aspect}
                disabled={editorMode !== 'crop' || isLoading}
                className={`w-full h-full ${editorMode !== 'crop' ? 'inactive-crop' : ''}`}
            >
                <img
                    ref={imgRef}
                    alt="Thumbnail preview"
                    src={baseImage}
                    onLoad={onImageLoad}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
            </ReactCrop>
        )}

        {/* Text Elements Overlay */}
        {textElements.map(text => (
            <div
                key={text.id}
                onClick={() => editorMode === 'text' && onSelectText(text.id)}
                className={`absolute p-2 ${editorMode === 'text' ? 'cursor-pointer' : 'pointer-events-none'} ${selectedTextId === text.id ? 'outline-dashed outline-2 outline-blue-400' : ''}`}
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
        
        {/* Retouch Canvas Overlay */}
        <canvas
            ref={maskCanvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`absolute inset-0 z-20 ${editorMode === 'retouch' ? 'pointer-events-auto' : 'pointer-events-none'}`}
            style={{ cursor: editorMode === 'retouch' ? brushCursor : 'default' }}
        />
    </div>
  )
};

export default EditorPreview;