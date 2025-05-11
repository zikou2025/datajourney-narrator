
import React from 'react';
import { Button } from "@/components/ui/button";

export interface IndexFooterProps {
  categories: {[key: string]: number};
}

const IndexFooter: React.FC<IndexFooterProps> = ({ categories }) => {
  return (
    <footer className="border-t bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">ConstructNews Today</h3>
            <p className="text-sm text-muted-foreground">
              Your premier source for construction industry news, updates, and insights.
              Stay informed about the latest developments in real-time.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              {categories && Object.keys(categories).slice(0, 5).map(category => (
                <li key={category}>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    {category}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Subscribe</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get the latest construction news delivered directly to your inbox.
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Your email" 
                className="px-3 py-2 text-sm rounded-md border w-full"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ConstructNews Today. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default IndexFooter;
