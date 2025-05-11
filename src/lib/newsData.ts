
export const headlines = [
  {
    id: 1,
    title: "Major Construction Project Launches in Downtown Area",
    excerpt: "The city has approved a $50M construction project that will transform the downtown skyline.",
    category: "Infrastructure",
    date: new Date(2023, 4, 15),
    author: "Jane Smith",
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2670&auto=format&fit=crop",
    trending: true,
    comments: 24
  },
  {
    id: 2,
    title: "New Environmental Regulations Coming Next Month",
    excerpt: "Companies will need to comply with stricter emissions standards starting June 1st.",
    category: "Regulatory",
    date: new Date(2023, 4, 14),
    author: "Michael Johnson",
    image: "https://images.unsplash.com/photo-1623110195982-3df7bd8e80c5?q=80&w=2670&auto=format&fit=crop",
    trending: false,
    comments: 12
  },
  {
    id: 3,
    title: "Technology Adoption Rates Soar in Construction Industry",
    excerpt: "Survey shows 70% of construction firms have implemented new tech solutions in the past year.",
    category: "Technology",
    date: new Date(2023, 4, 12),
    author: "Alex Chen",
    image: "https://images.unsplash.com/photo-1517404215738-15263e9f9178?q=80&w=2670&auto=format&fit=crop",
    trending: true,
    comments: 31
  },
  {
    id: 4,
    title: "Safety Training Initiative Reduces Workplace Incidents by 40%",
    excerpt: "New comprehensive safety program proves highly effective across multiple sites.",
    category: "Safety",
    date: new Date(2023, 4, 10),
    author: "Sarah Johnson",
    image: "https://images.unsplash.com/photo-1518709414768-a88981a4515d?q=80&w=2574&auto=format&fit=crop",
    trending: false,
    comments: 8
  },
  {
    id: 5,
    title: "Supply Chain Disruptions Expected to Continue Through Q3",
    excerpt: "Industry experts predict ongoing challenges with material availability and pricing.",
    category: "Supply Chain",
    date: new Date(2023, 4, 8),
    author: "Robert Miller",
    image: "https://images.unsplash.com/photo-1566995541428-ff6f0b3f7304?q=80&w=2672&auto=format&fit=crop",
    trending: true,
    comments: 17
  }
];

export const upcomingEvents = [
  {
    id: 1,
    title: "Sustainable Building Materials Expo",
    date: new Date(2023, 5, 20),
    location: "Convention Center",
    type: "Conference"
  },
  {
    id: 2,
    title: "Safety Certification Workshop",
    date: new Date(2023, 5, 15),
    location: "Training Center",
    type: "Workshop"
  },
  {
    id: 3,
    title: "Industry Networking Mixer",
    date: new Date(2023, 5, 10),
    location: "Downtown Hotel",
    type: "Networking"
  }
];

export const categories = [
  "All", "Infrastructure", "Technology", "Regulatory", 
  "Safety", "Supply Chain", "Sustainability", "Business", "Innovation"
];

export interface Headline {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: Date;
  author: string;
  image: string;
  trending: boolean;
  comments: number;
}

export interface Event {
  id: number;
  title: string;
  date: Date;
  location: string;
  type: string;
}
