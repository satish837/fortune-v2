import type { RequestHandler } from "express";
import connectDB from "../database/connection";
import GeneratedCard from "../models/GeneratedCard";

export const handleGeneratedCardsCount: RequestHandler = async (req, res) => {
  try {
    console.log('🔄 Generated Cards Count API called');
    
    await connectDB();
    console.log('✅ Connected to MongoDB');

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
};
