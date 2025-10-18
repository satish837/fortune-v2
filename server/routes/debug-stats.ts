import type { RequestHandler } from "express";
import mongoose from "mongoose";
import crypto from "crypto";

export const handleDebugStats: RequestHandler = async (req, res) => {
  try {
    console.log('🔄 Debug Stats API called');
    
    // Test MongoDB connection
    let mongoStatus = 'not_connected';
    let mongoError = null;
    let mongoCount = 0;
    
    try {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/diwali-postcard');
      }
      mongoStatus = 'connected';
      
      // Try to count documents
      const GeneratedCard = mongoose.models.GeneratedCard || mongoose.model('GeneratedCard', new mongoose.Schema({
        imageUrl: String,
        dishName: String,
        background: String,
        greeting: String
      }, { timestamps: true }));
      
      mongoCount = await GeneratedCard.countDocuments();
    } catch (err) {
      mongoError = err instanceof Error ? err.message : String(err);
      mongoStatus = 'error';
    }

    // Test Cloudinary connection
    let cloudinaryStatus = 'not_configured';
    let cloudinaryError = null;
    let cloudinaryCount = 0;
    
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (cloudName && apiKey && apiSecret) {
      try {
        const timestamp = Math.round(new Date().getTime() / 1000).toString();
        const params = {
          max_results: 1,
          timestamp: timestamp
        };
        
        const signature = crypto
          .createHash('sha1')
          .update(`max_results=1timestamp=${timestamp}${apiSecret}`)
          .digest('hex');
        
        const queryParams = new URLSearchParams({
          ...params,
          signature,
          api_key: apiKey
        });
        
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image?${queryParams}`);
        
        if (response.ok) {
          const data = await response.json();
          cloudinaryStatus = 'connected';
          cloudinaryCount = data.resources?.length || 0;
        } else {
          cloudinaryStatus = 'error';
          cloudinaryError = `HTTP ${response.status}: ${await response.text()}`;
        }
      } catch (err) {
        cloudinaryError = err instanceof Error ? err.message : String(err);
        cloudinaryStatus = 'error';
      }
    }

    // Environment variables check
    const envCheck = {
      MONGODB_URI: !!process.env.MONGODB_URI,
      CLOUDINARY_CLOUD_NAME: !!cloudName,
      CLOUDINARY_API_KEY: !!apiKey,
      CLOUDINARY_API_SECRET: !!apiSecret,
      NODE_ENV: process.env.NODE_ENV
    };

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      mongodb: {
        status: mongoStatus,
        count: mongoCount,
        error: mongoError
      },
      cloudinary: {
        status: cloudinaryStatus,
        count: cloudinaryCount,
        error: cloudinaryError
      },
      message: 'Debug information collected successfully'
    });

  } catch (error) {
    console.error('Error in debug stats API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to collect debug information',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};
