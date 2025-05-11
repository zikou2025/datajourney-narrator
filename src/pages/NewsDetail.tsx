
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { Calendar, Clock, User, Share, Bookmark, ChevronLeft, MapPin } from 'lucide-react';
import { headlines } from '@/lib/newsData';
import { Link } from 'react-router-dom';

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Find the article based on the ID
  const article = headlines.find(h => h.id === Number(id));
  
  // If no article is found, show a not found message
  if (!article) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">Article Not Found</h1>
              <p className="text-muted-foreground">
                The article you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/legacy-news')}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to News
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Related articles (excluding the current one)
  const relatedArticles = headlines
    .filter(h => h.category === article.category && h.id !== article.id)
    .slice(0, 2);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 py-4 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/legacy-news')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to News
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Article Content */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <Badge className="mb-4">{article.category}</Badge>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">{article.title}</h1>
              
              <div className="flex items-center text-sm text-muted-foreground mb-6 flex-wrap gap-y-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{format(article.date, 'MMMM d, yyyy')}</span>
                </div>
                <Separator orientation="vertical" className="h-4 mx-3" />
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <span>{article.author}</span>
                </div>
                <Separator orientation="vertical" className="h-4 mx-3" />
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>5 min read</span>
                </div>
              </div>
            </div>
            
            {/* Featured Image */}
            <div className="rounded-lg overflow-hidden">
              <img 
                src={article.image} 
                alt={article.title} 
                className="w-full h-auto object-cover" 
              />
            </div>
            
            {/* Article Text */}
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg">{article.excerpt}</p>
              
              <p>
                The construction industry continues to evolve rapidly with new technologies, 
                practices, and regulations shaping its future. This project represents a significant 
                milestone in our community's development strategy, with implications for local 
                businesses, residents, and the broader economic landscape.
              </p>
              
              <h2>Project Background</h2>
              <p>
                Initial planning for this initiative began over three years ago, when city officials 
                identified the need for expanded infrastructure to support growing population demands. 
                After extensive community consultation and environmental impact studies, the final 
                proposal was approved with overwhelming support from key stakeholders.
              </p>
              
              <h2>Technical Specifications</h2>
              <p>
                The project utilizes cutting-edge construction methodologies that prioritize both 
                efficiency and sustainability. Materials have been sourced with consideration for 
                environmental impact, while design elements incorporate the latest in energy 
                conservation principles.
              </p>
              
              <h2>Timeline and Implementation</h2>
              <p>
                Work is scheduled to commence next month with an estimated completion date of 
                Q2 2024. The implementation strategy includes careful consideration of traffic 
                management and noise reduction to minimize disruption to surrounding areas.
              </p>
              
              <h2>Future Implications</h2>
              <p>
                Once completed, this project is expected to generate significant benefits including 
                improved infrastructure capacity, enhanced community spaces, and potential economic 
                growth opportunities for local businesses. Long-term maintenance plans have been 
                established to ensure the sustainability of these improvements for decades to come.
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-between border-t border-b py-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
              
              <div className="flex items-center gap-1">
                {["Construction", "Development", "Urban Planning"].map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-8">
            {/* Author Card */}
            <Card>
              <CardHeader>
                <CardTitle>About the Author</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{article.author}</h3>
                    <p className="text-sm text-muted-foreground">Industry Analyst</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Specializing in construction trends and regulatory developments with over 15 years 
                  of experience in project management and industry analysis.
                </p>
              </CardContent>
            </Card>
            
            {/* Related Articles */}
            <Card>
              <CardHeader>
                <CardTitle>Related Articles</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {relatedArticles.map((related) => (
                  <Link to={`/news/${related.id}`} key={related.id}>
                    <div 
                      key={related.id} 
                      className="border-b last:border-b-0 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <Badge variant="outline" className="mb-2">{related.category}</Badge>
                      <h3 className="font-medium line-clamp-2 mb-1">{related.title}</h3>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{format(related.date, 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
              <CardFooter className="border-t">
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link to="/legacy-news">
                    View All Articles
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Project Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Project Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-40 w-full rounded-md flex items-center justify-center mb-4">
                  <p className="text-sm text-muted-foreground">Map View</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Downtown Construction Zone</p>
                  <p className="text-muted-foreground">Intersection of Main St & Central Ave</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Newsletter */}
            <Card>
              <CardHeader>
                <CardTitle>Stay Updated</CardTitle>
                <CardDescription>Get the latest industry news directly to your inbox</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="w-full px-3 py-2 text-sm rounded-md border"
                />
                <Button className="w-full">Subscribe</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;
