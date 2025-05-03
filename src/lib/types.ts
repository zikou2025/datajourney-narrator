
export interface LogEntry {
  id: string;
  timestamp: string;
  location: string;
  activityCategory: string;
  activityType: string;
  equipment: string;
  personnel: string;
  material: string;
  measurement: string;
  status: "completed" | "in-progress" | "planned" | "delayed" | "cancelled";
  notes: string;
  media?: string;
  referenceId: string;
  coordinates?: [number, number]; // [longitude, latitude]
  episodeId?: string; // Added episodeId field for episode connections
  timeElapsed?: number; // Time elapsed in minutes since the first log
}

export type LocationGroup = {
  location: string;
  logs: LogEntry[];
  coordinates?: [number, number];
};

export type StatusCounts = {
  completed: number;
  "in-progress": number;
  planned: number;
  delayed: number;
  cancelled: number;
};

export type CategoryCounts = {
  [key: string]: number;
};

export type TimeSeriesData = {
  timestamp: Date;
  count: number;
  category?: string;
  location?: string;
  status?: string;
}

export interface StorySegment {
  title: string;
  location: string;
  start: string;
  end: string;
  timeSpan: string;
  logs: LogEntry[];
  coordinates?: [number, number];
  summary: string;
}

export interface StoryChapter {
  title: string;
  timestamp: string;
  status: string;
  notes: string;
}
