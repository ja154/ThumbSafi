/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Generates an image using generative AI based on a text prompt.
 * @param prompt The text prompt describing the desired image.
 * @returns A promise that resolves to the data URL of the generated image.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    console.log(`Generating image with prompt: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A vibrant, high-resolution, eye-catching thumbnail for a video. The thumbnail should be visually appealing and suitable for platforms like YouTube. The user's prompt is: "${prompt}"`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
            return imageUrl;
        } else {
            throw new Error('The AI model did not return an image. This may be due to safety filters or a content policy violation. Please try a different prompt.');
        }
    } catch (error) {
        console.error("Error generating image:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate image: ${error.message}`);
        }
        throw new Error('An unknown error occurred during image generation.');
    }
};

/**
 * Edits an image by filling in transparent areas based on a prompt.
 * @param imageWithTransparency The base64 data URL of the image (PNG) with transparent areas to be filled.
 * @param prompt The text prompt describing how to fill the transparent areas.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const editImage = async (imageWithTransparency: string, prompt: string): Promise<string> => {
    console.log(`Editing image with prompt: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const dataUrlToBlob = (dataUrl: string) => {
        const [header, base64Data] = dataUrl.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
        return { data: base64Data, mimeType };
    };
    
    try {
        const imagePart = { inlineData: dataUrlToBlob(imageWithTransparency) };
        const textPart = { text: `Fill in the transparent area of the image based on this instruction: "${prompt}". Do not change any other part of the image.` };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (imageResponsePart?.inlineData) {
            const base64ImageBytes = imageResponsePart.inlineData.data;
            const mimeType = imageResponsePart.inlineData.mimeType;
            return `data:${mimeType};base64,${base64ImageBytes}`;
        } else {
             throw new Error('The AI model did not return an edited image. This might be due to content restrictions. Try a different prompt or selection.');
        }
    } catch (error) {
        console.error("Error editing image:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to edit image: ${error.message}`);
        }
        throw new Error('An unknown error occurred during image editing.');
    }
};

/**
 * Creates a new thumbnail by transforming a base image using a text prompt.
 * @param baseImage The base64 data URL of the source image.
 * @param prompt The text prompt describing the desired transformation.
 * @returns A promise that resolves to the data URL of the generated thumbnail image.
 */
export const createThumbnailFromImage = async (baseImage: string, prompt:string): Promise<string> => {
    console.log(`Creating thumbnail from image with prompt: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const dataUrlToBlob = (dataUrl: string) => {
        const [header, base64Data] = dataUrl.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
        return { data: base64Data, mimeType };
    };
    
    try {
        const imagePart = { inlineData: dataUrlToBlob(baseImage) };
        const textPart = { text: `Transform this image into a vibrant, high-resolution, eye-catching 16:9 thumbnail for a video. Apply the following instruction: "${prompt}". Ensure the final image is compelling and suitable for platforms like YouTube.` };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (imageResponsePart?.inlineData) {
            const base64ImageBytes = imageResponsePart.inlineData.data;
            const mimeType = imageResponsePart.inlineData.mimeType;
            return `data:${mimeType};base64,${base64ImageBytes}`;
        } else {
             throw new Error('The AI model did not return an edited image. This might be due to content restrictions. Try a different prompt.');
        }
    } catch (error) {
        console.error("Error creating thumbnail from image:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to create thumbnail from image: ${error.message}`);
        }
        throw new Error('An unknown error occurred during image transformation.');
    }
};