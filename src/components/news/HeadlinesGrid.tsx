
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { Calendar, MessageSquare, Share, Bookmark, TrendingUp } from 'lucide-react';
import { Headline } from "@/lib/newsData";

interface HeadlinesGridProps {
  headlines: Headline[];
}

const HeadlinesGrid: React.FC<HeadlinesGridProps> = ({ headlines }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Top Headlines</h2>
        <Button variant="ghost" size="sm">View All</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {headlines.slice(0, 4).map(headline => (
          <Card key={headline.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <Link to={`/news/${headline.id}`}>
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={headline.image} 
                  alt={headline.title} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                />
                <Badge className="absolute top-2 right-2" variant="secondary">{headline.category}</Badge>
                {headline.trending && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending
                  </div>
                )}
              </div>
            </Link>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg line-clamp-2">
                <Link to={`/news/${headline.id}`} className="hover:text-primary transition-colors">
                  {headline.title}
                </Link>
              </CardTitle>
              <CardDescription className="flex items-center text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {format(headline.date, 'MMM d, yyyy')}
                <Separator orientation="vertical" className="mx-2 h-3" />
                {headline.author}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-muted-foreground text-sm line-clamp-2">{headline.excerpt}</p>
            </CardContent>
            <CardFooter className="pt-0 flex justify-between">
              <div className="flex items-center text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3 mr-1" />
                {headline.comments} comments
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Share className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HeadlinesGrid;
