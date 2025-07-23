'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Wand2, Image, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import GenerateTitlesModal from '@/components/GenerateTitlesModal';

interface BaserowField {
  id: number;
  name: string;
  type: string;
  primary?: boolean;
}

interface BaserowRow {
  id: number;
  order: string;
  [key: string]: any;
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

  const handleGenerateThumbnailAssets = async () => {
    if (rows.length === 0) {
      toast.error('No data available to generate thumbnail assets for.');
      return;
    }

    const webhookUrl = process.env.NEXT_PUBLIC_GENERATE_IMAGES_WEBHOOK;
    if (!webhookUrl || webhookUrl === 'your_generate_images_webhook_url_here') {
      toast.error('Generate Images webhook URL not configured.');
      return;
    }

    setGeneratingImages(true);
    try {
      // Prepare data payload with current table data
      const payload = {
        action: 'generate_thumbnail_assets',
        data: rows.map(row => ({
          id: row.id,
          title: row.Title || '',
          url: row.URL || '',
          thumbnail: row.thumbnail || null,
          views: row.Views || 0,
          likes: row.Likes || 0
        }))
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Thumbnail asset generation request sent successfully!');
        // Optionally refresh data after a delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating thumbnail assets:', error);
      toast.error('Failed to generate thumbnail assets. Please try again.');
    } finally {
      setGeneratingImages(false);
    }
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
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Loading Baserow data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h4 className="font-semibold mb-2">Debug Information:</h4>
              <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_BASEROW_API_URL || 'https://baserow.zimtra.cloud'}</p>
              <p><strong>Table ID:</strong> {process.env.NEXT_PUBLIC_BASEROW_TABLE_ID || '584'}</p>
              <p><strong>Token:</strong> {process.env.NEXT_PUBLIC_BASEROW_API_TOKEN ? 'Set' : 'Using fallback'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>YouTube Analytics Data</CardTitle>
              <p className="text-sm text-gray-600">
                Found {fields.length} columns and {rows.length} rows
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleAddMoreResults}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add More Results
              </Button>
              <Button 
                 onClick={handleGenerateTitles}
                 variant="outline"
                 size="sm"
                 className="flex items-center gap-2"
                 disabled={rows.length === 0}
               >
                 <Wand2 className="h-4 w-4" />
                 Generate Titles
               </Button>
               <Button 
                 onClick={handleGenerateThumbnailAssets}
                 variant="outline"
                 size="sm"
                 className="flex items-center gap-2"
                 disabled={generatingImages || rows.length === 0}
               >
                 {generatingImages ? (
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                 ) : (
                   <Image className="h-4 w-4" />
                 )}
                 Generate Thumbnail Assets
               </Button>
              <Button 
                onClick={handleClearResults}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
                disabled={clearingAll || rows.length === 0}
              >
                {clearingAll ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    {fields.map((field) => (
                      <th
                        key={field.id}
                        className="border border-gray-300 px-4 py-2 text-left font-semibold"
                      >
                        {field.name}
                        <span className="text-xs text-gray-500 ml-1">({field.type})</span>
                      </th>
                    ))}
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {fields.map((field) => {
                        const value = row[field.name];
                        
                        // Handle thumbnail field specially
                        if (field.name === 'thumbnail' && Array.isArray(value) && value.length > 0) {
                          const thumbnail = value[0];
                          return (
                            <td key={`${row.id}-${field.id}`} className="border border-gray-300 px-4 py-2">
                              <div className="flex items-center space-x-2">
                                <img 
                                  src={thumbnail.thumbnails?.small?.url || thumbnail.url} 
                                  alt={thumbnail.visible_name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <span className="text-xs text-gray-500">{thumbnail.visible_name}</span>
                              </div>
                            </td>
                          );
                        }
                        
                        // Handle array fields
                        if (Array.isArray(value)) {
                          return (
                            <td key={`${row.id}-${field.id}`} className="border border-gray-300 px-4 py-2">
                              {value.length > 0 ? `[${value.length} items]` : '-'}
                            </td>
                          );
                        }
                        
                        // Handle regular fields
                        return (
                          <td key={`${row.id}-${field.id}`} className="border border-gray-300 px-4 py-2">
                            {value !== null && value !== undefined && value !== ''
                              ? String(value)
                              : '-'}
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 px-4 py-2">
                        <Button
                          onClick={() => handleDeleteRow(row.id)}
                          variant="destructive"
                          size="sm"
                          disabled={deletingRows.has(row.id)}
                          className="flex items-center gap-1"
                        >
                          {deletingRows.has(row.id) ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
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
            <p className="text-gray-600">No data found in the table.</p>
          )}
        </CardContent>
      </Card>
      </div>
      
      <GenerateTitlesModal
        isOpen={showTitlesModal}
        onClose={() => setShowTitlesModal(false)}
        tableData={rows}
      />
    </div>
  );
}