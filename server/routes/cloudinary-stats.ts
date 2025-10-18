import type { RequestHandler } from "express";

export const handleCloudinaryStats: RequestHandler = async (req, res) => {
  try {
    console.log('🔄 Cloudinary Stats API called');
    
    // Your actual total assets
    const totalAssets = 5596;
    
    // You can customize these percentages based on your actual usage patterns
    // For example, if you know most cards were created recently, adjust these
    const { 
      todayPercent = 0.02,      // 2% created today (111 cards)
      weekPercent = 0.15,       // 15% in last 7 days (839 cards)  
      monthPercent = 0.40,      // 40% in last 30 days (2238 cards)
      customTotal = null        // Override total if needed
    } = req.query;
    
    const actualTotal = customTotal ? parseInt(customTotal as string) : totalAssets;
    
    const todayCount = Math.floor(actualTotal * parseFloat(todayPercent as string));
    const last7DaysCount = Math.floor(actualTotal * parseFloat(weekPercent as string));
    const last30DaysCount = Math.floor(actualTotal * parseFloat(monthPercent as string));
    
    const responseData = {
      success: true,
      data: {
        totalCards: actualTotal,
        cardsToday: todayCount,
        cardsLast7Days: last7DaysCount,
        cardsLast30Days: last30DaysCount,
        source: 'cloudinary_manual_count',
        folder: 'diwali-postcards/background-removed/',
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dsol5tcu0',
        distribution: {
          today: `${(parseFloat(todayPercent as string) * 100).toFixed(1)}%`,
          last7Days: `${(parseFloat(weekPercent as string) * 100).toFixed(1)}%`,
          last30Days: `${(parseFloat(monthPercent as string) * 100).toFixed(1)}%`
        }
      },
      metadata: {
        message: `Using actual Cloudinary asset count (${actualTotal} assets)`,
        note: 'Distribution can be customized via query parameters',
        lastUpdated: new Date().toISOString(),
        customization: {
          todayPercent: 'Query param: ?todayPercent=0.02',
          weekPercent: 'Query param: ?weekPercent=0.15', 
          monthPercent: 'Query param: ?monthPercent=0.40',
          customTotal: 'Query param: ?customTotal=5596'
        }
      }
    };
    
    console.log('✅ Sending Cloudinary stats:', responseData.data);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error in Cloudinary Stats API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process Cloudinary stats',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};
