import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, MapPin } from "lucide-react";
import { LogEntry } from '@/lib/types';
import { formatNewsDate, getExcerpt } from '@/lib/newsUtils';
import { useNavigate } from 'react-router-dom';

interface ModernNewsSidebarProps {
  trendingArticles: LogEntry[];
  recentArticles: LogEntry[];
  categories: {[key: string]: number};
  onArticleClick?: (article: LogEntry) => void;
}

const ModernNewsSidebar: React.FC<ModernNewsSidebarProps> = ({
  trendingArticles,
  recentArticles,
  categories,
  onArticleClick
}) => {
  const navigate = useNavigate();

  const handleArticleClick = (article: LogEntry) => {
    if (onArticleClick) {
      onArticleClick(article);
    } else {
      navigate(`/news/${article.id}`);
    }
  };
  return (
    <div className="space-y-6">
      {/* Trending Stories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingArticles.slice(0, 5).map((article, index) => (
            <div 
              key={article.id}
              className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
              onClick={() => handleArticleClick(article)}
            >
              <span className="text-lg font-bold text-primary w-6">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2 mb-1">
                  {article.activityType}
                </h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatNewsDate(article.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Updates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentArticles.slice(0, 4).map((article) => (
            <div 
              key={article.id}
              className="cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
              onClick={() => handleArticleClick(article)}
            >
              <Badge variant="outline" className="text-xs mb-1">
                {article.activityCategory}
              </Badge>
              <h4 className="font-medium text-sm line-clamp-2 mb-1">
                {article.activityType}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                {getExcerpt(article.notes, 60)}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{article.location}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(categories).slice(0, 6).map(([category, count]) => (
            <div 
              key={category}
              className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <span className="text-sm font-medium">{category}</span>
              <Badge variant="secondary" className="text-xs">
                {count}
              </Badge>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="w-full mt-2">
            View All Categories
          </Button>
        </CardContent>
      </Card>

      {/* Newsletter Signup */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 text-center">
          <h3 className="font-semibold mb-2">Stay Updated</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Get the latest construction industry news delivered to your inbox.
          </p>
          <Button size="sm" className="w-full">
            Subscribe Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernNewsSidebar;