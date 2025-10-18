import type { RequestHandler } from "express";

// Store distribution settings in memory (in production, use a database)
let distributionSettings = {
  totalAssets: 5596,
  todayPercent: 0.02,    // 2%
  weekPercent: 0.15,     // 15%
  monthPercent: 0.40     // 40%
};

export const handleUpdateDistribution: RequestHandler = async (req, res) => {
  try {
    console.log('🔄 Update Distribution API called');
    
    const { 
      totalAssets,
      todayPercent,
      weekPercent,
      monthPercent
    } = req.body;
    
    // Update settings if provided
    if (totalAssets !== undefined) distributionSettings.totalAssets = totalAssets;
    if (todayPercent !== undefined) distributionSettings.todayPercent = todayPercent;
    if (weekPercent !== undefined) distributionSettings.weekPercent = weekPercent;
    if (monthPercent !== undefined) distributionSettings.monthPercent = monthPercent;
    
    // Calculate counts
    const todayCount = Math.floor(distributionSettings.totalAssets * distributionSettings.todayPercent);
    const last7DaysCount = Math.floor(distributionSettings.totalAssets * distributionSettings.weekPercent);
    const last30DaysCount = Math.floor(distributionSettings.totalAssets * distributionSettings.monthPercent);
    
    const responseData = {
      success: true,
      message: 'Distribution updated successfully',
      data: {
        totalCards: distributionSettings.totalAssets,
        cardsToday: todayCount,
        cardsLast7Days: last7DaysCount,
        cardsLast30Days: last30DaysCount,
        source: 'cloudinary_manual_count',
        folder: 'diwali-postcards/background-removed/',
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dsol5tcu0',
        distribution: {
          today: `${(distributionSettings.todayPercent * 100).toFixed(1)}%`,
          last7Days: `${(distributionSettings.weekPercent * 100).toFixed(1)}%`,
          last30Days: `${(distributionSettings.monthPercent * 100).toFixed(1)}%`
        }
      },
      settings: distributionSettings,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('✅ Distribution updated:', responseData.data);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error updating distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update distribution',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

export const handleGetDistribution: RequestHandler = async (req, res) => {
  try {
    const todayCount = Math.floor(distributionSettings.totalAssets * distributionSettings.todayPercent);
    const last7DaysCount = Math.floor(distributionSettings.totalAssets * distributionSettings.weekPercent);
    const last30DaysCount = Math.floor(distributionSettings.totalAssets * distributionSettings.monthPercent);
    
    res.status(200).json({
      success: true,
      data: {
        totalCards: distributionSettings.totalAssets,
        cardsToday: todayCount,
        cardsLast7Days: last7DaysCount,
        cardsLast30Days: last30DaysCount,
        source: 'cloudinary_manual_count',
        folder: 'diwali-postcards/background-removed/',
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dsol5tcu0',
        distribution: {
          today: `${(distributionSettings.todayPercent * 100).toFixed(1)}%`,
          last7Days: `${(distributionSettings.weekPercent * 100).toFixed(1)}%`,
          last30Days: `${(distributionSettings.monthPercent * 100).toFixed(1)}%`
        }
      },
      settings: distributionSettings,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get distribution',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};
