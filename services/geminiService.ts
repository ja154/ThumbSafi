/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";

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
