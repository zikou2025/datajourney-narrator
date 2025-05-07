
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogEntry } from "@/lib/types";
import { Send, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TranscriptionQAProps {
  logs: LogEntry[];
  videoTitle?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const TranscriptionQA: React.FC<TranscriptionQAProps> = ({ logs, videoTitle }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isProcessing) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: question,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Prepare the context from logs
      const logsContext = logs.map(log => {
        return `[${new Date(log.timestamp).toLocaleString()}] ${log.activityType} at ${log.location}: ${log.notes}`;
      }).join('\n');

      // Call the Supabase Edge Function to process the question
      const { data, error } = await supabase.functions.invoke('answer-question', {
        body: { 
          question,
          context: logsContext,
          videoTitle: videoTitle || 'Video Transcription',
          previousMessages: messages
        }
      });

      if (error) throw error;

      // Add assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.answer || "I couldn't find an answer to your question based on the transcription.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error processing question:", error);
      toast({
        title: "Error",
        description: "Failed to process your question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setQuestion('');
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Ask Questions About The Transcription
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="space-y-4 mt-4">
            <div className="h-[300px] overflow-y-auto border rounded-md p-4 bg-muted/20">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Sparkles className="h-12 w-12 mb-4 text-primary/50" />
                  <p>Ask questions about the transcription to get AI-powered answers</p>
                  <p className="text-sm mt-2">Example: "What locations were mentioned?" or "Summarize what happened at the construction site"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div 
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[75%] rounded-lg p-3 ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}
                      >
                        <div className="text-sm break-words">{msg.content}</div>
                        <div className="text-xs mt-1 opacity-70">
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3 flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="text-sm">Generating answer...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmitQuestion} className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about the transcription..."
                disabled={isProcessing}
                className="flex-1"
              />
              <Button type="submit" disabled={isProcessing || !question.trim()}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="insights" className="mt-4">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Suggested questions based on the transcription:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  "What are the main locations mentioned?",
                  "Summarize the key activities",
                  "What equipment was used?",
                  "Who were the key personnel involved?",
                  "What challenges or issues were reported?",
                  "What was the timeline of events?"
                ].map((suggestion, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    className="justify-start text-left h-auto py-2"
                    onClick={() => setQuestion(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Powered by Gemini AI • Answers are generated based on your transcription data
      </CardFooter>
    </Card>
  );
};

export default TranscriptionQA;
