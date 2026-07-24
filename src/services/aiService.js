import axios from 'axios';
import { Buffer } from 'buffer';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/**
 * Connects to deAPI's generations API to generate an image based on the prompt text and options.
 * 
 * @param {string} promptText - The prompt description for the image to generate.
 * @param {object} options - Generation configurations (aspectRatio, negativePrompt, style).
 * @returns {Promise<string>} A promise that resolves to the generated image URL.
 */
export async function generateAIImage(promptText, options = {}) {
  const { aspectRatio = '1:1', style_preset = '', signal } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute default timeout
  const fetchSignal = signal || controller.signal;

  try {
    const apiKey = process.env.EXPO_PUBLIC_DEAPI_API_KEY;
    if (!apiKey) {
      throw new Error("EXPO_PUBLIC_DEAPI_API_KEY is not defined in your .env configuration.");
    }

    // 1. Simplified Style Mapping
    const styleNames = {
      '3d-model': '3D model',
      'analog-film': 'analog film',
      'anime': 'anime',
      'cinematic': 'cinematic',
      'comic-book': 'comic book',
      'digital-art': 'digital art',
      'enhance': 'enhanced',
      'fantasy-art': 'fantasy art',
      'isometric': 'isometric',
      'line-art': 'line art',
      'low-poly': 'low poly',
      'modeling-compound': 'modeling compound',
      'neon-punk': 'neon punk',
      'origami': 'origami',
      'photographic': 'photographic',
      'pixel-art': 'pixel art'
    };

    let finalPrompt = promptText.trim();
    if (style_preset && style_preset !== 'none') {
      const cleanStyle = styleNames[style_preset] || style_preset.replace(/-/g, ' ');
      finalPrompt = `${finalPrompt} in ${cleanStyle}`;
    }

    // 2. Map Aspect Ratio to Dimensions
    const ratioToSize = {
      '1:1': { width: 1024, height: 1024 },
      '4:3': { width: 1024, height: 768 },
      '3:2': { width: 1024, height: 683 },
      '16:9': { width: 1024, height: 576 },
      '2:3': { width: 683, height: 1024 },
      '9:16': { width: 576, height: 1024 },
      '5:4': { width: 1024, height: 819 },
      '4:5': { width: 819, height: 1024 },
      '21:9': { width: 1024, height: 439 },
      '9:21': { width: 439, height: 1024 }
    };

    const sizeObj = ratioToSize[aspectRatio] || ratioToSize['1:1'];

    console.log(`[deAPI Text2Image] Prompt: "${finalPrompt}", Aspect Ratio: "${aspectRatio}", Size: ${sizeObj.width}x${sizeObj.height}`);

    const requestBody = {
      prompt: finalPrompt,
      model: 'Flux1schnell',
      width: sizeObj.width,
      height: sizeObj.height,
      seed: Math.floor(Math.random() * 999999999),
      steps: 4
    };

    const response = await fetch(
      'https://api.deapi.ai/api/v2/images/generations',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: fetchSignal
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[deAPI Text2Image] HTTP Error:", response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    let resultUrl = '';
    let requestId = data?.data?.request_id || data?.request_id;

    // Handle Async Polling (if deAPI returns a job ID instead of direct result)
    if (requestId) {
      console.log(`[deAPI Text2Image] Job submitted (ID: ${requestId}). Polling for results...`);
      for (let i = 0; i < 60; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const pollResponse = await fetch(`https://api.deapi.ai/api/v2/jobs/${requestId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
          signal: fetchSignal
        });
        
        if (pollResponse.ok) {
          const pollData = await pollResponse.json();
          const jobData = pollData.data || pollData;
          
          if (jobData.status === 'failed' || jobData.status === 'error') {
            throw new Error(`deAPI job failed: ${jobData.error || jobData.message || JSON.stringify(jobData)}`);
          }
          
          if (jobData.result_url) {
            resultUrl = jobData.result_url;
            break;
          } else if (jobData.url) {
            resultUrl = jobData.url;
            break;
          } else if (jobData.images && jobData.images[0]) {
            resultUrl = jobData.images[0].url || jobData.images[0];
            break;
          } else if (jobData.output && jobData.output.url) {
            resultUrl = jobData.output.url;
            break;
          } else if (Array.isArray(jobData.output) && jobData.output[0]) {
             resultUrl = typeof jobData.output[0] === 'string' ? jobData.output[0] : jobData.output[0].url;
             if (resultUrl) break;
          } else if (jobData.result && jobData.result.url) {
             resultUrl = jobData.result.url;
             break;
          }
          
          if (jobData.status === 'done' || jobData.status === 'completed' || jobData.status === 'succeeded') {
            console.warn(`[deAPI Text2Image] Job is marked as done but no URL was found in expected keys. Full data:`, jobData);
            break;
          }
        }
      }
    } else {
      // Handle Synchronous Response
      if (data && data.data && data.data.length > 0) {
        resultUrl = data.data[0].url || (data.data[0].b64_json ? `data:image/jpeg;base64,${data.data[0].b64_json}` : '');
      } else if (data && data.url) {
        resultUrl = data.url;
      }
    }

    if (!resultUrl) {
      console.error("[deAPI Text2Image] Unrecognized response format or job timed out:", data);
      throw new Error("Could not parse image URL from deAPI response");
    }

    clearTimeout(timeoutId);
    return resultUrl;
  } catch (error) {
    console.error('Error generating AI image with deAPI:', error);
    throw error;
  }
}

/**
 * Full-Image Style Transfer via deAPI.
 * Applies a style prompt over the entire uploaded image geometry.
 * @param {string} sourceImageUri - Local file URI of the user's uploaded image.
 * @param {string} style_preset - The style or template description to apply.
 * @param {object} options - Generation options containing signal
 * @returns {Promise<string>} Output render result image as Base64 or URL data URI.
 */
const formatIosImageUri = (uri) => {
  if (Platform.OS !== 'ios' || !uri) return uri;
  // Ensure file:// scheme exists for iOS multi-part uploads
  return uri.startsWith('file://') ? uri : `file://${uri}`;
};

export async function generateImageToImage(sourceImageUri, style_preset, options = {}) {
  const { aspectRatio = '1:1', signal } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute default timeout
  const fetchSignal = signal || controller.signal;
  try {
    const apiKey = process.env.EXPO_PUBLIC_DEAPI_API_KEY;
    if (!apiKey) {
      throw new Error("EXPO_PUBLIC_DEAPI_API_KEY is not defined in your .env configuration.");
    }

    const ratioToSize = {
      '1:1': { width: 1024, height: 1024 },
      '4:3': { width: 1024, height: 768 },
      '3:2': { width: 1024, height: 683 },
      '2:3': { width: 683, height: 1024 },
      '16:9': { width: 1024, height: 576 },
      '9:16': { width: 576, height: 1024 },
      '5:4': { width: 1024, height: 819 },
      '4:5': { width: 819, height: 1024 }
    };
    const sizeObj = ratioToSize[aspectRatio] || ratioToSize['1:1'];

    console.log(`[deAPI Engine] Launching Image-to-Image synthesis job... Aspect Ratio: "${aspectRatio}", Size: ${sizeObj.width}x${sizeObj.height}`);

    const validSourceUri = formatIosImageUri(sourceImageUri);

    let processedImageUri = validSourceUri;
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        validSourceUri,
        [{ resize: { width: sizeObj.width, height: sizeObj.height } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      processedImageUri = manipResult.uri;
    } catch (e) {
      console.warn("[deAPI Engine] Image resize failed, using original:", e);
    }

    const uploadUri = formatIosImageUri(processedImageUri);

    const formData = new FormData();
    formData.append('image', {
      uri: uploadUri,
      name: 'source_image.jpg',
      type: 'image/jpeg',
    });

    const promptText = style_preset; // style_preset now carries the full prompt
    
    formData.append('prompt', promptText);
    formData.append('model', 'Flux_2_Klein_4B_BF16');
    formData.append('seed', Math.floor(Math.random() * 999999999).toString());
    formData.append('steps', '4');
    formData.append('width', sizeObj.width.toString());
    formData.append('height', sizeObj.height.toString());

    const response = await fetch(
      'https://api.deapi.ai/api/v2/images/edits',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        body: formData,
        signal: fetchSignal
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[deAPI Engine] HTTP Error:", response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    let resultUrl = '';
    let requestId = data?.data?.request_id || data?.request_id;

    if (requestId) {
      console.log(`[deAPI Engine] Job submitted (ID: ${requestId}). Polling for results...`);
      for (let i = 0; i < 60; i++) { // Poll for up to 120 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        const pollResponse = await fetch(`https://api.deapi.ai/api/v2/jobs/${requestId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
          signal: fetchSignal
        });
        
        if (pollResponse.ok) {
          const pollData = await pollResponse.json();
          const jobData = pollData.data || pollData;
          
          console.log(`[deAPI Engine] Poll ${i + 1}/60 - Status: ${jobData.status || 'unknown'}`);
          
          if (jobData.status === 'failed' || jobData.status === 'error') {
            throw new Error(`deAPI job failed: ${jobData.error || jobData.message || JSON.stringify(jobData)}`);
          }
          
          // Try to extract URL from various common response structures
          if (jobData.result_url) {
            resultUrl = jobData.result_url;
            break;
          } else if (jobData.url) {
            resultUrl = jobData.url;
            break;
          } else if (jobData.images && jobData.images[0]) {
            resultUrl = jobData.images[0].url || jobData.images[0];
            break;
          } else if (jobData.output && jobData.output.url) {
            resultUrl = jobData.output.url;
            break;
          } else if (Array.isArray(jobData.output) && jobData.output[0]) {
             resultUrl = typeof jobData.output[0] === 'string' ? jobData.output[0] : jobData.output[0].url;
             if (resultUrl) break;
          } else if (jobData.result && jobData.result.url) {
             resultUrl = jobData.result.url;
             break;
          }
          
          if (jobData.status === 'done' || jobData.status === 'completed' || jobData.status === 'succeeded') {
            console.warn(`[deAPI Engine] Job is marked as done but no URL was found in expected keys. Full data:`, jobData);
            break;
          }
        } else {
          console.warn(`[deAPI Engine] Poll request failed with status: ${pollResponse.status}`);
        }
      }
    } else {
      // Standard synchronous response parsing
      if (data && data.data && data.data.length > 0) {
        resultUrl = data.data[0].url || (data.data[0].b64_json ? `data:image/jpeg;base64,${data.data[0].b64_json}` : '');
      } else if (data && data.url) {
        resultUrl = data.url;
      }
    }
    
    if (!resultUrl) {
      console.error("[deAPI Engine] Unrecognized response format or job timed out:", data);
      throw new Error("Could not parse image URL from deAPI response");
    }

    return resultUrl;
  } catch (error) {
    const errorDetails = error?.response?.data || error?.message || error;
    console.error("[deAPI Engine] Execution pipeline failed:", errorDetails);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}


