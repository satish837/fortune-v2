import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('🔄 Cloudinary Simple API called on Vercel');
    
    // Check if Cloudinary credentials are available
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.log('❌ Cloudinary credentials not configured');
      res.status(500).json({
        success: false,
        error: 'Cloudinary credentials not configured',
        details: 'Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET'
      });
      return;
    }

    // For now, return a static response with your actual count
    // This will work immediately while we debug the Cloudinary API
    const responseData = {
      success: true,
      data: {
        totalCards: 5775, // Your actual count from local testing
        cardsToday: 155,
        cardsLast7Days: 5775,
        cardsLast30Days: 5775,
        source: 'cloudinary_static',
        folder: 'diwali-postcards/background-removed/',
        cloudName: cloudName,
        note: 'Using static data while Cloudinary API is being configured'
      },
      metadata: {
        message: 'Static Cloudinary data (API configuration in progress)',
        lastUpdated: new Date().toISOString(),
        folder: 'diwali-postcards/background-removed/'
      }
    };

    console.log('✅ Cloudinary simple response sent');
    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Error in Cloudinary Simple API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process Cloudinary request',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
