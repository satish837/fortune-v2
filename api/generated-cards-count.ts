import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

// Import the GeneratedCard model
const GeneratedCardSchema = new mongoose.Schema({
  userId: { type: String, required: false, trim: true },
  userEmail: { type: String, required: false, trim: true, lowercase: true },
  imageUrl: { type: String, required: true, trim: true },
  dishName: { type: String, required: false, trim: true },
  background: { type: String, required: false, trim: true },
  greeting: { type: String, required: false, trim: true, maxlength: [500, 'Greeting cannot exceed 500 characters'] }
}, { timestamps: true });

const GeneratedCard = mongoose.models.GeneratedCard || mongoose.model('GeneratedCard', GeneratedCardSchema);

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
    console.log('🔄 Generated Cards Count API called');
    
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📡 Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/diwali-postcard');
      console.log('✅ Connected to MongoDB');
    } else {
      console.log('✅ Already connected to MongoDB');
    }

    // Get total count of generated cards
    console.log('📊 Counting generated cards...');
    const totalCards = await GeneratedCard.countDocuments();
    console.log('📊 Total cards:', totalCards);

    // Get count of cards generated today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cardsToday = await GeneratedCard.countDocuments({
      createdAt: { $gte: today }
    });

    // Get count of cards generated in the last 7 days
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const cardsLast7Days = await GeneratedCard.countDocuments({
      createdAt: { $gte: last7Days }
    });

    // Get count of cards generated in the last 30 days
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const cardsLast30Days = await GeneratedCard.countDocuments({
      createdAt: { $gte: last30Days }
    });

    const responseData = {
      success: true,
      data: {
        totalCards,
        cardsToday,
        cardsLast7Days,
        cardsLast30Days
      }
    };
    
    console.log('✅ Sending response:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error fetching generated cards count:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch generated cards count',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
