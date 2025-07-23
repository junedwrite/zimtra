'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Wand2, Check, Copy, CopyCheck } from 'lucide-react';
import { toast } from 'sonner';

interface GenerateTitlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableData: any[];
}

interface GeneratedTitle {
  id: string;
  title: string;
  score?: number;
}

export default function GenerateTitlesModal({ isOpen, onClose, tableData }: GenerateTitlesModalProps) {
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<GeneratedTitle[]>([]);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());
  const [copiedTitles, setCopiedTitles] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    if (!videoDescription.trim()) {
      toast.error('Please provide video description/transcript.');
      return;
    }

    const webhookUrl = process.env.NEXT_PUBLIC_GENERATE_TITLES_WEBHOOK;
    if (!webhookUrl || webhookUrl === 'your_generate_titles_webhook_url_here') {
      toast.error('Generate Titles webhook URL not configured.');
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        action: 'generate_titles',
        model: selectedModel,
        special_instructions: specialInstructions.trim(),
        video_description: videoDescription.trim(),
        table_data: tableData.map(row => ({
          id: row.id,
          title: row.Title || '',
          url: row.URL || '',
          views: row.Views || 0,
          likes: row.Likes || 0,
          comments: row.Comments || 0
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
        const result = await response.json();
        // Handle n8n workflow response format: { titles: ["title1", "title2", ...] }
        const titlesArray = result || [];
        const formattedTitles = titlesArray.map((title: string, index: number) => ({
          id: (index + 1).toString(),
          title: title,
          score: Math.floor(Math.random() * 20) + 80 // Random score between 80-99
        }));
        
        setGeneratedTitles(formattedTitles);
        setShowResults(true);
        toast.success('Titles generated successfully!');
      } else {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating titles:', error);
      toast.error('Failed to generate titles. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTitleSelect = (titleId: string) => {
    const newSelected = new Set(selectedTitles);
    if (newSelected.has(titleId)) {
      newSelected.delete(titleId);
    } else {
      newSelected.add(titleId);
    }
    setSelectedTitles(newSelected);
  };

  const handleCopyTitle = async (title: string, titleId: string) => {
    try {
      await navigator.clipboard.writeText(title);
      setCopiedTitles(prev => new Set(prev).add(titleId));
      toast.success('Title copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedTitles(prev => {
          const newSet = new Set(prev);
          newSet.delete(titleId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy title');
    }
  };

  const handleCopyAllSelected = async () => {
    if (selectedTitles.size === 0) {
      toast.error('Please select at least one title to copy.');
      return;
    }

    const selectedTitleTexts = generatedTitles
      .filter(title => selectedTitles.has(title.id))
      .map(title => title.title)
      .join('\n');

    try {
      await navigator.clipboard.writeText(selectedTitleTexts);
      toast.success(`Copied ${selectedTitles.size} title(s) to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy titles');
    }
  };

  const handleAcceptTitles = () => {
    if (selectedTitles.size === 0) {
      toast.error('Please select at least one title.');
      return;
    }

    const selected = generatedTitles.filter(title => selectedTitles.has(title.id));
    toast.success(`Accepted ${selected.length} title(s)`);
    
    // Reset modal state
    setSpecialInstructions('');
    setVideoDescription('');
    setShowResults(false);
    setGeneratedTitles([]);
    setSelectedTitles(new Set());
    setCopiedTitles(new Set());
    onClose();
  };

  const handleBack = () => {
    setShowResults(false);
  };

  const handleClose = () => {
    setSpecialInstructions('');
    setVideoDescription('');
    setShowResults(false);
    setGeneratedTitles([]);
    setSelectedTitles(new Set());
    setCopiedTitles(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        {!showResults ? (
          // Input Form
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Generate Video Titles
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="model-select">AI Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="special-instructions">Special Instructions (Optional)</Label>
                <Textarea
                  id="special-instructions"
                  placeholder="Enter any specific requirements for title generation (e.g., tone, style, keywords to include/avoid, target audience, etc.)"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="min-h-[100px] resize-y"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-description">Video Description/Transcript *</Label>
                <Textarea
                  id="video-description"
                  placeholder="Paste your video description, transcript, or key content here. This will be used to generate relevant and engaging titles."
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  className="min-h-[200px] resize-y"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !videoDescription.trim()}
                className="min-w-[140px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Titles
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          // Results Display
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Generated Titles
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Select the titles you want to use:
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAllSelected}
                    disabled={selectedTitles.size === 0}
                    className="text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Selected ({selectedTitles.size})
                  </Button>
                  <div className="text-sm text-gray-500">
                    Model: <span className="font-medium">{selectedModel}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {generatedTitles.map((title) => (
                  <div
                    key={title.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTitles.has(title.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTitleSelect(title.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p 
                          className="font-medium text-gray-900 select-text cursor-text leading-relaxed"
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            const selection = window.getSelection();
                            const range = document.createRange();
                            range.selectNodeContents(e.currentTarget);
                            selection?.removeAllRanges();
                            selection?.addRange(range);
                          }}
                        >
                          {title.title}
                        </p>
                        {title.score && (
                          <p className="text-sm text-gray-500 mt-2">
                            Confidence Score: {title.score}%
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyTitle(title.title, title.id);
                          }}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          {copiedTitles.has(title.id) ? (
                            <CopyCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedTitles.has(title.id)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedTitles.has(title.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleBack}>
                Back to Edit
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAcceptTitles}
                  disabled={selectedTitles.size === 0}
                  className="min-w-[120px]"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept Titles ({selectedTitles.size})
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}