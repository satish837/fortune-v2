import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Cloudinary Search API configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_SEARCH_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/search`;

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

// Search assets in Cloudinary with advanced filtering
async function searchCloudinaryAssets(options: {
  expression?: string;
  maxResults?: number;
  nextCursor?: string;
  sortBy?: Array<{ [key: string]: string }>;
  withField?: string[];
  context?: boolean;
  tags?: boolean;
}) {
  const {
    expression = 'resource_type:image',
    maxResults = 100,
    nextCursor,
    sortBy = [{ created_at: 'desc' }],
    withField = ['context', 'tags'],
    context = true,
    tags = true
  } = options;

  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  
  const params: Record<string, any> = {
    expression,
    max_results: maxResults,
    sort_by: JSON.stringify(sortBy),
    with_field: withField.join(','),
    context: context.toString(),
    tags: tags.toString(),
    timestamp: timestamp
  };

  if (nextCursor) {
    params.next_cursor = nextCursor;
  }

  const signature = generateSignature(params, CLOUDINARY_API_SECRET!);
  
  const queryParams = new URLSearchParams({
    ...params,
    signature,
    api_key: CLOUDINARY_API_KEY!
  });

  const response = await fetch(`${CLOUDINARY_SEARCH_API_URL}?${queryParams}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary Search API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Build search expression for different filters
function buildSearchExpression(filters: {
  prefix?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  dishName?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  format?: string;
}) {
  const expressions = ['resource_type:image'];
  
  if (filters.prefix) {
    expressions.push(`public_id:${filters.prefix}*`);
  }
  
  if (filters.tags && filters.tags.length > 0) {
    const tagExpression = filters.tags.map(tag => `tags:${tag}`).join(' AND ');
    expressions.push(`(${tagExpression})`);
  }
  
  if (filters.startDate) {
    expressions.push(`created_at>=${filters.startDate}`);
  }
  
  if (filters.endDate) {
    expressions.push(`created_at<=${filters.endDate}`);
  }
  
  if (filters.dishName) {
    expressions.push(`context.custom.dishName:${filters.dishName}`);
  }
  
  if (filters.background) {
    expressions.push(`context.custom.background:${filters.background}`);
  }
  
  if (filters.minSize) {
    expressions.push(`bytes>=${filters.minSize}`);
  }
  
  if (filters.maxSize) {
    expressions.push(`bytes<=${filters.maxSize}`);
  }
  
  if (filters.format) {
    expressions.push(`format:${filters.format}`);
  }
  
  return expressions.join(' AND ');
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
    // Check if Cloudinary credentials are available
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      res.status(500).json({
        success: false,
        error: 'Cloudinary credentials not configured'
      });
      return;
    }

    const { 
      type = 'search',
      prefix = 'generated-cards/',
      tags,
      dishName,
      background,
      startDate,
      endDate,
      format,
      minSize,
      maxSize,
      maxResults = 50,
      nextCursor,
      sortBy = 'created_at:desc'
    } = req.query;

    // Build search expression
    const searchExpression = buildSearchExpression({
      prefix: prefix as string,
      tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      dishName: dishName as string,
      background: background as string,
      minSize: minSize ? parseInt(minSize as string) : undefined,
      maxSize: maxSize ? parseInt(maxSize as string) : undefined,
      format: format as string
    });

    // Parse sortBy parameter
    const sortByArray = sortBy 
      ? [{ [sortBy.toString().split(':')[0]]: sortBy.toString().split(':')[1] || 'desc' }]
      : [{ created_at: 'desc' }];

    // Search assets
    const searchResults = await searchCloudinaryAssets({
      expression: searchExpression,
      maxResults: parseInt(maxResults as string),
      nextCursor: nextCursor as string,
      sortBy: sortByArray,
      withField: ['context', 'tags', 'image_metadata'],
      context: true,
      tags: true
    });

    // Transform results
    const transformedAssets = searchResults.resources?.map((asset: any) => ({
      id: asset.public_id,
      url: asset.secure_url,
      width: asset.width,
      height: asset.height,
      format: asset.format,
      size: asset.bytes,
      createdAt: asset.created_at,
      uploadedAt: asset.uploaded_at,
      tags: asset.tags || [],
      folder: asset.folder,
      filename: asset.public_id.split('/').pop(),
      // Extract custom context metadata
      dishName: asset.context?.custom?.dishName || 'Unknown',
      background: asset.context?.custom?.background || 'default',
      greeting: asset.context?.custom?.greeting || '',
      userId: asset.context?.custom?.userId || null,
      userEmail: asset.context?.custom?.userEmail || null,
      // Image metadata
      colors: asset.colors || [],
      faces: asset.faces || [],
      qualityScore: asset.quality_score || null,
      // Additional metadata
      version: asset.version,
      signature: asset.signature,
      type: asset.type,
      resourceType: asset.resource_type
    })) || [];

    // Calculate statistics
    const stats = {
      totalFound: searchResults.total_count || transformedAssets.length,
      returned: transformedAssets.length,
      hasMore: !!searchResults.next_cursor,
      nextCursor: searchResults.next_cursor || null
    };

    // Group by different criteria for analytics
    const analytics = {
      byDish: transformedAssets.reduce((acc: any, asset: any) => {
        const dish = asset.dishName;
        acc[dish] = (acc[dish] || 0) + 1;
        return acc;
      }, {}),
      byBackground: transformedAssets.reduce((acc: any, asset: any) => {
        const bg = asset.background;
        acc[bg] = (acc[bg] || 0) + 1;
        return acc;
      }, {}),
      byFormat: transformedAssets.reduce((acc: any, asset: any) => {
        const fmt = asset.format;
        acc[fmt] = (acc[fmt] || 0) + 1;
        return acc;
      }, {}),
      byDate: transformedAssets.reduce((acc: any, asset: any) => {
        const date = new Date(asset.createdAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      data: {
        assets: transformedAssets,
        stats,
        analytics,
        searchExpression
      }
    });

  } catch (error) {
    console.error('Error searching Cloudinary assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search assets in Cloudinary',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
