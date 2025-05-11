
import IndexHeader from "@/components/index/IndexHeader";
import IndexFeaturedContent from "@/components/index/IndexFeaturedContent";
import IndexLatestContent from "@/components/index/IndexLatestContent";
import IndexTrendingContent from "@/components/index/IndexTrendingContent";
import IndexLocationsContent from "@/components/index/IndexLocationsContent";
import IndexFooter from "@/components/index/IndexFooter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div>
      <IndexHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          <Button asChild>
            <Link to="/legacy-news">News Portal</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin">Admin Dashboard</Link>
          </Button>
        </div>
        <IndexFeaturedContent />
        <IndexLatestContent />
        <IndexTrendingContent />
        <IndexLocationsContent />
      </div>
      <IndexFooter />
    </div>
  );
};

export default Index;
