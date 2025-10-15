import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let isLoaded = false;

export const loadFFmpeg = async (): Promise<void> => {
  if (isLoaded && ffmpeg) return;

  try {
    ffmpeg = new FFmpeg();
    
    // Load FFmpeg with CDN URLs for better performance
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    isLoaded = true;
    console.log('✅ FFmpeg loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load FFmpeg:', error);
    throw new Error('Failed to load video converter');
  }
};

export const convertWebMToMP4 = async (webmBlob: Blob): Promise<Blob> => {
  if (!ffmpeg || !isLoaded) {
    await loadFFmpeg();
  }

  if (!ffmpeg) {
    throw new Error('FFmpeg not loaded');
  }

  try {
    console.log('🎬 Starting WebM to MP4 conversion...');
    
    // Write the input file
    const inputName = 'input.webm';
    const outputName = 'output.mp4';
    
    await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));
    
    // Run FFmpeg command to convert WebM to MP4
    await ffmpeg.exec([
      '-i', inputName,
      '-c:v', 'libx264',        // Use H.264 codec
      '-c:a', 'aac',            // Use AAC audio codec
      '-preset', 'fast',        // Fast encoding preset
      '-crf', '23',             // Constant rate factor (good quality)
      '-movflags', '+faststart', // Optimize for web streaming
      '-y',                     // Overwrite output file
      outputName
    ]);
    
    // Read the output file
    const data = await ffmpeg.readFile(outputName);
    
    // Clean up files
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    
    // Convert to Blob
    const mp4Blob = new Blob([data], { type: 'video/mp4' });
    
    console.log('✅ WebM to MP4 conversion completed');
    console.log(`📊 Original size: ${(webmBlob.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📊 Converted size: ${(mp4Blob.size / 1024 / 1024).toFixed(2)} MB`);
    
    return mp4Blob;
  } catch (error) {
    console.error('❌ Video conversion failed:', error);
    throw new Error('Failed to convert video to MP4');
  }
};

export const isFFmpegSupported = (): boolean => {
  // Check if WebAssembly is supported
  return typeof WebAssembly !== 'undefined' && 
         typeof SharedArrayBuffer !== 'undefined';
};
