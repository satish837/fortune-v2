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

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('🔄 Test Data API called');
    
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📡 Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/diwali-postcard');
      console.log('✅ Connected to MongoDB');
    }

    // Clear existing test data
    await GeneratedCard.deleteMany({ dishName: { $regex: /^Test/ } });
    console.log('🗑️ Cleared existing test data');

    // Create test data with different dates
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const testCards = [
      // Today's cards
      {
        imageUrl: 'https://example.com/test-card-1.jpg',
        dishName: 'Test Samosa',
        background: 'diwali',
        greeting: 'Happy Diwali!',
        createdAt: today
      },
      {
        imageUrl: 'https://example.com/test-card-2.jpg',
        dishName: 'Test Karanji',
        background: 'festival',
        greeting: 'Wishing you joy!',
        createdAt: today
      },
      // Yesterday's cards
      {
        imageUrl: 'https://example.com/test-card-3.jpg',
        dishName: 'Test Mysore Pak',
        background: 'celebration',
        greeting: 'Festive greetings!',
        createdAt: yesterday
      },
      // Last week's cards
      {
        imageUrl: 'https://example.com/test-card-4.jpg',
        dishName: 'Test Payasam',
        background: 'traditional',
        greeting: 'Sweet celebrations!',
        createdAt: lastWeek
      },
      {
        imageUrl: 'https://example.com/test-card-5.jpg',
        dishName: 'Test Churma Ladoo',
        background: 'golden',
        greeting: 'Golden moments!',
        createdAt: lastWeek
      },
      // Last month's cards
      {
        imageUrl: 'https://example.com/test-card-6.jpg',
        dishName: 'Test Malpua',
        background: 'vintage',
        greeting: 'Traditional taste!',
        createdAt: lastMonth
      }
    ];

    // Insert test data
    const insertedCards = await GeneratedCard.insertMany(testCards);
    console.log(`✅ Inserted ${insertedCards.length} test cards`);

    // Get counts to verify
    const totalCards = await GeneratedCard.countDocuments();
    const cardsToday = await GeneratedCard.countDocuments({
      createdAt: { $gte: today }
    });
    const cardsLast7Days = await GeneratedCard.countDocuments({
      createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
    });
    const cardsLast30Days = await GeneratedCard.countDocuments({
      createdAt: { $gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.status(200).json({
      success: true,
      message: 'Test data created successfully',
      data: {
        inserted: insertedCards.length,
        counts: {
          totalCards,
          cardsToday,
          cardsLast7Days,
          cardsLast30Days
        }
      }
    });

  } catch (error) {
    console.error('Error creating test data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test data',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
