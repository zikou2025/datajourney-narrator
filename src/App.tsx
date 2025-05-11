
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TimeSeriesView from "./components/TimeSeriesView";
import StorytellingView from "./components/StorytellingView";
import TranscriptionQA from "./components/TranscriptionQA";
import NewsLanding from "./pages/NewsLanding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/legacy-news" element={<NewsLanding />} /> {/* Renamed to legacy-news */}
          <Route path="/timeseries" element={<TimeSeriesView logs={[]} />} />
          <Route path="/story" element={<StorytellingView logs={[]} />} />
          <Route path="/transcription" element={<TranscriptionQA logs={[]} />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
