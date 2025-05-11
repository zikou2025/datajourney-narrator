
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { Newspaper, TrendingUp } from 'lucide-react';

const NewsHero: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-black to-gray-900 text-white pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-medium text-primary">Construction Industry</h2>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Stay informed with the latest news & developments
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Critical insights and updates on industry trends, regulations, and breakthroughs
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <TrendingUp className="mr-2 h-5 w-5" />
              Latest Updates
            </Button>
            <Button variant="outline" size="lg" className="text-white border-white hover:bg-white/10">
              Subscribe to Newsletter
            </Button>
            <Button variant="outline" asChild className="text-white border-white hover:bg-white/10">
              <Link to="/admin">
                Admin Access
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsHero;
