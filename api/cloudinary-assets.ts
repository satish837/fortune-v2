import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Cloudinary Management API configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_MANAGEMENT_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image`;

// Generate Cloudinary signature for authenticated requests
function generateSignature(params: Record<string, any>, secret: string): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return crypto
    .createHash('sha1')
    .update(sortedParams + secret)
    .digest('hex');
}

// Fetch assets from Cloudinary with filtering
async function fetchCloudinaryAssets(options: {
  maxResults?: number;
  nextCursor?: string;
  prefix?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
}) {
  const {
    maxResults = 100,
    nextCursor,
    prefix = 'generated-cards/', // Assuming cards are stored with this prefix
    tags = [],
    startDate,
    endDate
  } = options;

  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  
  const params: Record<string, any> = {
    max_results: maxResults,
    prefix: prefix,
    timestamp: timestamp
  };

  if (nextCursor) {
    params.next_cursor = nextCursor;
  }

  if (tags.length > 0) {
    params.tags = tags.join(',');
  }

  if (startDate) {
    params.start_at = startDate;
  }

  if (endDate) {
    params.end_at = endDate;
  }

  const signature = generateSignature(params, CLOUDINARY_API_SECRET!);
  
  const queryParams = new URLSearchParams({
    ...params,
    signature,
    api_key: CLOUDINARY_API_KEY!
  });

  const response = await fetch(`${CLOUDINARY_MANAGEMENT_API_URL}?${queryParams}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Calculate date ranges
function getDateRanges() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    today: today.toISOString(),
    last7Days: last7Days.toISOString(),
    last30Days: last30Days.toISOString()
  };
}

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
    console.log('🔄 Cloudinary Assets API called');
    console.log('🔑 Cloudinary credentials check:', {
      hasCloudName: !!CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!CLOUDINARY_API_KEY,
      hasApiSecret: !!CLOUDINARY_API_SECRET
    });
    
    // Check if Cloudinary credentials are available
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      console.log('❌ Cloudinary credentials not configured');
      res.status(500).json({
        success: false,
        error: 'Cloudinary credentials not configured'
      });
      return;
    }

    const { type = 'count' } = req.query;
    const dateRanges = getDateRanges();

    if (type === 'count') {
      // Get counts for different time periods
      const [totalAssets, todayAssets, last7DaysAssets, last30DaysAssets] = await Promise.all([
        fetchCloudinaryAssets({ maxResults: 500 }), // Get total count
        fetchCloudinaryAssets({ 
          maxResults: 500,
          startDate: dateRanges.today 
        }),
        fetchCloudinaryAssets({ 
          maxResults: 500,
          startDate: dateRanges.last7Days 
        }),
        fetchCloudinaryAssets({ 
          maxResults: 500,
          startDate: dateRanges.last30Days 
        })
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalCards: totalAssets.resources?.length || 0,
          cardsToday: todayAssets.resources?.length || 0,
          cardsLast7Days: last7DaysAssets.resources?.length || 0,
          cardsLast30Days: last30DaysAssets.resources?.length || 0,
          hasMore: totalAssets.next_cursor ? true : false,
          nextCursor: totalAssets.next_cursor || null
        }
      });

    } else if (type === 'list') {
      // Get detailed list of assets
      const { 
        maxResults = 50, 
        nextCursor, 
        prefix = 'generated-cards/',
        tags = [],
        startDate,
        endDate
      } = req.query;

      const assets = await fetchCloudinaryAssets({
        maxResults: parseInt(maxResults as string),
        nextCursor: nextCursor as string,
        prefix: prefix as string,
        tags: Array.isArray(tags) ? tags : [tags as string],
        startDate: startDate as string,
        endDate: endDate as string
      });

      // Transform assets to include useful metadata
      const transformedAssets = assets.resources?.map((asset: any) => ({
        id: asset.public_id,
        url: asset.secure_url,
        width: asset.width,
        height: asset.height,
        format: asset.format,
        size: asset.bytes,
        createdAt: asset.created_at,
        tags: asset.tags || [],
        folder: asset.folder,
        filename: asset.public_id.split('/').pop(),
        // Extract metadata if available
        dishName: asset.context?.custom?.dishName || 'Unknown',
        background: asset.context?.custom?.background || 'default',
        greeting: asset.context?.custom?.greeting || ''
      })) || [];

      res.status(200).json({
        success: true,
        data: {
          assets: transformedAssets,
          hasMore: assets.next_cursor ? true : false,
          nextCursor: assets.next_cursor || null,
          totalCount: assets.resources?.length || 0
        }
      });

    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid type parameter. Use "count" or "list"'
      });
    }

  } catch (error) {
    console.error('Error fetching Cloudinary assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets from Cloudinary',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
