
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CardContent, Card } from "@/components/ui/card";
import { Clock, FileText, Loader2, Sparkles } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogEntry } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';

interface TranscriptionInputProps {
  onLogsGenerated: (logs: LogEntry[]) => void;
}

const TranscriptionInput: React.FC<TranscriptionInputProps> = ({ onLogsGenerated }) => {
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

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
      
      // Call the Supabase Edge Function to process transcription
      const { data, error } = await supabase.functions.invoke('process-transcription', {
        body: { text: transcription }
      });

      if (error) throw error;

      if (!data.logs || data.logs.length === 0) {
        throw new Error('No logs were generated from the transcription');
      }

      // Add IDs and timestamps to the logs if they don't have them
      const processedLogs = data.logs.map((log: Partial<LogEntry>) => ({
        ...log,
        id: log.id || uuidv4(),
        timestamp: log.timestamp || new Date().toISOString(),
        status: log.status || "completed",
        referenceId: log.referenceId || `REF-${Math.floor(Math.random() * 10000)}`,
      })) as LogEntry[];

      onLogsGenerated(processedLogs);
      
      toast({
        title: "Success",
        description: `Generated ${processedLogs.length} log entries using Gemini AI`,
      });
      
      // Clear the transcription field after successful processing
      setTranscription('');
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
        
        <Textarea
          placeholder="Paste your video transcription text here..."
          className="min-h-[200px] mb-4"
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
        />
        
        <div className="flex justify-end">
          <Button 
            onClick={processTranscription} 
            disabled={isProcessing || !transcription.trim()}
            className="relative group"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing with Gemini AI...
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
};

export default TranscriptionInput;
