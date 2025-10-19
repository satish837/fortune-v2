import type { RequestHandler } from "express";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const handleCloudinaryCount: RequestHandler = async (req, res) => {
  try {
    console.log('🔄 Cloudinary Count API called');
    
    const { 
      prefix = 'diwali-postcards/background-removed/',
      resource_type = 'image',
      type = 'upload'
    } = req.query;

    console.log('📁 Fetching count for folder:', prefix);

    // Calculate date ranges for time-based counts
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get the total count using Cloudinary API
    const result = await cloudinary.api.resources({
      type: type as string,
      resource_type: resource_type as string,
      prefix: prefix as string,
      max_results: 1, // We only need the count, not the actual resources
    });

    // Get all resources to filter by date (fetch all available resources)
    // Note: Cloudinary API has pagination limits, so we'll fetch in batches
    let allResources: any[] = [];
    let nextCursor = null;
    let totalFetched = 0;
    const maxResources = 50000; // Increased limit to handle large collections

    do {
      const batchResult = await cloudinary.api.resources({
        type: type as string,
        resource_type: resource_type as string,
        prefix: prefix as string,
        max_results: 500,
        next_cursor: nextCursor
      });

      allResources = allResources.concat(batchResult.resources);
      nextCursor = batchResult.next_cursor;
      totalFetched += batchResult.resources.length;

      // Break if we've fetched enough or no more resources
      if (totalFetched >= maxResources || !nextCursor) {
        break;
      }
    } while (nextCursor);

    const totalCount = result.total_count || allResources.length;
    
    // Filter by creation date
    const cardsToday = allResources.filter((resource: any) => {
      const createdDate = new Date(resource.created_at);
      return createdDate >= today;
    }).length;

    const cardsLast7Days = allResources.filter((resource: any) => {
      const createdDate = new Date(resource.created_at);
      return createdDate >= last7Days;
    }).length;

    const cardsLast30Days = allResources.filter((resource: any) => {
      const createdDate = new Date(resource.created_at);
      return createdDate >= last30Days;
    }).length;

    const responseData = {
      success: true,
      data: {
        totalCards: totalCount,
        cardsToday: cardsToday,
        cardsLast7Days: cardsLast7Days,
        cardsLast30Days: cardsLast30Days,
        source: 'cloudinary_api',
        folder: prefix,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiInfo: {
          totalCount: result.total_count,
          resourcesFetched: allResources.length,
          hasMore: !!nextCursor,
          totalFetched: totalFetched
        }
      },
      metadata: {
        message: 'Real-time count from Cloudinary API',
        lastUpdated: new Date().toISOString(),
        folder: prefix as string
      }
    };

    console.log('✅ Cloudinary count fetched successfully:', {
      total: totalCount,
      today: cardsToday,
      last7Days: cardsLast7Days,
      last30Days: cardsLast30Days
    });

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Error fetching Cloudinary count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Cloudinary count',
      details: error instanceof Error ? error.message : String(error),
      fallback: {
        message: 'Using fallback data',
        suggestion: 'Check Cloudinary credentials and folder path'
      }
    });
  }
};
