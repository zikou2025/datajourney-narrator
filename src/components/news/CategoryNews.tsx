
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { Headline } from "@/lib/newsData";

interface CategoryNewsProps {
  headlines: Headline[];
}

const CategoryNews: React.FC<CategoryNewsProps> = ({ headlines }) => {
  return (
    <Tabs defaultValue="technology" className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">News by Category</h2>
        <TabsList>
          <TabsTrigger value="technology">Technology</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="regulatory">Regulatory</TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="technology" className="space-y-4">
        {headlines.filter(h => h.category === "Technology").map(headline => (
          <Card key={headline.id}>
            <CardHeader>
              <CardTitle>
                <Link to={`/news/${headline.id}`} className="hover:text-primary transition-colors">
                  {headline.title}
                </Link>
              </CardTitle>
              <CardDescription>{format(headline.date, 'MMMM d, yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{headline.excerpt}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="ml-auto" asChild>
                <Link to={`/news/${headline.id}`}>Read More</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </TabsContent>
      
      <TabsContent value="safety" className="space-y-4">
        {headlines.filter(h => h.category === "Safety").map(headline => (
          <Card key={headline.id}>
            <CardHeader>
              <CardTitle>
                <Link to={`/news/${headline.id}`} className="hover:text-primary transition-colors">
                  {headline.title}
                </Link>
              </CardTitle>
              <CardDescription>{format(headline.date, 'MMMM d, yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{headline.excerpt}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="ml-auto" asChild>
                <Link to={`/news/${headline.id}`}>Read More</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </TabsContent>
      
      <TabsContent value="regulatory" className="space-y-4">
        {headlines.filter(h => h.category === "Regulatory").map(headline => (
          <Card key={headline.id}>
            <CardHeader>
              <CardTitle>
                <Link to={`/news/${headline.id}`} className="hover:text-primary transition-colors">
                  {headline.title}
                </Link>
              </CardTitle>
              <CardDescription>{format(headline.date, 'MMMM d, yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{headline.excerpt}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="ml-auto" asChild>
                <Link to={`/news/${headline.id}`}>Read More</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );
};

export default CategoryNews;
