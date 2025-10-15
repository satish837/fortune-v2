import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from "crypto";

const DEFAULT_FOLDER = "diwali-postcards/videos";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) {
      return res.status(500).json({ error: 'Cloudinary cloud name not configured' });
    }

    if (req.method === 'GET') {
      // Return cloudinary config
      return res.status(200).json({
        cloudName,
        uploadPreset: uploadPreset || 'ml_default',
        apiKey,
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret
      });
    }

    if (req.method === 'POST') {
      // Generate signature
      if (!apiKey || !apiSecret) {
        return res.status(500).json({ error: "Cloudinary configuration missing" });
      }

      const rawBody = req.body;
      const parsedBody =
        typeof rawBody === "string" && rawBody.trim()
          ? JSON.parse(rawBody)
          : (rawBody ?? {});

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

      const signature = crypto.createHash("sha1").update(toSign).digest("hex");

      return res.status(200).json({
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
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in cloudinary handler:', error);
    res.status(500).json({ error: 'Failed to process cloudinary request' });
  }
}
