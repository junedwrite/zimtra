'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Wand2, Image, RotateCcw, Eye, Heart, MessageCircle, Video, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import GenerateTitlesModal from '@/components/GenerateTitlesModal';
import { GenerateThumbnailModal } from '@/components/GenerateThumbnailModal';

interface BaserowField {
  id: number;
  name: string;
  type: string;
  primary?: boolean;
}

interface ThumbnailData {
  url?: string;
  visible_name?: string;
  thumbnails?: {
    small?: { url: string };
  };
}

interface BaserowRow {
  id: number;
  order: string;
  Title?: string;
  URL?: string;
  Views?: number;
  Likes?: number;
  Comments?: number;
  thumbnail?: ThumbnailData[];
  [key: string]: string | number | boolean | ThumbnailData[] | undefined;
}

interface BaserowResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BaserowRow[];
}

export default function VideosPage() {
  const router = useRouter();
  const [fields, setFields] = useState<BaserowField[]>([]);
  const [rows, setRows] = useState<BaserowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingRows, setDeletingRows] = useState<Set<number>>(new Set());
  const [clearingAll, setClearingAll] = useState(false);
  const [generatingTitles, setGeneratingTitles] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [showTitlesModal, setShowTitlesModal] = useState(false);
  const [showThumbnailModal, setShowThumbnailModal] = useState(false);
  const [selectedRowForThumbnail, setSelectedRowForThumbnail] = useState<BaserowRow | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiToken = process.env.NEXT_PUBLIC_BASEROW_API_TOKEN || '3LkXO0VqmHpAU4IqsobhD3DWcUhonMQO';
        const apiUrl = process.env.NEXT_PUBLIC_BASEROW_API_URL || 'https://baserow.zimtra.cloud';
        const tableId = process.env.NEXT_PUBLIC_BASEROW_TABLE_ID || '584';

        // Fetch table fields (columns)
        const fieldsResponse = await fetch(`${apiUrl}/api/database/fields/table/${tableId}/`, {
          headers: {
            'Authorization': `Token ${apiToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!fieldsResponse.ok) {
          throw new Error(`Failed to fetch fields: ${fieldsResponse.status} ${fieldsResponse.statusText}`);
        }

        const fieldsData = await fieldsResponse.json();
        setFields(fieldsData);

        // Fetch table rows
        const rowsResponse = await fetch(`${apiUrl}/api/database/rows/table/${tableId}/?user_field_names=true`, {
          headers: {
            'Authorization': `Token ${apiToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!rowsResponse.ok) {
          throw new Error(`Failed to fetch rows: ${rowsResponse.status} ${rowsResponse.statusText}`);
        }

        const rowsData: BaserowResponse = await rowsResponse.json();
        setRows(rowsData.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // TODO List Implementation:
   // 1. ✅ Add 4 action buttons above table
   // 2. ✅ "Add More Results" - redirect to search page
   // 3. ✅ "Generate Titles" - webhook integration with data payload
   // 4. ✅ "Generate Thumbnail Assets" - webhook integration with data payload
   // 5. ✅ "Clear Results" - delete all rows and redirect
   // 6. ✅ Add delete button for each row
   // 7. ✅ Implement Baserow API delete functionality
   // 8. ✅ Add environment variables for webhook URLs
   // 9. ✅ Implement loading states for generation buttons
   // 10. ✅ Add data validation and error handling

  const handleAddMoreResults = () => {
    router.push('/');
  };

  const handleGenerateTitles = () => {
    if (rows.length === 0) {
      toast.error('No data available to generate titles for.');
      return;
    }
    setShowTitlesModal(true);
  };

  const handleThumbnailClick = (row: BaserowRow) => {
    console.log('🖱️ Thumbnail clicked!', {
      rowId: row.id,
      rowData: row,
      timestamp: new Date().toISOString()
    });
    
    setSelectedRowForThumbnail(row);
    console.log('📝 Set selectedRowForThumbnail:', row);
    
    setShowThumbnailModal(true);
    console.log('🔓 Set showThumbnailModal to true');
    
    console.log('📊 Current state after click:', {
      showThumbnailModal: true,
      selectedRowForThumbnail: row,
      shouldModalOpen: true && row !== null
    });
  };

  const handleClearResults = async () => {
    if (!confirm('Are you sure you want to delete all results? This action cannot be undone.')) {
      return;
    }

    setClearingAll(true);
    try {
      const apiToken = process.env.NEXT_PUBLIC_BASEROW_API_TOKEN || '3LkXO0VqmHpAU4IqsobhD3DWcUhonMQO';
      const apiUrl = process.env.NEXT_PUBLIC_BASEROW_API_URL || 'https://baserow.zimtra.cloud';
      const tableId = process.env.NEXT_PUBLIC_BASEROW_TABLE_ID || '584';

      // Delete all rows one by one
      const deletePromises = rows.map(row => 
        fetch(`${apiUrl}/api/database/rows/table/${tableId}/${row.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${apiToken}`,
            'Content-Type': 'application/json',
          },
        })
      );

      await Promise.all(deletePromises);
      toast.success('All results cleared successfully!');
      router.push('/');
    } catch (error) {
      console.error('Error clearing results:', error);
      toast.error('Failed to clear results. Please try again.');
    } finally {
      setClearingAll(false);
    }
  };

  const handleDeleteRow = async (rowId: number) => {
    if (!confirm('Are you sure you want to delete this row?')) {
      return;
    }

    setDeletingRows(prev => new Set(prev).add(rowId));
    try {
      const apiToken = process.env.NEXT_PUBLIC_BASEROW_API_TOKEN || '3LkXO0VqmHpAU4IqsobhD3DWcUhonMQO';
      const apiUrl = process.env.NEXT_PUBLIC_BASEROW_API_URL || 'https://baserow.zimtra.cloud';
      const tableId = process.env.NEXT_PUBLIC_BASEROW_TABLE_ID || '584';

      const response = await fetch(`${apiUrl}/api/database/rows/table/${tableId}/${rowId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete row: ${response.status} ${response.statusText}`);
      }

      // Remove the row from local state
      setRows(prev => prev.filter(row => row.id !== rowId));
      toast.success('Row deleted successfully!');
    } catch (error) {
      console.error('Error deleting row:', error);
      toast.error('Failed to delete row. Please try again.');
    } finally {
      setDeletingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(rowId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />
        <div className="container mx-auto p-6">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading YouTube Analytics Data</h3>
                  <p className="text-gray-600">Fetching your video data from Baserow...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Header />
        <div className="container mx-auto p-6">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Connection Error
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium mb-2">Failed to load data:</p>
                  <p className="text-red-700">{error}</p>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Debug Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">API URL:</p>
                      <p className="text-gray-600 break-all">{process.env.NEXT_PUBLIC_BASEROW_API_URL || 'https://baserow.zimtra.cloud'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Table ID:</p>
                      <p className="text-gray-600">{process.env.NEXT_PUBLIC_BASEROW_TABLE_ID || '584'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Token Status:</p>
                      <p className="text-gray-600">{process.env.NEXT_PUBLIC_BASEROW_API_TOKEN ? 'Configured' : 'Using fallback'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry Connection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalVideos = rows.length;
  const totalViews = rows.reduce((sum, row) => sum + (Number(row.Views) || 0), 0);
  const totalLikes = rows.reduce((sum, row) => sum + (Number(row.Likes) || 0), 0);
  const totalComments = rows.reduce((sum, row) => sum + (Number(row.Comments) || 0), 0);

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      <div className="container mx-auto p-6">
        {/* Dashboard Summary Cards */}
        {rows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Videos</p>
                    <p className="text-3xl font-bold">{totalVideos}</p>
                  </div>
                  <Video className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Views</p>
                    <p className="text-3xl font-bold">{formatNumber(totalViews)}</p>
                  </div>
                  <Eye className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Total Likes</p>
                    <p className="text-3xl font-bold">{formatNumber(totalLikes)}</p>
                  </div>
                  <Heart className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Comments</p>
                    <p className="text-3xl font-bold">{formatNumber(totalComments)}</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                YouTube Analytics Data
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Found {fields.length} columns and {rows.length} rows
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button 
                onClick={handleAddMoreResults}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                Add More Results
              </Button>
              <Button 
                 onClick={handleGenerateTitles}
                 variant="outline"
                 size="sm"
                 className="flex items-center gap-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-all duration-200"
                 disabled={rows.length === 0}
               >
                 <Wand2 className="h-4 w-4" />
                 Generate Titles
               </Button>

              <Button 
                onClick={handleClearResults}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 transition-all duration-200"
                disabled={clearingAll || rows.length === 0}
              >
                {clearingAll ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Clear Results
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length > 0 && rows.length > 0 ? (
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full border-collapse bg-white rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                    {fields.map((field) => (
                      <th
                        key={field.id}
                        className="px-6 py-4 text-left font-semibold text-gray-700 border-b border-gray-200"
                      >
                        <div className="flex items-center gap-2">
                          {field.name === 'Views' && <Eye className="h-4 w-4 text-green-600" />}
                          {field.name === 'Likes' && <Heart className="h-4 w-4 text-red-600" />}
                          {field.name === 'Comments' && <MessageCircle className="h-4 w-4 text-purple-600" />}
                          {field.name === 'URL' && <Video className="h-4 w-4 text-blue-600" />}
                          <span>{field.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 font-normal">({field.type})</span>
                      </th>
                    ))}
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 border-b border-gray-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0">
                      {fields.map((field) => {
                        const value = row[field.name];
                        
                        // Handle thumbnail field specially
                        if (field.name === 'thumbnail' && Array.isArray(value) && value.length > 0) {
                          const thumbnail = value[0] as {
                            thumbnails?: {
                              small?: { url: string };
                            };
                            url?: string;
                            visible_name?: string;
                          };
                          return (
                            <td key={`${row.id}-${field.id}`} className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="relative group">
                                  <img 
                                    src={thumbnail.url || thumbnail.thumbnails?.small?.url} 
                                    alt={thumbnail.visible_name}
                                    className="w-16 h-16 object-cover rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-blue-400"
                                    onClick={() => {
                                      console.log('🖼️ Thumbnail image clicked!', {
                                        fieldName: field.name,
                                        thumbnailUrl: thumbnail.url || thumbnail.thumbnails?.small?.url,
                                        rowId: row.id,
                                        hasClickHandler: typeof handleThumbnailClick === 'function'
                                      });
                                      handleThumbnailClick(row);
                                    }}
                                    onMouseEnter={() => console.log('🖱️ Mouse entered thumbnail')}
                                    onMouseLeave={() => console.log('🖱️ Mouse left thumbnail')}
                                    title="Click to generate new thumbnail"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-300 flex items-center justify-center">
                                    <Wand2 className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  </div>
                                </div>
                                <span className="text-sm text-gray-600 font-medium">{thumbnail.visible_name}</span>
                              </div>
                            </td>
                          );
                        }
                        
                        // Handle URL field specially
                        if (field.name === 'URL' && value && typeof value === 'string') {
                          return (
                            <td key={`${row.id}-${field.id}`} className="px-6 py-4">
                              <Button
                                onClick={() => window.open(value, '_blank')}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View Video
                              </Button>
                            </td>
                          );
                        }
                        
                        // Handle order field as badge
                        if (field.name === 'order' && value) {
                          return (
                            <td key={`${row.id}-${field.id}`} className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                #{String(value)}
                              </span>
                            </td>
                          );
                        }
                        
                        // Handle Title field with better formatting
                        if (field.name === 'Title' && value) {
                          return (
                            <td key={`${row.id}-${field.id}`} className="px-6 py-4">
                              <div className="max-w-xs">
                                <p className="text-sm font-medium text-gray-900 truncate" title={String(value)}>
                                  {String(value)}
                                </p>
                              </div>
                            </td>
                          );
                        }
                        
                        // Handle numeric fields with formatting
                        if ((field.name === 'Views' || field.name === 'Likes' || field.name === 'Comments') && value) {
                          return (
                            <td key={`${row.id}-${field.id}`} className="px-6 py-4">
                              <span className="text-sm font-semibold text-gray-900">
                                {formatNumber(Number(value))}
                              </span>
                            </td>
                          );
                        }
                        
                        // Handle array fields
                        if (Array.isArray(value)) {
                          return (
                            <td key={`${row.id}-${field.id}`} className="px-6 py-4">
                              <span className="text-sm text-gray-500">
                                {value.length > 0 ? `[${value.length} items]` : '-'}
                              </span>
                            </td>
                          );
                        }
                        
                        // Handle regular fields
                        return (
                          <td key={`${row.id}-${field.id}`} className="px-6 py-4">
                            <span className="text-sm text-gray-900">
                              {value !== null && value !== undefined && value !== ''
                                ? String(value)
                                : '-'}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => handleDeleteRow(row.id)}
                          variant="destructive"
                          size="sm"
                          disabled={deletingRows.has(row.id)}
                          className="flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 transition-all duration-200"
                        >
                          {deletingRows.has(row.id) ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-gray-100 rounded-full p-6">
                  <Video className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Videos Found</h3>
                  <p className="text-gray-600 mb-4">Start by adding some video data to your analytics dashboard.</p>
                  <Button 
                    onClick={handleAddMoreResults}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Videos
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
      
      <GenerateTitlesModal
        isOpen={showTitlesModal}
        onClose={() => setShowTitlesModal(false)}
        tableData={rows}
      />
      
      <GenerateThumbnailModal
          isOpen={(() => {
            const isOpen = showThumbnailModal && selectedRowForThumbnail !== null;
            console.log('🎭 Modal render state:', {
              showThumbnailModal,
              selectedRowForThumbnail: selectedRowForThumbnail?.id || null,
              isOpen,
              timestamp: new Date().toISOString()
            });
            return isOpen;
          })()}
          onClose={() => {
            console.log('❌ Modal close triggered');
            setShowThumbnailModal(false);
            setSelectedRowForThumbnail(null);
          }}
          rowData={selectedRowForThumbnail || {} as BaserowRow}
        />
    </div>
  );
}