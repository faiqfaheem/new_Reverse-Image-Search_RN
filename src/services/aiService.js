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
      if (response.status === 429 || errorText.includes('Too Many Attempts')) {
        throw new Error('429: Too Many Attempts');
      }
      throw new Error(`HTTP ${response.status}`);
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
const ensureFileSchemeUri = (uri) => {
  if (!uri) return uri;
  if (uri.startsWith('content://') || uri.startsWith('file://') || uri.startsWith('data:') || uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  return `file://${uri}`;
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

    let localFileUri = ensureFileSchemeUri(sourceImageUri);
    if (sourceImageUri && (sourceImageUri.startsWith('http://') || sourceImageUri.startsWith('https://'))) {
      const tempTarget = `${FileSystem.cacheDirectory}temp_remix_input_${Date.now()}.jpg`;
      const downloadRes = await FileSystem.downloadAsync(sourceImageUri, tempTarget);
      localFileUri = downloadRes.uri;
    }

    let uploadUri = localFileUri;
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        localFileUri,
        [{ resize: { width: sizeObj.width, height: sizeObj.height } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      if (manipResult && manipResult.uri) {
        uploadUri = manipResult.uri;
      }
    } catch (e) {
      console.warn("[deAPI Engine] Image resize failed, using original URI:", e);
    }

    uploadUri = ensureFileSchemeUri(uploadUri);

    const promptText = (style_preset && typeof style_preset === 'string' && style_preset.trim().length > 0)
      ? style_preset.trim()
      : 'Cinematic highly detailed digital art portrait, 8k resolution, photorealistic masterpiece';

    let uploadResult;
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (FileSystem.uploadAsync && FileSystem.FileSystemUploadType) {
          uploadResult = await FileSystem.uploadAsync(
            'https://api.deapi.ai/api/v2/images/edits',
            uploadUri,
            {
              httpMethod: 'POST',
              uploadType: FileSystem.FileSystemUploadType.MULTIPART,
              fieldName: 'image',
              mimeType: 'image/jpeg',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json',
              },
              parameters: {
                prompt: promptText,
                model: 'Flux_2_Klein_4B_BF16',
                seed: Math.floor(Math.random() * 999999999).toString(),
                steps: '4',
                width: sizeObj.width.toString(),
                height: sizeObj.height.toString(),
              },
            }
          );
        } else {
          const formData = new FormData();
          formData.append('image', {
            uri: uploadUri,
            name: 'source_image.jpg',
            type: 'image/jpeg',
          });
          formData.append('prompt', promptText);
          formData.append('model', 'Flux_2_Klein_4B_BF16');
          formData.append('seed', Math.floor(Math.random() * 999999999).toString());
          formData.append('steps', '4');
          formData.append('width', sizeObj.width.toString());
          formData.append('height', sizeObj.height.toString());

          const response = await fetch('https://api.deapi.ai/api/v2/images/edits', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/json',
            },
            body: formData,
            signal: fetchSignal
          });
          const textBody = await response.text();
          uploadResult = { status: response.status, body: textBody };
        }
      } catch (err) {
        console.error(`[deAPI Engine] Upload attempt ${attempt} failed:`, err);
        if (attempt === maxRetries) throw err;
      }

      if (uploadResult && uploadResult.status === 429 && attempt < maxRetries) {
        const backoffMs = attempt * 3000;
        console.warn(`[deAPI Engine] Rate limited (429). Retrying in ${backoffMs / 1000}s (Attempt ${attempt}/${maxRetries})...`);
        await new Promise(res => setTimeout(res, backoffMs));
        continue;
      }
      break;
    }

    if (!uploadResult || uploadResult.status < 200 || uploadResult.status >= 300) {
      const errorText = uploadResult?.body || 'No response received from deAPI server';
      console.error("[deAPI Engine] HTTP Error:", uploadResult?.status, errorText);
      if (uploadResult?.status === 429) {
        throw new Error("deAPI rate limit reached. Please wait a few seconds and try again.");
      }
      try {
        const parsed = JSON.parse(errorText);
        const msg = parsed.message || parsed.error || (parsed.errors ? JSON.stringify(parsed.errors) : errorText);
        throw new Error(`deAPI Error (${uploadResult?.status}): ${msg}`);
      } catch (_) {
        throw new Error(`deAPI HTTP ${uploadResult?.status}: ${errorText}`);
      }
    }

    const data = typeof uploadResult.body === 'string' ? JSON.parse(uploadResult.body) : uploadResult.body;
    
    let resultUrl = '';
    let requestId =
      data?.data?.request_id ||
      data?.request_id ||
      data?.data?.id ||
      data?.id ||
      data?.data?.job_id ||
      data?.job_id ||
      data?.data?.task_id ||
      data?.task_id;

    if (requestId) {
      console.log(`[deAPI Engine] Job submitted (ID: ${requestId}). Polling for results...`);
      for (let i = 0; i < 60; i++) { // Poll for up to 150 seconds
        await new Promise(resolve => setTimeout(resolve, 2500));
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
          
          if (jobData.result_url) {
            resultUrl = jobData.result_url;
            break;
          } else if (jobData.url) {
            resultUrl = jobData.url;
            break;
          } else if (jobData.image_url) {
            resultUrl = jobData.image_url;
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
          } else if (jobData.data && (jobData.data.result_url || jobData.data.url || jobData.data.image_url)) {
            resultUrl = jobData.data.result_url || jobData.data.url || jobData.data.image_url;
            break;
          }
          
          if (jobData.status === 'done' || jobData.status === 'completed' || jobData.status === 'succeeded') {
            if (resultUrl) break;
            console.warn(`[deAPI Engine] Job is marked as done but no URL was found in expected keys. Full data:`, jobData);
            break;
          }
        } else {
          console.warn(`[deAPI Engine] Poll request failed with status: ${pollResponse.status}`);
        }
      }
    } else {
      if (data && data.data) {
        if (Array.isArray(data.data) && data.data.length > 0) {
          resultUrl = data.data[0].url || (data.data[0].b64_json ? `data:image/jpeg;base64,${data.data[0].b64_json}` : '');
        } else if (typeof data.data === 'object') {
          resultUrl = data.data.result_url || data.data.url || data.data.image_url || '';
        }
      }
      if (!resultUrl && data && (data.url || data.result_url || data.image_url)) {
        resultUrl = data.url || data.result_url || data.image_url;
      }
    }
    
    if (!resultUrl) {
      console.error("[deAPI Engine] Unrecognized response format or job timed out:", data);
      throw new Error("Could not parse image URL from deAPI response");
    }

    return resultUrl;
  } catch (error) {
    const errorDetails = error?.response?.data || error?.message || error || 'Unknown error';
    console.error("[deAPI Engine] Execution pipeline failed:", errorDetails);
    throw (error instanceof Error ? error : new Error(typeof error === 'string' && error.trim() ? error : 'Image generation pipeline failed'));
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getCleanErrorMessage(err) {
  const msg = err?.message || String(err || '');
  if (msg.includes('429') || msg.toLowerCase().includes('too many') || msg.toLowerCase().includes('rate limit')) {
    return 'The AI server is currently busy. Please wait a moment and try again.';
  }
  if (msg.includes('500') || msg.includes('502') || msg.includes('503')) {
    return 'The AI server experienced a temporary issue. Please try again shortly.';
  }
  if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('timeout') || msg.includes('AbortError')) {
    return 'Network connection weak or timed out. Please check your connection and try again.';
  }
  return 'Unable to generate image right now. Please try again in a few moments.';
}


