
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
