import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, MapPin, User, Calendar } from "lucide-react";
import { LogEntry } from '@/lib/types';
import { mockLogs } from '@/lib/mockLogs';
import { supabase } from '@/integrations/supabase/client';
import { formatNewsDate } from '@/lib/newsUtils';

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<LogEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      
      try {
        // First try to fetch from Supabase
        const { data, error } = await supabase
          .from('transcriptions')
          .select('*')
          .eq('id', id)
          .single();

        if (data && !error) {
          const transformedArticle: LogEntry = {
            id: data.id,
            timestamp: data.created_at,
            activityType: data.title,
            activityCategory: "Transcription",
            notes: data.full_text || "",
            location: "Online",
            status: "completed" as const,
            equipment: "",
            personnel: "",
            material: "",
            measurement: "",
            referenceId: data.id
          };
          setArticle(transformedArticle);
        } else {
          // Fallback to mock data
          const mockArticle = mockLogs.find(log => log.id === id);
          setArticle(mockArticle || null);
        }
      } catch (error) {
        console.error('Error fetching article:', error);
        // Fallback to mock data
        const mockArticle = mockLogs.find(log => log.id === id);
        setArticle(mockArticle || null);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested article could not be found.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to News
          </Button>
        </div>
      </header>

      {/* Article Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="space-y-8">
          {/* Article Header */}
          <div className="space-y-4">
            <Badge className="text-sm">{article.activityCategory}</Badge>
            <h1 className="text-4xl font-bold leading-tight">
              {article.activityType}
            </h1>
            
            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatNewsDate(article.timestamp)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{article.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Construction News Team</span>
              </div>
            </div>
          </div>

          {/* Featured Image Placeholder */}
          <div className="aspect-[16/9] bg-muted rounded-lg" />

          {/* Article Content */}
          <Card>
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg leading-relaxed">
                  {article.notes}
                </p>
                
                {/* Additional Details */}
                {(article.equipment || article.personnel || article.material) && (
                  <div className="mt-8 p-6 bg-muted/50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {article.equipment && (
                        <div>
                          <strong>Equipment:</strong>
                          <p className="text-muted-foreground">{article.equipment}</p>
                        </div>
                      )}
                      {article.personnel && (
                        <div>
                          <strong>Personnel:</strong>
                          <p className="text-muted-foreground">{article.personnel}</p>
                        </div>
                      )}
                      {article.material && (
                        <div>
                          <strong>Materials:</strong>
                          <p className="text-muted-foreground">{article.material}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="mt-6 flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge 
                    variant={article.status === 'completed' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {article.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Articles Section */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Related Articles</h3>
              <p className="text-muted-foreground">
                More construction industry news and updates coming soon.
              </p>
            </CardContent>
          </Card>
        </article>
      </main>
    </div>
  );
};

export default NewsDetail;