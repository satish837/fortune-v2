import type { RequestHandler } from "express";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const handleCloudinarySimpleCount: RequestHandler = async (req, res) => {
  try {
    console.log('🔄 Cloudinary Simple Count API called');
    
    const { 
      prefix = 'diwali-postcards/background-removed/',
      resource_type = 'image',
      type = 'upload'
    } = req.query;

    console.log('📁 Fetching simple count for folder:', prefix);

    // Get the total count using Cloudinary API
    const result = await cloudinary.api.resources({
      type: type as string,
      resource_type: resource_type as string,
      prefix: prefix as string,
      max_results: 1, // We only need the count
    });

    const totalCount = result.total_count || 0;

    const responseData = {
      success: true,
      data: {
        totalCards: totalCount,
        source: 'cloudinary_api_simple',
        folder: prefix,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiInfo: {
          totalCount: result.total_count,
          hasMore: !!result.next_cursor
        }
      },
      metadata: {
        message: 'Simple count from Cloudinary API',
        lastUpdated: new Date().toISOString(),
        folder: prefix as string
      }
    };

    console.log('✅ Cloudinary simple count fetched:', totalCount);

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Error fetching Cloudinary simple count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Cloudinary count',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};
