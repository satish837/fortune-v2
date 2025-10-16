import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from "crypto";

const DEFAULT_FOLDER = "diwali-postcards/videos";

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

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

    console.log('Cloudinary API called:', {
      method: req.method,
      hasCloudName: !!cloudName,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      hasUploadPreset: !!uploadPreset
    });

    if (!cloudName) {
      console.error('Cloudinary cloud name not configured');
      return res.status(500).json({ error: 'Cloudinary cloud name not configured' });
    }

    if (req.method === 'GET') {
      // Return cloudinary config
      return res.status(200).json({
        cloudName,
        uploadPreset: uploadPreset || 'ml_default',
        apiKey,
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        status: 'ok'
      });
    }

    if (req.method === 'POST') {
      // Generate signature
      if (!apiKey || !apiSecret) {
        console.error('Cloudinary configuration missing:', {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret
        });
        return res.status(500).json({ error: "Cloudinary configuration missing" });
      }

      // Handle different body formats
      let parsedBody = {};
      
      if (req.body) {
        if (typeof req.body === 'string') {
          try {
            parsedBody = JSON.parse(req.body);
          } catch (e) {
            console.error('Failed to parse JSON body:', e);
            parsedBody = {};
          }
        } else if (typeof req.body === 'object') {
          parsedBody = req.body;
        }
      }
      
      console.log('Raw request body:', req.body);
      console.log('Parsed request body:', parsedBody);

      const {
        folder = DEFAULT_FOLDER,
        publicId,
        resourceType = "video",
        eager,
        transformation,
      } = parsedBody;

      const timestamp = Math.round(Date.now() / 1000);

      const params: Record<string, string | number> = {
        timestamp,
      };

      if (folder) {
        params.folder = folder;
      }

      if (publicId) {
        params.public_id = publicId;
      }

      if (typeof eager === "string" && eager.trim()) {
        params.eager = eager.trim();
      }

      if (typeof transformation === "string" && transformation.trim()) {
        params.transformation = transformation.trim();
      }

      if (resourceType) {
        params.resource_type = resourceType;
      }

      const signatureBase = Object.keys(params)
        .filter((key) => key !== "resource_type")
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join("&");

      const toSign = signatureBase ? `${signatureBase}${apiSecret}` : apiSecret;
      
      console.log('Signature generation:', {
        params,
        signatureBase,
        toSign: toSign.substring(0, 50) + '...' // Don't log the full secret
      });

      const signature = crypto.createHash("sha1").update(toSign).digest("hex");
      
      console.log('Generated signature:', signature);

      const response = {
        cloudName,
        apiKey,
        timestamp,
        signature,
        folder,
        publicId: publicId ?? null,
        resourceType,
        eager: typeof eager === "string" ? eager.trim() : null,
        transformation:
          typeof transformation === "string" ? transformation.trim() : null,
      };

      console.log('Returning response:', response);

      return res.status(200).json(response);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in cloudinary handler:', error);
    res.status(500).json({ error: 'Failed to process cloudinary request' });
  }
}
