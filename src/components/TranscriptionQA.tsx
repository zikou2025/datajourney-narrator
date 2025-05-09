import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogEntry } from "@/lib/types";
import { 
  Send, Loader2, Sparkles, MessageSquare, Lightbulb, 
  Settings2, FileText, ArrowDownToLine, Clock, AlertCircle, 
  RefreshCcw, Database, Brain, PanelLeft, ChevronRight, ChevronDown,
  ChevronUp, CheckCircle2, XCircle, HelpCircle, Filter, Youtube
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

interface QAPair {
  question: string;
  answer: string;
}

interface QuestionLevel {
  level: string;
  questions: QAPair[];
}

const TranscriptionQA: React.FC<TranscriptionQAProps> = ({ logs, videoTitle }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deepDiveEnabled, setDeepDiveEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('smart-qa');
  const [selectedTranscriptionId, setSelectedTranscriptionId] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [retryIn, setRetryIn] = useState(0);
  const [generatedQA, setGeneratedQA] = useState<QuestionLevel[]>([]);
  const [isGeneratingQA, setIsGeneratingQA] = useState(false);
  const [visibleAnswers, setVisibleAnswers] = useState<Record<string, boolean>>({});
  const [currentLevel, setCurrentLevel] = useState<string | null>(null);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isExtractingTranscription, setIsExtractingTranscription] = useState(false);
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

  // Countdown timer for rate limited state
  React.useEffect(() => {
    if (rateLimited && retryIn > 0) {
      const timer = setTimeout(() => {
        setRetryIn(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (rateLimited && retryIn === 0) {
      setRateLimited(false);
    }
  }, [rateLimited, retryIn]);

  // Toggle answer visibility
  const toggleAnswer = (questionId: string) => {
    setVisibleAnswers(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Set expanded level
  const toggleExpandLevel = (level: string) => {
    setExpandedLevel(expandedLevel === level ? null : level);
  };

  // Filter questions by level
  const filteredQuestions = currentLevel 
    ? generatedQA.find(qa => qa.level === currentLevel)?.questions || []
    : generatedQA.flatMap(qa => qa.questions);

  // Generate a unique ID for each question
  const getQuestionId = (level: string, index: number) => `${level}-q${index}`;

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
          deepDive: deepDiveEnabled,
          generateQuestions: false
        }
      });

      if (error) {
        throw error;
      }

      // Handle rate limiting
      if (data?.error === "API rate limit exceeded") {
        console.log("Rate limited response:", data);
        setRateLimited(true);
        setRetryIn(data?.retryAfter || 30);
        throw new Error(data?.message || "Rate limit exceeded. Please try again later.");
      }

      // Check if there's an error message in the response data
      if (data?.error) {
        throw new Error(data.message || data.error);
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.answer || "I couldn't find an answer to your question based on the transcription.",
        timestamp: new Date(),
        isDeepDive: deepDiveEnabled
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error processing question:", error);
      
      // Add a system message about the error
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, there was an error: ${error.message || "An unexpected error occurred"}. ${rateLimited ? `Please wait ${retryIn} seconds before trying again.` : "Please try again later."}`,
        timestamp: new Date(),
        isDeepDive: false
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: error.message || "Failed to process your question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setQuestion('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion);
    if (activeTab !== 'chat') {
      setActiveTab('chat');
    }
  };

  const generateQuestionAnswers = async () => {
    if (!selectedTranscription || isGeneratingQA) return;
    
    setIsGeneratingQA(true);
    setProgressPercent(10);
    
    try {
      // Prepare the context from selected logs
      const logsContext = selectedTranscription.logs.map(log => {
        return `[${new Date(log.timestamp).toLocaleString()}] ${log.activityType} at ${log.location}: ${log.notes}`;
      }).join('\n');

      setProgressPercent(30);
      
      // Call the Supabase Edge Function to generate Q&A
      const { data, error } = await supabase.functions.invoke('answer-question', {
        body: { 
          context: logsContext,
          videoTitle: selectedTranscription.title,
          generateQuestions: true
        }
      });

      setProgressPercent(70);

      if (error) {
        throw error;
      }

      // Handle rate limiting
      if (data?.error === "API rate limit exceeded") {
        console.log("Rate limited response:", data);
        setRateLimited(true);
        setRetryIn(data?.retryAfter || 30);
        throw new Error(data?.message || "Rate limit exceeded. Please try again later.");
      }

      // Check if there's an error message in the response data
      if (data?.error) {
        throw new Error(data.message || data.error);
      }

      setProgressPercent(90);
      
      // Process and set generated Q&A
      if (data?.questionsAndAnswers && Array.isArray(data.questionsAndAnswers)) {
        setGeneratedQA(data.questionsAndAnswers);
        setCurrentLevel(null); // Show all questions initially
        
        // Initialize all answers as hidden
        const initialVisibility: Record<string, boolean> = {};
        data.questionsAndAnswers.forEach((level: QuestionLevel) => {
          level.questions.forEach((_, index) => {
            initialVisibility[getQuestionId(level.level, index)] = false;
          });
        });
        setVisibleAnswers(initialVisibility);
        
        toast({
          title: "Questions Generated",
          description: `Successfully generated ${data.questionsAndAnswers.reduce(
            (total: number, level: QuestionLevel) => total + level.questions.length, 0
          )} questions across ${data.questionsAndAnswers.length} difficulty levels.`,
        });
        
        // Set the first level as expanded
        if (data.questionsAndAnswers.length > 0) {
          setExpandedLevel(data.questionsAndAnswers[0].level);
        }
      } else {
        throw new Error("Failed to generate questions and answers");
      }

      setProgressPercent(100);
      // Reset progress after a delay
      setTimeout(() => setProgressPercent(0), 1500);
      
    } catch (error: any) {
      console.error("Error generating Q&A:", error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to generate questions and answers. Please try again.",
        variant: "destructive",
      });
      
      setProgressPercent(0);
    } finally {
      setIsGeneratingQA(false);
    }
  };

  const extractYouTubeTranscription = async () => {
    if (!youtubeUrl || isExtractingTranscription) return;
    
    // Basic validation
    if (!youtubeUrl.includes('youtube.com/') && !youtubeUrl.includes('youtu.be/')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      });
      return;
    }

    setIsExtractingTranscription(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-youtube-transcription', {
        body: { youtubeUrl }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.message || data.error);
      }

      if (data?.transcription) {
        // Here you would typically save the transcription to your logs
        // For now, we'll display a success message
        toast({
          title: "Transcription Extracted",
          description: `Successfully extracted transcription from ${data.videoTitle || "YouTube video"}`,
        });

        // Reset the URL input
        setYoutubeUrl('');

        // TODO: Save the transcription data and update the transcription groups
        // This would require modifying your backend to save the transcription
      } else {
        throw new Error("No transcription data returned");
      }
    } catch (error: any) {
      console.error("Error extracting transcription:", error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to extract transcription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtractingTranscription(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Transcription Knowledge Explorer
        </CardTitle>
        <CardDescription>
          Explore your transcription data through advanced Q&A analysis
        </CardDescription>
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

        {/* YouTube Transcription Extractor */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              Extract YouTube Transcription
            </CardTitle>
            <CardDescription className="text-xs">
              Enter a YouTube video URL to extract its transcription using Gemini AI
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex gap-2">
              <Input
                placeholder="YouTube video URL (e.g., https://www.youtube.com/watch?v=...)"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={extractYouTubeTranscription}
                disabled={isExtractingTranscription || !youtubeUrl}
              >
                {isExtractingTranscription ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                )}
                {isExtractingTranscription ? "Extracting..." : "Extract"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {!selectedTranscriptionId && (
          <div className="bg-muted/30 rounded-md p-6 flex flex-col items-center justify-center text-center">
            <FileText className="h-10 w-10 mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Select a Transcription</h3>
            <p className="text-sm text-muted-foreground">
              Please select a transcription from the dropdown above to start exploring
            </p>
          </div>
        )}
        
        {selectedTranscriptionId && (
          <Tabs 
            defaultValue="smart-qa" 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="smart-qa">Smart Q&A</TabsTrigger>
              <TabsTrigger value="chat">Ask Questions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="smart-qa" className="space-y-4 mt-4">
              {rateLimited && (
                <Alert className="bg-amber-50 text-amber-900 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle>API Rate Limit Reached</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span>Please wait {retryIn} seconds before making another request.</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={retryIn > 0}
                      className="text-amber-700 border-amber-300"
                      onClick={() => setRateLimited(false)}
                    >
                      <RefreshCcw className="h-3 w-3 mr-1" />
                      Try again
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              {generatedQA.length === 0 ? (
                <div className="space-y-4">
                  <div className="bg-muted/20 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                    <Brain className="h-12 w-12 mb-4 text-primary/60" />
                    <h3 className="text-lg font-semibold mb-2">Generate Questions & Answers</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Automatically generate a comprehensive set of questions and answers based on this transcription,
                      organized by complexity level.
                    </p>
                    <Button
                      onClick={generateQuestionAnswers}
                      disabled={isGeneratingQA || rateLimited}
                      className="gap-2"
                    >
                      {isGeneratingQA ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating Q&A...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate Q&A Set
                        </>
                      )}
                    </Button>
                    
                    {isGeneratingQA && (
                      <div className="w-full max-w-md mt-6">
                        <Progress value={progressPercent} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                          This may take a minute or two...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Filter controls */}
                  <div className="flex items-center gap-4 bg-muted/20 p-3 rounded-lg">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant={currentLevel === null ? "secondary" : "outline"} 
                        size="sm" 
                        onClick={() => setCurrentLevel(null)}
                      >
                        All
                      </Button>
                      {generatedQA.map((level) => (
                        <Button
                          key={level.level}
                          variant={currentLevel === level.level ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setCurrentLevel(level.level)}
                          className={`${level.level === 'Basic' 
                            ? 'border-green-200 hover:border-green-300' 
                            : level.level === 'Intermediate'
                            ? 'border-blue-200 hover:border-blue-300'
                            : 'border-purple-200 hover:border-purple-300'}`}
                        >
                          {level.level}
                        </Button>
                      ))}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto"
                      onClick={generateQuestionAnswers}
                      disabled={isGeneratingQA || rateLimited}
                    >
                      <RefreshCcw className="h-3 w-3 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Accordion version */}
                    {currentLevel === null && (
                      <div className="space-y-4">
                        {generatedQA.map((level) => (
                          <div key={level.level} className="border rounded-lg overflow-hidden">
                            <div 
                              className={`px-4 py-3 flex items-center justify-between cursor-pointer ${
                                level.level === 'Basic' 
                                  ? 'bg-green-50 hover:bg-green-100' 
                                  : level.level === 'Intermediate'
                                  ? 'bg-blue-50 hover:bg-blue-100'
                                  : 'bg-purple-50 hover:bg-purple-100'
                              }`}
                              onClick={() => toggleExpandLevel(level.level)}
                            >
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`${
                                    level.level === 'Basic' 
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                      : level.level === 'Intermediate'
                                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                      : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                  }`}
                                >
                                  {level.level}
                                </Badge>
                                <span className="font-medium">{level.level} Questions</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({level.questions.length} questions)
                                </span>
                              </div>
                              {expandedLevel === level.level ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            
                            {expandedLevel === level.level && (
                              <div className="p-4 space-y-4">
                                {level.questions.map((qa, index) => {
                                  const questionId = getQuestionId(level.level, index);
                                  return (
                                    <div 
                                      key={questionId}
                                      className="border rounded-md overflow-hidden transition-all"
                                    >
                                      <div 
                                        className="p-3 bg-white flex items-start gap-3 cursor-pointer hover:bg-gray-50"
                                        onClick={() => toggleAnswer(questionId)}
                                      >
                                        <div className="mt-1 flex-shrink-0">
                                          <HelpCircle className={`h-5 w-5 
                                            ${level.level === 'Basic' 
                                              ? 'text-green-500' 
                                              : level.level === 'Intermediate'
                                              ? 'text-blue-500'
                                              : 'text-purple-500'
                                            }`} 
                                          />
                                        </div>
                                        <div className="flex-grow">
                                          <p className="font-medium">{qa.question}</p>
                                          
                                          {visibleAnswers[questionId] && (
                                            <div className="mt-3 pt-3 border-t text-muted-foreground">
                                              {qa.answer}
                                            </div>
                                          )}
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="flex-shrink-0 h-8 w-8 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleAnswer(questionId);
                                          }}
                                        >
                                          {visibleAnswers[questionId] ? (
                                            <ChevronUp className="h-4 w-4" />
                                          ) : (
                                            <ChevronDown className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Filtered question view */}
                    {currentLevel !== null && (
                      <div className="space-y-4">
                        {filteredQuestions.map((qa, index) => {
                          const questionId = getQuestionId(currentLevel, index);
                          return (
                            <Card key={questionId} className="overflow-hidden">
                              <CardHeader className="bg-muted/10 py-4">
                                <div className="flex items-start">
                                  <HelpCircle className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0
                                    ${currentLevel === 'Basic' 
                                      ? 'text-green-500' 
                                      : currentLevel === 'Intermediate'
                                      ? 'text-blue-500'
                                      : 'text-purple-500'
                                    }`} 
                                  />
                                  <CardTitle className="text-base font-medium">{qa.question}</CardTitle>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-4">
                                <p className="text-muted-foreground">{qa.answer}</p>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="chat" className="space-y-4 mt-4">
              {rateLimited && (
                <Alert className="bg-amber-50 text-amber-900 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle>API Rate Limit Reached</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span>Please wait {retryIn} seconds before asking another question.</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={retryIn > 0}
                      className="text-amber-700 border-amber-300"
                      onClick={() => setRateLimited(false)}
                    >
                      <RefreshCcw className="h-3 w-3 mr-1" />
                      Try again
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

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
                    <MessageSquare className="h-12 w-12 mb-4 text-primary/50" />
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
                              : msg.content.includes('error') || msg.content.includes('Error')
                                ? 'bg-red-100 text-red-800'
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
                  disabled={isProcessing || !selectedTranscription || rateLimited}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={isProcessing || !question.trim() || !selectedTranscription || rateLimited}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
              
              {generatedQA.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    Use questions from our generated Q&A:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {generatedQA.flatMap(level => 
                      level.questions.slice(0, 2).map((qa, i) => (
                        <Button
                          key={`suggest-${level.level}-${i}`}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleSuggestionClick(qa.question)}
                        >
                          {qa.question.length > 45 ? qa.question.substring(0, 45) + '...' : qa.question}
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              )}
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
                  <Alert className="mt-3 bg-blue-50 text-blue-800 border-blue-200">
                    <AlertTitle className="text-sm">API Usage Information</AlertTitle>
                    <AlertDescription className="text-xs">
                      This feature uses the Gemini AI API, which has rate limits. If you encounter a rate limit error, 
                      wait a few moments before trying again. For high-volume usage, consider upgrading your API plan.
                    </AlertDescription>
                  </Alert>
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
                
                {generatedQA.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Generated Q&A</h3>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setGeneratedQA([]);
                        toast({
                          title: "Q&A Cleared",
                          description: "Generated questions and answers have been cleared."
                        });
                      }}
                    >
                      Clear Generated Q&A
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
        {selectedTranscriptionId && (
          <div className="flex items-center gap-2">
            {deepDiveEnabled && (
              <div className="flex items-center">
                <Lightbulb className="h-3 w-3 mr-1 text-yellow-500" />
                <span className="text-yellow-500">Deep Dive</span>
              </div>
            )}
            {generatedQA.length > 0 && (
              <div className="flex items-center">
                <Database className="h-3 w-3 mr-1 text-blue-500" />
                <span className="text-blue-500">
                  {generatedQA.reduce(
                    (total, level) => total + level.questions.length, 0
                  )} Questions
                </span>
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default TranscriptionQA;
