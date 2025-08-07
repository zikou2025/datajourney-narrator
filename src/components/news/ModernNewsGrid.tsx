import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronRight } from "lucide-react";
import { LogEntry } from '@/lib/types';
import { formatNewsDate, getExcerpt } from '@/lib/newsUtils';
import { useNavigate } from 'react-router-dom';

interface ModernNewsGridProps {
  articles: LogEntry[];
  onArticleClick?: (article: LogEntry) => void;
}

const ModernNewsGrid: React.FC<ModernNewsGridProps> = ({ articles, onArticleClick }) => {
  const navigate = useNavigate();
  const featuredArticle = articles[0];
  const secondaryArticles = articles.slice(1, 4);
  const remainingArticles = articles.slice(4);

  const handleArticleClick = (article: LogEntry) => {
    if (onArticleClick) {
      onArticleClick(article);
    } else {
      navigate(`/news/${article.id}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Article */}
      {featuredArticle && (
        <Card 
          className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
          onClick={() => handleArticleClick(featuredArticle)}
        >
          <div className="aspect-[16/9] bg-muted relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <Badge className="bg-primary mb-2">{featuredArticle.activityCategory}</Badge>
              <h1 className="text-3xl font-bold mb-2 line-clamp-2">
                {featuredArticle.activityType}
              </h1>
              <p className="text-lg opacity-90 line-clamp-2">
                {getExcerpt(featuredArticle.notes, 120)}
              </p>
              <div className="flex items-center gap-2 text-sm opacity-75 mt-2">
                <Clock className="h-3 w-3" />
                <span>{formatNewsDate(featuredArticle.timestamp)}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Secondary Articles Grid */}
      {secondaryArticles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {secondaryArticles.map((article) => (
            <Card 
              key={article.id}
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-300"
              onClick={() => handleArticleClick(article)}
            >
              <div className="aspect-[16/10] bg-muted" />
              <CardContent className="p-4">
                <Badge variant="outline" className="text-xs mb-2">
                  {article.activityCategory}
                </Badge>
                <h3 className="font-semibold mb-2 line-clamp-2 text-sm">
                  {article.activityType}
                </h3>
                <p className="text-muted-foreground text-xs line-clamp-2 mb-2">
                  {getExcerpt(article.notes, 80)}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatNewsDate(article.timestamp)}</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Article List */}
      {remainingArticles.length > 0 && (
        <div className="space-y-1">
          {remainingArticles.map((article) => (
            <Card 
              key={article.id}
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors duration-200"
              onClick={() => handleArticleClick(article)}
            >
              <div className="flex items-start gap-4">
                <div className="w-20 h-16 bg-muted rounded flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {article.activityCategory}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatNewsDate(article.timestamp)}
                    </span>
                  </div>
                  <h3 className="font-medium mb-1 line-clamp-2 text-sm">
                    {article.activityType}
                  </h3>
                  <p className="text-muted-foreground text-xs line-clamp-2">
                    {getExcerpt(article.notes, 100)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModernNewsGrid;