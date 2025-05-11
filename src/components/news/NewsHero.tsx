
import React from 'react';
import { Button } from "@/components/ui/button";

const NewsHero: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-background pt-16 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Construction Industry News & Insights
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Stay informed with the latest updates, trends, and developments in the construction sector
          </p>
          <div className="flex gap-4">
            <Button>Latest Updates</Button>
            <Button variant="outline">Subscribe</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsHero;
