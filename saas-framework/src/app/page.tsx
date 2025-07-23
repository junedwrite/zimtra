'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Video, TrendingUp, Users, Eye, Loader2, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface AdvancedSearchParams {
  regionCode: string;
  relevanceLanguage: string;
  videoDuration: string;
  publishedAfter: string;
  publishedBefore: string;
  order: string;
  maxResults: number;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedParams, setAdvancedParams] = useState<AdvancedSearchParams>({
    regionCode: 'any',
    relevanceLanguage: 'any',
    videoDuration: 'any',
    publishedAfter: '',
    publishedBefore: '',
    order: 'relevance',
    maxResults: 25
  });
  const router = useRouter();

  const handleAdvancedParamChange = (key: keyof AdvancedSearchParams, value: string | number) => {
    setAdvancedParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    const webhookUrl = process.env.NEXT_PUBLIC_SEARCH_WEBHOOK;
    if (!webhookUrl || webhookUrl === 'your_search_webhook_url_here') {
      toast.error('Search webhook URL not configured');
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Build the request payload with advanced parameters
      const payload: any = {
        q: searchQuery.trim()
      };

      // Add advanced parameters only if they have values
      if (advancedParams.regionCode && advancedParams.regionCode !== 'any') payload.regionCode = advancedParams.regionCode;
      if (advancedParams.relevanceLanguage && advancedParams.relevanceLanguage !== 'any') payload.relevanceLanguage = advancedParams.relevanceLanguage;
      if (advancedParams.videoDuration !== 'any') payload.videoDuration = advancedParams.videoDuration;
      if (advancedParams.publishedAfter) payload.publishedAfter = new Date(advancedParams.publishedAfter).toISOString();
      if (advancedParams.publishedBefore) payload.publishedBefore = new Date(advancedParams.publishedBefore).toISOString();
      if (advancedParams.order !== 'relevance') payload.order = advancedParams.order;
      if (advancedParams.maxResults !== 25) payload.maxResults = advancedParams.maxResults;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        toast.success('Search completed successfully!');
        // Redirect to videos page on success
        router.push('/videos');
      } else {
        toast.error(`Search failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-full shadow-lg">
              <Video className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Video Search
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Search through your video library with powerful filters and instant results
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                {/* Basic Search */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search videos by title, description, or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 text-lg"
                    />
                  </div>
                  <Button 
                     type="submit" 
                     size="lg" 
                     disabled={isSearching || !searchQuery.trim()}
                     className="h-12 px-8"
                   >
                     {isSearching ? (
                       <>
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         Searching...
                       </>
                     ) : (
                       <>
                         <Search className="mr-2 h-4 w-4" />
                         Search
                       </>
                     )}
                   </Button>
                </div>

                {/* Advanced Search Toggle */}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Advanced Search
                    {showAdvanced ? (
                      <ChevronUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Advanced Search Fields */}
                {showAdvanced && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Region Code */}
                      <div className="space-y-2">
                        <Label htmlFor="regionCode" className="text-sm font-medium">Region</Label>
                        <Select value={advancedParams.regionCode} onValueChange={(value) => handleAdvancedParamChange('regionCode', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Any region" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any region</SelectItem>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                            <SelectItem value="DE">Germany</SelectItem>
                            <SelectItem value="FR">France</SelectItem>
                            <SelectItem value="JP">Japan</SelectItem>
                            <SelectItem value="KR">South Korea</SelectItem>
                            <SelectItem value="IN">India</SelectItem>
                            <SelectItem value="BR">Brazil</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Relevance Language */}
                      <div className="space-y-2">
                        <Label htmlFor="relevanceLanguage" className="text-sm font-medium">Language</Label>
                        <Select value={advancedParams.relevanceLanguage} onValueChange={(value) => handleAdvancedParamChange('relevanceLanguage', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Any language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any language</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="it">Italian</SelectItem>
                            <SelectItem value="pt">Portuguese</SelectItem>
                            <SelectItem value="ru">Russian</SelectItem>
                            <SelectItem value="ja">Japanese</SelectItem>
                            <SelectItem value="ko">Korean</SelectItem>
                            <SelectItem value="zh-Hans">Chinese (Simplified)</SelectItem>
                            <SelectItem value="zh-Hant">Chinese (Traditional)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Video Duration */}
                      <div className="space-y-2">
                        <Label htmlFor="videoDuration" className="text-sm font-medium">Duration</Label>
                        <Select value={advancedParams.videoDuration} onValueChange={(value) => handleAdvancedParamChange('videoDuration', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any duration</SelectItem>
                            <SelectItem value="short">Short (&lt; 4 min)</SelectItem>
                            <SelectItem value="medium">Medium (4-20 min)</SelectItem>
                            <SelectItem value="long">Long (&gt; 20 min)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sort Order */}
                      <div className="space-y-2">
                        <Label htmlFor="order" className="text-sm font-medium">Sort by</Label>
                        <Select value={advancedParams.order} onValueChange={(value) => handleAdvancedParamChange('order', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="relevance">Relevance</SelectItem>
                            <SelectItem value="date">Upload date</SelectItem>
                            <SelectItem value="viewCount">View count</SelectItem>
                            <SelectItem value="rating">Rating</SelectItem>
                            <SelectItem value="title">Title</SelectItem>
                            <SelectItem value="videoCount">Video count</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Max Results */}
                      <div className="space-y-2">
                        <Label htmlFor="maxResults" className="text-sm font-medium">Max results</Label>
                        <Select value={advancedParams.maxResults.toString()} onValueChange={(value) => handleAdvancedParamChange('maxResults', parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="publishedAfter" className="text-sm font-medium">Published after</Label>
                        <Input
                          type="date"
                          id="publishedAfter"
                          value={advancedParams.publishedAfter}
                          onChange={(e) => handleAdvancedParamChange('publishedAfter', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="publishedBefore" className="text-sm font-medium">Published before</Label>
                        <Input
                          type="date"
                          id="publishedBefore"
                          value={advancedParams.publishedBefore}
                          onChange={(e) => handleAdvancedParamChange('publishedBefore', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="text-center">
            <CardContent className="p-6">
              <Video className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">2</h3>
              <p className="text-gray-600">Total Videos</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <Eye className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">55</h3>
              <p className="text-gray-600">Total Views</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-6">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">34</h3>
              <p className="text-gray-600">Total Likes</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg" asChild>
              <a href="/videos">
                <Video className="mr-2 h-4 w-4" />
                View All Videos
              </a>
            </Button>
            <Button variant="outline" size="lg">
              <Users className="mr-2 h-4 w-4" />
              Analytics Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
