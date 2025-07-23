'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Video, TrendingUp, Users, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

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
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: searchQuery.trim()
        })
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
        <div className="max-w-2xl mx-auto mb-16">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex gap-2">
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
