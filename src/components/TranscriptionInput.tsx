
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CardContent, Card } from "@/components/ui/card";
import { Clock, FileText, Loader2, Sparkles, Calendar, Database } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogEntry } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";

interface TranscriptionInputProps {
  onLogsGenerated: (logs: LogEntry[], title?: string) => void;
}

interface ExtractedTranscriptionData {
  transcription: string;
  videoTitle: string;
  videoId: string;
  summary?: string;
}

const TranscriptionInput = forwardRef<
  { loadTranscription: (data: ExtractedTranscriptionData) => void },
  TranscriptionInputProps
>(({ onLogsGenerated }, ref) => {
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDate, setVideoDate] = useState<Date | undefined>(new Date());
  const [videoLocation, setVideoLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Expose loadTranscription method to parent components
  useImperativeHandle(ref, () => ({
    loadTranscription: (data: ExtractedTranscriptionData) => {
      setTranscription(data.transcription);
      setVideoTitle(data.videoTitle || 'YouTube Video');
      setVideoDate(new Date());
      setVideoLocation('YouTube');
      
      // Show a toast notification
      toast({
        title: "Transcription loaded",
        description: `Loaded transcription from "${data.videoTitle || 'YouTube Video'}"`,
      });
    }
  }));

  // Save transcription to database
  const saveTranscriptionToDatabase = async (logs: LogEntry[], title: string, fullText: string, summary?: string) => {
    setIsSaving(true);
    try {
      // First, insert the transcription
      const { data: transcriptionData, error: transcriptionError } = await supabase
        .from('transcriptions')
        .insert([{
          title: title,
          video_id: logs.find(log => log.episodeId)?.episodeId?.split('-')[1] || null,
          full_text: fullText,
          summary: summary || null
        }])
        .select('id')
        .single();

      if (transcriptionError) throw transcriptionError;
      
      if (!transcriptionData?.id) {
        throw new Error("Failed to get transcription ID after insertion");
      }
      
      // Then, save all logs with a reference to the transcription
      const transcriptionId = transcriptionData.id;
      
      // Insert logs as JSON
      const logInserts = logs.map(log => ({
        transcription_id: transcriptionId,
        log_data: log
      }));
      
      const { error: logsError } = await supabase
        .from('transcription_logs')
        .insert(logInserts);
        
      if (logsError) throw logsError;
      
      toast({
        title: "Transcription saved",
        description: "Your transcription and logs have been saved to the database.",
        variant: "success",
      });
      
    } catch (error) {
      console.error("Error saving transcription to database:", error);
      toast({
        title: "Error",
        description: "Failed to save transcription to the database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const processTranscription = async () => {
    if (!transcription.trim()) {
      toast({
        title: "Error",
        description: "Please enter a transcription to process",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      toast({
        title: "Processing",
        description: "Analyzing transcription with Gemini AI...",
      });
      
      // Add metadata to the request
      const metadata = {
        title: videoTitle || 'Untitled Video',
        recordedDate: videoDate ? format(videoDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        location: videoLocation || undefined
      };
      
      // Call the Supabase Edge Function to process transcription
      const { data, error } = await supabase.functions.invoke('process-transcription', {
        body: { 
          text: transcription,
          metadata
        }
      });

      if (error) throw error;

      if (!data.logs || data.logs.length === 0) {
        throw new Error('No logs were generated from the transcription');
      }

      // Create a timestamp base for the logs if they don't have individual timestamps
      const baseDate = videoDate || new Date();
      
      // Add IDs and timestamps to the logs if they don't have them
      const processedLogs = data.logs.map((log: Partial<LogEntry>, index: number) => {
        // If no timestamp is provided, create sequential timestamps
        const timestamp = log.timestamp || 
          new Date(baseDate.getTime() + (index * 10 * 60 * 1000)).toISOString(); // Add 10 minutes per log
        
        // If location is not specified but we have a default, use it
        const location = log.location || videoLocation || `Unknown Location`;
        
        return {
          ...log,
          id: log.id || uuidv4(),
          timestamp,
          location,
          status: log.status || "completed",
          referenceId: log.referenceId || `REF-${Math.floor(Math.random() * 10000)}`,
          episodeId: videoTitle ? `${videoTitle.replace(/\s+/g, '-').toLowerCase()}-${format(baseDate, 'yyyyMMdd')}` : undefined
        };
      }) as LogEntry[];

      // Save transcription and logs to database
      await saveTranscriptionToDatabase(
        processedLogs,
        videoTitle || 'Untitled Video',
        transcription,
        data.summary
      );

      // Pass both the processed logs and the video title to the handler
      onLogsGenerated(processedLogs, videoTitle || 'Untitled Video');
      
      toast({
        title: "Success",
        description: `Generated ${processedLogs.length} log entries using Gemini AI`,
      });
      
      // Clear the transcription field after successful processing
      setTranscription('');
      setVideoTitle('');
      setVideoLocation('');
    } catch (error) {
      console.error("Error processing transcription:", error);
      toast({
        title: "Error",
        description: "Failed to process transcription. Please check if the Gemini API key is valid.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="glass mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center mb-4">
          <FileText className="w-5 h-5 mr-2 text-primary" />
          <h2 className="text-lg font-medium">Enter Video Transcription</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="videoTitle" className="block text-sm mb-1 text-muted-foreground">
              Video Title
            </label>
            <Input
              id="videoTitle"
              placeholder="Enter video title"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-muted-foreground">
              Recording Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {videoDate ? format(videoDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={videoDate}
                  onSelect={setVideoDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label htmlFor="videoLocation" className="block text-sm mb-1 text-muted-foreground">
              Default Location
            </label>
            <Input
              id="videoLocation"
              placeholder="Enter default location"
              value={videoLocation}
              onChange={(e) => setVideoLocation(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        <Textarea
          placeholder="Paste your video transcription text here..."
          className="min-h-[200px] mb-4"
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
        />
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center">
                    <Database className="w-4 h-4 mr-1" />
                    <span>Transcriptions are saved to database</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your transcriptions and logs are automatically stored</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Button 
            onClick={processTranscription} 
            disabled={isProcessing || !transcription.trim() || isSaving}
            className="relative group"
          >
            {isProcessing || isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isProcessing ? "Processing with Gemini AI..." : "Saving to database..."}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4 group-hover:text-yellow-300 transition-colors" />
                Generate Logs with Gemini AI
              </>
            )}
            <span className="absolute -top-1 -right-1 flex h-3 w-3 group-hover:opacity-100 opacity-0 transition-opacity">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

TranscriptionInput.displayName = "TranscriptionInput";

export default TranscriptionInput;
