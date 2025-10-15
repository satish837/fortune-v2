import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let isLoaded = false;

export const loadFFmpeg = async (): Promise<void> => {
  if (isLoaded && ffmpeg) {
    console.log('✅ FFmpeg already loaded');
    return;
  }

  try {
    console.log('🔄 Loading FFmpeg...');
    ffmpeg = new FFmpeg();
    
    // Load FFmpeg with CDN URLs for better performance
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    console.log('📦 Loading FFmpeg core files...');
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    isLoaded = true;
    console.log('✅ FFmpeg loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load FFmpeg:', error);
    ffmpeg = null;
    isLoaded = false;
    throw new Error(`Failed to load video converter: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const convertWebMToMP4 = async (webmBlob: Blob): Promise<Blob> => {
  if (!ffmpeg || !isLoaded) {
    console.log('🔄 FFmpeg not loaded, loading now...');
    await loadFFmpeg();
  }

  if (!ffmpeg) {
    throw new Error('FFmpeg not loaded after loading attempt');
  }

  try {
    console.log('🎬 Starting WebM to MP4 conversion...');
    console.log(`📊 Input WebM size: ${(webmBlob.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Write the input file
    const inputName = 'input.webm';
    const outputName = 'output.mp4';
    
    console.log('📝 Writing input file to FFmpeg...');
    await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));
    
    console.log('⚙️ Running FFmpeg conversion...');
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
    
    console.log('📖 Reading output file from FFmpeg...');
    // Read the output file
    const data = await ffmpeg.readFile(outputName);
    
    console.log('🧹 Cleaning up FFmpeg files...');
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
    throw new Error(`Failed to convert video to MP4: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const isFFmpegSupported = (): boolean => {
  // Check if WebAssembly is supported
  return typeof WebAssembly !== 'undefined' && 
         typeof SharedArrayBuffer !== 'undefined';
};
