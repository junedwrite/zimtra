"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Image as ImageIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface GenerateThumbnailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowData: any;
}

export function GenerateThumbnailModal({ isOpen, onClose, rowData }: GenerateThumbnailModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        action: "generate_thumbnail",
        prompt: prompt.trim(),
        video_data: {
          id: rowData.id,
          title: rowData.Title,
          url: rowData.URL,
          current_thumbnail: rowData.thumbnail,
          views: rowData.Views,
          likes: rowData.Likes
        }
      };

      const response = await fetch(process.env.NEXT_PUBLIC_GENERATE_IMAGES_WEBHOOK!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.image) {
        setGeneratedImageUrl(data.image);
        setHasGenerated(true);
        toast.success("Thumbnail generated successfully!");
      } else {
        throw new Error("No image URL in response");
      }
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      toast.error("Failed to generate thumbnail. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedImageUrl(null);
    setHasGenerated(false);
  };

  const handleGenerateAgain = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedImageUrl(null);
    
    try {
      const payload = {
        action: "generate_thumbnail",
        prompt: prompt.trim(),
        video_data: {
          id: rowData.id,
          title: rowData.Title,
          url: rowData.URL,
          current_thumbnail: rowData.thumbnail,
          views: rowData.Views,
          likes: rowData.Likes
        }
      };

      const response = await fetch(process.env.NEXT_PUBLIC_GENERATE_IMAGES_WEBHOOK!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate image');
      }
      
      const data = await response.json();
      
      if (data.image) {
        setGeneratedImageUrl(data.image);
        toast.success('New thumbnail generated successfully!');
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate thumbnail. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    if (!generatedImageUrl) {
      toast.error('No image to copy');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(generatedImageUrl);
      toast.success('Image URL copied to clipboard!');
    } catch (error) {
      console.error('Error copying image URL:', error);
      toast.error('Failed to copy image URL');
    }
  };

  const handleClose = () => {
    setPrompt("");
    setGeneratedImageUrl(null);
    setHasGenerated(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Thumbnail Asset</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Video Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-sm text-gray-700 mb-2">Video Details</h3>
            <p className="text-sm font-medium">{rowData?.Title}</p>
            <p className="text-xs text-gray-500 mt-1">{rowData?.URL}</p>
          </div>

          {/* Current Thumbnail Preview */}
          {rowData?.thumbnail && Array.isArray(rowData.thumbnail) && rowData.thumbnail.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Current Thumbnail</Label>
              <div className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                <div className="flex items-center space-x-6">
                  <div className="relative group">
                    <img 
                      src={rowData.thumbnail[0].thumbnails?.small?.url || rowData.thumbnail[0].url} 
                      alt={rowData.thumbnail[0].visible_name || "Current thumbnail"}
                      className="w-32 h-20 object-cover rounded-lg border-2 border-gray-300 shadow-md transition-transform group-hover:scale-105"
                      onError={(e) => {
                        console.error('Failed to load thumbnail image:', rowData.thumbnail[0]);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-800 mb-1">Original Thumbnail</p>
                    <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full inline-block">{rowData.thumbnail[0].visible_name}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Current Thumbnail</Label>
              <div className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No current thumbnail available</p>
                    <p className="text-xs text-gray-400 mt-1">Debug: {JSON.stringify(rowData?.thumbnail)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Thumbnail Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the thumbnail you want to generate (e.g., 'A vibrant YouTube thumbnail with bold text overlay showing...')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Generate/Regenerate Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {hasGenerated ? "Generate New" : "Generate Thumbnail"}
                </>
              )}
            </Button>
            
            {hasGenerated && (
              <Button
                onClick={handleRegenerate}
                variant="outline"
                disabled={isGenerating}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>

          {/* Image Display Area */}
          <div className="space-y-2">
            {generatedImageUrl ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">Generated Thumbnail</Label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAgain}
                      disabled={isGenerating}
                      className="text-xs px-3 py-1 h-8"
                    >
                      Generate Again
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyImage}
                      className="text-xs px-3 py-1 h-8"
                    >
                      Copy Image URL
                    </Button>
                  </div>
                </div>
                <div className="border-2 border-green-200 rounded-xl p-6 bg-gradient-to-br from-green-50 to-white shadow-sm">
                  <div className="relative group">
                    <img 
                      src={generatedImageUrl} 
                      alt="Generated thumbnail"
                      className="w-full max-w-lg mx-auto rounded-lg border-2 border-green-300 shadow-lg transition-transform group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 rounded-lg transition-all duration-200"></div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-green-700 font-medium bg-green-100 px-3 py-1 rounded-full inline-block">
                      ✨ AI Generated Thumbnail
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <Label>Generated Thumbnail</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center min-h-[300px] flex items-center justify-center">
                  {isGenerating ? (
                    <div className="flex flex-col items-center space-y-4">
                      <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                      <p className="text-gray-500">Generating your thumbnail...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-4">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                      <p className="text-gray-500">
                        {hasGenerated ? "Click 'Generate New' to create another thumbnail" : "Enter a prompt and click 'Generate Thumbnail' to create your image"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            {generatedImageUrl && (
              <Button onClick={() => {
                toast.success("Thumbnail saved!");
                handleClose();
              }}>
                Accept Thumbnail
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}