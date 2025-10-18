import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, RefreshCw, Calendar, Image, Tag, FileText } from "lucide-react";

interface CloudinaryAsset {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
  createdAt: string;
  uploadedAt: string;
  tags: string[];
  folder: string;
  filename: string;
  dishName: string;
  background: string;
  greeting: string;
  userId?: string;
  userEmail?: string;
  colors: string[];
  faces: any[];
  qualityScore?: number;
  version: number;
  signature: string;
  type: string;
  resourceType: string;
}

interface CloudinaryStats {
  totalFound: number;
  returned: number;
  hasMore: boolean;
  nextCursor?: string;
}

interface CloudinaryAnalytics {
  byDish: Record<string, number>;
  byBackground: Record<string, number>;
  byFormat: Record<string, number>;
  byDate: Record<string, number>;
}

export default function CloudinaryAssets() {
  const [assets, setAssets] = useState<CloudinaryAsset[]>([]);
  const [stats, setStats] = useState<CloudinaryStats>({ totalFound: 0, returned: 0, hasMore: false });
  const [analytics, setAnalytics] = useState<CloudinaryAnalytics>({ byDish: {}, byBackground: {}, byFormat: {}, byDate: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    dishName: "",
    background: "",
    format: "",
    startDate: "",
    endDate: "",
    tags: ""
  });
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchAssets = async (cursor?: string | null, reset = false) => {
    try {
      setLoading(true);
      setError("");

      const queryParams = new URLSearchParams({
        type: 'search',
        maxResults: '50',
        ...(cursor && { nextCursor: cursor }),
        ...(filters.dishName && { dishName: filters.dishName }),
        ...(filters.background && { background: filters.background }),
        ...(filters.format && { format: filters.format }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.tags && { tags: filters.tags }),
        ...(searchTerm && { prefix: `generated-cards/${searchTerm}` })
      });

      const response = await fetch(`/api/cloudinary-search?${queryParams}`);
      const data = await response.json();

      if (response.ok && data.success) {
        if (reset || !cursor) {
          setAssets(data.data.assets);
        } else {
          setAssets(prev => [...prev, ...data.data.assets]);
        }
        setStats(data.data.stats);
        setAnalytics(data.data.analytics);
        setNextCursor(data.data.stats.nextCursor);
      } else {
        setError(data.error || 'Failed to fetch assets');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setNextCursor(null);
    fetchAssets(null, true);
  };

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchAssets(nextCursor, false);
    }
  };

  const clearFilters = () => {
    setFilters({
      dishName: "",
      background: "",
      format: "",
      startDate: "",
      endDate: "",
      tags: ""
    });
    setSearchTerm("");
    setNextCursor(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchAssets(null, true);
  }, []);

  if (loading && assets.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-orange-700">Loading assets from Cloudinary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-orange-900 mb-2">Cloudinary Assets</h1>
              <p className="text-orange-700">Browse and manage generated cards from Cloudinary</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => fetchAssets(null, true)}
                variant="outline"
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Total Found</CardTitle>
              <Image className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{stats.totalFound}</div>
              <p className="text-xs text-orange-600">Assets in Cloudinary</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Loaded</CardTitle>
              <FileText className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{stats.returned}</div>
              <p className="text-xs text-orange-600">Currently displayed</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Unique Dishes</CardTitle>
              <Tag className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{Object.keys(analytics.byDish).length}</div>
              <p className="text-xs text-orange-600">Different dishes</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Backgrounds</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{Object.keys(analytics.byBackground).length}</div>
              <p className="text-xs text-orange-600">Different backgrounds</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/80 backdrop-blur border-orange-200 mb-6">
          <CardHeader>
            <CardTitle className="text-orange-900">Search & Filters</CardTitle>
            <CardDescription>Find specific assets in your Cloudinary account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 h-4 w-4" />
                <Input
                  placeholder="Search by filename..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-orange-200 focus:border-orange-400"
                />
              </div>
              
              <Select value={filters.dishName} onValueChange={(value) => setFilters({...filters, dishName: value})}>
                <SelectTrigger className="border-orange-200 focus:border-orange-400">
                  <SelectValue placeholder="Filter by dish" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Dishes</SelectItem>
                  {Object.keys(analytics.byDish).map(dish => (
                    <SelectItem key={dish} value={dish}>{dish} ({analytics.byDish[dish]})</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.background} onValueChange={(value) => setFilters({...filters, background: value})}>
                <SelectTrigger className="border-orange-200 focus:border-orange-400">
                  <SelectValue placeholder="Filter by background" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Backgrounds</SelectItem>
                  {Object.keys(analytics.byBackground).map(bg => (
                    <SelectItem key={bg} value={bg}>{bg} ({analytics.byBackground[bg]})</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.format} onValueChange={(value) => setFilters({...filters, format: value})}>
                <SelectTrigger className="border-orange-200 focus:border-orange-400">
                  <SelectValue placeholder="Filter by format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Formats</SelectItem>
                  {Object.keys(analytics.byFormat).map(format => (
                    <SelectItem key={format} value={format}>{format.toUpperCase()} ({analytics.byFormat[format]})</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="Start date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="border-orange-200 focus:border-orange-400"
              />

              <Input
                type="date"
                placeholder="End date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSearch} className="bg-orange-600 hover:bg-orange-700">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button onClick={clearFilters} variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50">
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-50 border-red-200 mb-6">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Assets Table */}
        <Card className="bg-white/80 backdrop-blur border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-900">
              Assets ({assets.length} of {stats.totalFound})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <div className="text-center py-8">
                <Image className="h-12 w-12 text-orange-300 mx-auto mb-4" />
                <p className="text-orange-600">No assets found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-orange-200">
                      <TableHead className="text-orange-700">Preview</TableHead>
                      <TableHead className="text-orange-700">Filename</TableHead>
                      <TableHead className="text-orange-700">Dish</TableHead>
                      <TableHead className="text-orange-700">Background</TableHead>
                      <TableHead className="text-orange-700">Size</TableHead>
                      <TableHead className="text-orange-700">Format</TableHead>
                      <TableHead className="text-orange-700">Created</TableHead>
                      <TableHead className="text-orange-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.id} className="border-orange-100 hover:bg-orange-50/50">
                        <TableCell>
                          <img 
                            src={asset.url} 
                            alt={asset.filename}
                            className="w-16 h-16 object-cover rounded border border-orange-200"
                            loading="lazy"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-orange-900">
                          {asset.filename}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                            {asset.dishName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-orange-200 text-orange-700">
                            {asset.background}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-orange-700">
                          {formatFileSize(asset.size)}
                        </TableCell>
                        <TableCell className="text-orange-700">
                          {asset.format.toUpperCase()}
                        </TableCell>
                        <TableCell className="text-orange-600 text-sm">
                          {formatDate(asset.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(asset.url, '_blank')}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Load More Button */}
            {stats.hasMore && (
              <div className="mt-6 text-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  variant="outline"
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
