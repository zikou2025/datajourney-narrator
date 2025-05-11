
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { Calendar, Clock, User, Share, Bookmark, ChevronLeft, MapPin, ArrowLeft, MessageSquare, Newspaper, TrendingUp } from 'lucide-react';
import { headlines } from '@/lib/newsData';
import { Link } from 'react-router-dom';

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Find the article based on the ID
  const article = headlines.find(h => h.id === Number(id));
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  
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
    .slice(0, 3);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header with Ground News style */}
      <div className="bg-black text-white py-4 border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/legacy-news')}
              className="text-white hover:text-white/80 hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to News
            </Button>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:text-white/80 hover:bg-white/10"
              >
                <Newspaper className="h-4 w-4 mr-2" />
                Browse
              </Button>
              <div className="h-4 w-[1px] bg-white/20"></div>
              <Button 
                asChild
                variant="ghost" 
                size="sm"
                className="text-white hover:text-white/80 hover:bg-white/10"
              >
                <Link to="/admin">
                  Admin
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Article Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              {article.trending && (
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-500">Trending</span>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-primary/90">{article.category}</Badge>
                <Badge variant="outline">Construction</Badge>
                <Badge variant="outline">Development</Badge>
              </div>
              
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
                <Separator orientation="vertical" className="h-4 mx-3" />
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <span>{article.comments} comments</span>
                </div>
              </div>
            </div>
            
            {/* Featured Image with Ground News style shadow */}
            <div className="rounded-lg overflow-hidden shadow-xl">
              <img 
                src={article.image} 
                alt={article.title} 
                className="w-full h-auto object-cover" 
              />
            </div>
            
            {/* Article Text */}
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg font-medium">{article.excerpt}</p>
              
              <div className={`relative overflow-hidden ${!isExpanded ? 'max-h-[400px]' : ''}`}>
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
                
                <h2>Community Impact</h2>
                <p>
                  Local residents have expressed both excitement and concerns regarding the development. 
                  Many look forward to the improved amenities and potential job creation, while others 
                  have raised questions about construction noise and temporary access restrictions.
                </p>
                
                <h2>Environmental Considerations</h2>
                <p>
                  The project team has incorporated numerous eco-friendly elements into the design, 
                  including green spaces, efficient water management systems, and renewable energy 
                  components. These features align with the city's broader sustainability goals and 
                  represent a forward-thinking approach to urban development.
                </p>
                
                {!isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
                )}
              </div>
              
              {!isExpanded && (
                <div className="flex justify-center mt-4">
                  <Button 
                    onClick={() => setIsExpanded(true)} 
                    variant="outline"
                    className="group"
                  >
                    Read More
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-0.5"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </Button>
                </div>
              )}
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
            
            {/* Related Articles with Ground News style */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Newspaper className="h-5 w-5 mr-2 text-primary" />
                Related Stories
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((related) => (
                  <Link 
                    to={`/news/${related.id}`} 
                    key={related.id}
                    className="group"
                  >
                    <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={related.image}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <CardContent className="p-4">
                        <Badge variant="outline" className="mb-2">{related.category}</Badge>
                        <h3 className="font-medium line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                          {related.title}
                        </h3>
                        <div className="flex items-center text-xs text-muted-foreground mt-2">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{format(related.date, 'MMM d, yyyy')}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar - Ground News Styled */}
          <div className="space-y-8">
            {/* Author Card */}
            <Card className="overflow-hidden border-t-4 border-t-primary">
              <CardHeader className="bg-secondary/50">
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  About the Author
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
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
            
            {/* Project Location */}
            <Card className="overflow-hidden border-t-4 border-t-primary">
              <CardHeader className="bg-secondary/50">
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  Project Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="bg-muted h-40 w-full rounded-md flex items-center justify-center mb-4">
                  <p className="text-sm text-muted-foreground">Map View</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Downtown Construction Zone</p>
                  <p className="text-muted-foreground">Intersection of Main St & Central Ave</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Newsletter - Ground News style */}
            <Card className="overflow-hidden border-t-4 border-t-primary bg-gradient-to-br from-primary/5 to-background">
              <CardHeader className="bg-secondary/50">
                <CardTitle className="flex items-center text-lg">
                  <Newspaper className="h-5 w-5 mr-2 text-primary" />
                  Stay Updated
                </CardTitle>
                <CardDescription>Get the latest industry news directly to your inbox</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <Input 
                  type="email" 
                  placeholder="Your email address" 
                  className="w-full px-3 py-2 text-sm rounded-md border"
                />
                <Button className="w-full bg-primary hover:bg-primary/90">Subscribe</Button>
              </CardContent>
            </Card>
            
            {/* Admin Link */}
            <Card>
              <CardContent className="p-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/admin">
                    Access Admin Panel
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;
