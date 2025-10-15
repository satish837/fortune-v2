import { VercelRequest, VercelResponse } from '@vercel/node';

interface VideoGenerationRequest {
  personImageUrl: string;
  dishImageUrl: string;
  backgroundVideoUrl: string;
  greeting: string;
  width?: number;
  height?: number;
  duration?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      personImageUrl,
      dishImageUrl,
      backgroundVideoUrl,
      greeting,
      width = 720,
      height = 1280,
      duration = 5
    }: VideoGenerationRequest = req.body;

    if (!personImageUrl || !dishImageUrl || !backgroundVideoUrl) {
      return res.status(400).json({ 
        error: 'personImageUrl, dishImageUrl, and backgroundVideoUrl are required' 
      });
    }

    console.log('🎬 Video generation request received...');
    console.log('Person image:', personImageUrl);
    console.log('Dish image:', dishImageUrl);
    console.log('Background video:', backgroundVideoUrl);
    console.log('Greeting:', greeting);

    // Return the data for client-side video generation
    // This approach works better with Vercel's serverless environment
    res.json({
      success: true,
      message: 'Video generation data prepared for client-side processing',
      data: {
        personImageUrl,
        dishImageUrl,
        backgroundVideoUrl,
        greeting,
        width,
        height,
        duration
      }
    });

  } catch (error) {
    console.error('❌ Video generation error:', error);
    res.status(500).json({ 
      error: 'Video generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
