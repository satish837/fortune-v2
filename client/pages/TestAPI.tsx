import { useState, useEffect } from "react";

export default function TestAPI() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Testing API call...');
        const response = await fetch('/api/cloudinary-live');
        const result = await response.json();
        
        console.log('📡 API Response:', result);
        
        if (response.ok && result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'API call failed');
        }
      } catch (err) {
        console.error('❌ API Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-orange-600">Loading API test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">API Error</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-orange-900 mb-8">API Test Results</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-orange-700 mb-4">Cloudinary Data</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">{data?.totalCards || 0}</div>
              <div className="text-sm text-orange-600">Total Cards</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">{data?.cardsToday || 0}</div>
              <div className="text-sm text-orange-600">Cards Today</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">{data?.cardsLast7Days || 0}</div>
              <div className="text-sm text-orange-600">Last 7 Days</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">{data?.cardsLast30Days || 0}</div>
              <div className="text-sm text-orange-600">Last 30 Days</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-orange-700 mb-4">API Details</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Source:</strong> {data?.source || 'Unknown'}</p>
            <p><strong>Folder:</strong> {data?.folder || 'Unknown'}</p>
            <p><strong>Cloud Name:</strong> {data?.cloudName || 'Unknown'}</p>
            <p><strong>Note:</strong> {data?.note || 'No note'}</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/dashboard" 
            className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
