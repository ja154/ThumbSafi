/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Modality, Type } from "@google/genai";

// Interfaces for the new design specification
export interface TextSpec {
    content: string;
    color: string;
    fontSize: number;
    fontFamily: string;
    top: number;
    left: number;
    outlineColor: string;
    outlineWidth: number;
}

export interface DesignSpecification {
    backgroundPrompt: string;
    textElements: TextSpec[];
}


/**
 * Acts as an expert designer, creating a full thumbnail composition specification.
 * @param topic The general topic of the video.
 * @param mainText The primary, high-impact text.
 * @param secondaryText Optional supporting text.
 * @returns A promise resolving to a `DesignSpecification` object.
 */
export const getThumbnailDesign = async (topic: string, mainText: string, secondaryText?: string): Promise<DesignSpecification> => {
    console.log(`Getting thumbnail design for topic: ${topic}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const userPrompt = `
        Video Topic: "${topic}"
        Main, most important text: "${mainText}"
        ${secondaryText ? `Secondary, less important text: "${secondaryText}"` : ''}
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            backgroundPrompt: {
                type: Type.STRING,
                description: 'A detailed, vibrant, and visually appealing prompt to generate a background image. The background should complement the topic but not be overly distracting. Often a blurred or abstract version of the topic is best.'
            },
            textElements: {
                type: Type.ARRAY,
                description: 'An array of text elements to be placed on the thumbnail.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        content: { type: Type.STRING, description: 'The text content.' },
                        color: { type: Type.STRING, description: 'The hex color code for the text (e.g., #FFFF00 for yellow).' },
                        fontSize: { type: Type.NUMBER, description: 'A relative font size, from 60 (medium) to 150 (very large). Main text should be largest.' },
                        fontFamily: { type: Type.STRING, description: "Font family. Choose one from: 'Anton', 'Bebas Neue', 'Archivo Black'." },
                        top: { type: Type.NUMBER, description: 'The top position as a percentage of the thumbnail height (0-100).' },
                        left: { type: Type.NUMBER, description: 'The left position as a percentage of the thumbnail width (0-100).' },
                        outlineColor: { type: Type.STRING, description: 'The hex color code for the text outline (e.g., #000000).' },
                        outlineWidth: { type: Type.NUMBER, description: 'A relative width for the outline, from 1 to 10. Should be thick enough to be readable.' },
                    },
                    required: ["content", "color", "fontSize", "fontFamily", "top", "left", "outlineColor", "outlineWidth"]
                }
            }
        },
        required: ["backgroundPrompt", "textElements"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: `You are an expert YouTube thumbnail designer for top-tier creators. Your goal is to create a design specification for a high-click-through-rate thumbnail.
- Create a clear visual hierarchy. The main text must be dominant and eye-catching.
- Use high-contrast colors. Bright, saturated text on a darker background is extremely effective.
- Position text for maximum impact and readability.
- Follow modern, clean design trends. Think popular tech and commentary YouTubers.
- The user may add a subject image later, so leave a clear area (usually the right third of the image) for the subject. The text should occupy the opposite side (the left two-thirds).`,
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            }
        });

        const jsonText = response.text.trim();
        const design = JSON.parse(jsonText) as DesignSpecification;
        if (!design.backgroundPrompt || !Array.isArray(design.textElements)) {
            throw new Error("Invalid design spec received from AI.");
        }
        return design;
    } catch (e) {
        console.error("Failed to parse thumbnail design spec:", e);
        throw new Error("The AI returned an invalid design format. Please try a different prompt.");
    }
};

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
            prompt: `A vibrant, high-resolution, eye-catching thumbnail background for a video, based on the following description. The image should be visually appealing and suitable for platforms like YouTube. User prompt: "${prompt}"`,
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
                responseModalities: [Modality.IMAGE],
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
                responseModalities: [Modality.IMAGE],
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

/**
 * Removes the background from a given image, making it transparent.
 * @param baseImage The base64 data URL of the source image.
 * @returns A promise that resolves to the data URL of the image with a transparent background.
 */
export const removeImageBackground = async (baseImage: string): Promise<string> => {
    console.log(`Removing background from image.`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const dataUrlToBlob = (dataUrl: string) => {
        const [header, base64Data] = dataUrl.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
        return { data: base64Data, mimeType };
    };

    try {
        const imagePart = { inlineData: dataUrlToBlob(baseImage) };
        const textPart = { text: `Isolate the main subject and completely remove the background, making it fully transparent. The output must be a PNG with an alpha channel.` };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (imageResponsePart?.inlineData && imageResponsePart.inlineData.mimeType === 'image/png') {
            const base64ImageBytes = imageResponsePart.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
             throw new Error('The AI model could not remove the background. Try an image with a clearer subject.');
        }
    } catch (error) {
        console.error("Error removing image background:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to remove background: ${error.message}`);
        }
        throw new Error('An unknown error occurred during background removal.');
    }
};