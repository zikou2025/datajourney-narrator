
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogEntry } from "@/lib/types";
import { Send, Loader2, Sparkles, MessageSquare, Lightbulb, Settings2, FileText, ArrowDownToLine, Clock } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

interface TranscriptionQAProps {
  logs: LogEntry[];
  videoTitle?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isDeepDive?: boolean;
}

interface TranscriptionGroup {
  title: string;
  date: Date;
  logs: LogEntry[];
}

const TranscriptionQA: React.FC<TranscriptionQAProps> = ({ logs, videoTitle }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deepDiveEnabled, setDeepDiveEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedTranscriptionId, setSelectedTranscriptionId] = useState<string | null>(null);
  const { toast } = useToast();

  // Group logs by episode ID to represent different transcriptions
  const transcriptionGroups: TranscriptionGroup[] = React.useMemo(() => {
    if (!logs || logs.length === 0) return [];

    const groupedByEpisode = logs.reduce((acc, log) => {
      const episodeId = log.episodeId || 'unknown';
      if (!acc[episodeId]) {
        acc[episodeId] = {
          title: episodeId.replace(/-/g, ' ').replace(/(\b\w)/g, char => char.toUpperCase()),
          date: new Date(log.timestamp),
          logs: []
        };
      }
      acc[episodeId].logs.push(log);
      return acc;
    }, {} as Record<string, TranscriptionGroup>);

    return Object.values(groupedByEpisode).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [logs]);

  // Get logs for the selected transcription
  const selectedTranscription = React.useMemo(() => {
    if (!selectedTranscriptionId) return null;
    return transcriptionGroups.find(group => {
      const groupId = group.title.toLowerCase().replace(/\s+/g, '-');
      return groupId === selectedTranscriptionId;
    });
  }, [selectedTranscriptionId, transcriptionGroups]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isProcessing || !selectedTranscription) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: question,
      timestamp: new Date(),
      isDeepDive: deepDiveEnabled
    };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Prepare the context from selected logs
      const logsContext = selectedTranscription.logs.map(log => {
        return `[${new Date(log.timestamp).toLocaleString()}] ${log.activityType} at ${log.location}: ${log.notes}`;
      }).join('\n');

      // Call the Supabase Edge Function to process the question
      const { data, error } = await supabase.functions.invoke('answer-question', {
        body: { 
          question,
          context: logsContext,
          videoTitle: selectedTranscription.title,
          previousMessages: messages,
          deepDive: deepDiveEnabled
        }
      });

      if (error) throw error;

      // Add assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.answer || "I couldn't find an answer to your question based on the transcription.",
        timestamp: new Date(),
        isDeepDive: deepDiveEnabled
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

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion);
    if (activeTab === 'insights') {
      setActiveTab('chat');
    }
  };

  const generateDeepDiveSuggestions = () => {
    const deepQuestions = [
      "Provide a detailed analysis of all activities at the main location.",
      "Compare and contrast the different types of equipment used across all sites.",
      "What's the chronological timeline of all events mentioned and their connections?",
      "Identify all safety issues or concerns mentioned in the transcription.",
      "Analyze the efficiency of the operations described in the transcription.",
      "What patterns emerge from the different activities across locations?"
    ];

    return deepQuestions;
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
        {/* Transcription selector */}
        <div className="mb-6">
          <Label htmlFor="transcription-select" className="mb-2 block">
            Select Transcription
          </Label>
          <Select 
            onValueChange={setSelectedTranscriptionId}
            value={selectedTranscriptionId || undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a transcription to analyze" />
            </SelectTrigger>
            <SelectContent>
              {transcriptionGroups.length > 0 ? (
                transcriptionGroups.map((group) => {
                  const groupId = group.title.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <SelectItem key={groupId} value={groupId}>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{group.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({format(group.date, 'MMM d, yyyy')})
                        </span>
                      </div>
                    </SelectItem>
                  );
                })
              ) : (
                <SelectItem value="no-transcriptions" disabled>
                  No transcriptions available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          
          {selectedTranscription && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>
                {selectedTranscription.logs.length} log entries from {format(selectedTranscription.date, 'MMMM d, yyyy')}
              </span>
            </div>
          )}
        </div>

        {!selectedTranscriptionId && (
          <div className="bg-muted/30 rounded-md p-6 flex flex-col items-center justify-center text-center">
            <FileText className="h-10 w-10 mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Select a Transcription</h3>
            <p className="text-sm text-muted-foreground">
              Please select a transcription from the dropdown above to start asking questions
            </p>
          </div>
        )}
        
        {selectedTranscriptionId && (
          <Tabs 
            defaultValue="chat" 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="space-y-4 mt-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="deep-dive" 
                  checked={deepDiveEnabled} 
                  onCheckedChange={setDeepDiveEnabled} 
                />
                <Label htmlFor="deep-dive" className="flex items-center cursor-pointer">
                  <Lightbulb className={`h-4 w-4 mr-1 ${deepDiveEnabled ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                  Deep Dive Analysis
                </Label>
                {deepDiveEnabled && (
                  <span className="text-xs text-muted-foreground">
                    (Provides more detailed answers)
                  </span>
                )}
              </div>
              
              <ScrollArea className="h-[350px] border rounded-md p-4 bg-muted/20">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                    <Sparkles className="h-12 w-12 mb-4 text-primary/50" />
                    <p className="font-medium">Ask questions about "{selectedTranscription?.title}"</p>
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
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          <div className="text-sm break-words whitespace-pre-wrap">{msg.content}</div>
                          <div className="text-xs mt-1 opacity-70 flex items-center justify-between">
                            <span>{msg.timestamp.toLocaleTimeString()}</span>
                            {msg.isDeepDive && msg.role === 'assistant' && (
                              <span className="flex items-center ml-2">
                                <Lightbulb className="h-3 w-3 mr-1 text-yellow-500" />
                                <span className="text-xs text-yellow-500">Deep Dive</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3 flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          <span className="text-sm">
                            {deepDiveEnabled 
                              ? "Generating deep dive analysis..." 
                              : "Generating answer..."
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
              
              <form onSubmit={handleSubmitQuestion} className="flex gap-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={deepDiveEnabled 
                    ? "Ask a detailed question for deep dive analysis..." 
                    : "Ask a question about the transcription..."}
                  disabled={isProcessing || !selectedTranscription}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={isProcessing || !question.trim() || !selectedTranscription}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="insights" className="mt-4">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Regular questions based on the transcription:
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
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={!selectedTranscription}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
                
                <div className="mt-8">
                  <p className="text-muted-foreground flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                    Deep dive analysis questions:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {generateDeepDiveSuggestions().map((suggestion, index) => (
                      <Button 
                        key={`deep-${index}`} 
                        variant="outline" 
                        className="justify-start text-left h-auto py-2 border-yellow-500/30 hover:border-yellow-500/60"
                        onClick={() => {
                          setDeepDiveEnabled(true);
                          handleSuggestionClick(suggestion);
                        }}
                        disabled={!selectedTranscription}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Response Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <Switch 
                        id="deep-dive-settings" 
                        checked={deepDiveEnabled} 
                        onCheckedChange={setDeepDiveEnabled} 
                      />
                      <div>
                        <Label htmlFor="deep-dive-settings" className="flex items-center">
                          <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                          Deep Dive Analysis Mode
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Provides more comprehensive and detailed answers with examples from the transcription
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedTranscription && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Current Transcription</h3>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="font-medium">{selectedTranscription.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(selectedTranscription.date, 'MMMM d, yyyy')} • 
                        {selectedTranscription.logs.length} log entries
                      </p>
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-medium mb-2">About This Feature</h3>
                  <p className="text-sm text-muted-foreground">
                    This AI assistant analyzes your transcription data to answer questions and provide insights.
                    Use Deep Dive mode for more comprehensive analysis of complex topics in the transcription.
                  </p>
                </div>
                
                {messages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Conversation History</h3>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setMessages([]);
                        toast({
                          title: "Conversation cleared",
                          description: "Your conversation history has been reset."
                        });
                      }}
                    >
                      Clear Conversation History
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground flex justify-between items-center">
        <div>
          Powered by Gemini AI • Answers are generated based on your transcription data
        </div>
        {selectedTranscriptionId && deepDiveEnabled && (
          <div className="flex items-center">
            <Lightbulb className="h-3 w-3 mr-1 text-yellow-500" />
            <span className="text-yellow-500">Deep Dive Enabled</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default TranscriptionQA;
