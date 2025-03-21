
import { LogEntry } from "./types";

export const mockLogData: LogEntry[] = [
  {
    id: "LOG-001",
    timestamp: "2023-05-15T08:30:00Z",
    location: "Massey's Test Facility",
    activityCategory: "Equipment",
    activityType: "Installation",
    equipment: "Drilling Rig XR-7",
    personnel: "J. Martinez, T. Wilson",
    material: "Steel pipe, concrete mix",
    measurement: "Depth: 125m",
    status: "completed",
    notes: "Installation completed ahead of schedule. Pressure tests successful.",
    media: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop",
    referenceId: "PROJ-2023-05-A",
    coordinates: [-97.7431, 30.2672]
  },
  {
    id: "LOG-002",
    timestamp: "2023-05-16T10:15:00Z",
    location: "Sanchez Site",
    activityCategory: "Testing",
    activityType: "Soil Analysis",
    equipment: "Portable Analyzer SA-3",
    personnel: "A. Johnson, S. Lee",
    material: "Soil samples",
    measurement: "pH: 6.8, Moisture: 22%",
    status: "completed",
    notes: "Soil composition ideal for planned construction. No contaminants detected.",
    media: "https://images.unsplash.com/photo-1635975222141-800da0fb4319?q=80&w=2071&auto=format&fit=crop",
    referenceId: "PROJ-2023-05-B",
    coordinates: [-97.8031, 30.2272]
  },
  {
    id: "LOG-003",
    timestamp: "2023-05-17T13:45:00Z",
    location: "Riverside Extension",
    activityCategory: "Survey",
    activityType: "Topographical",
    equipment: "Drone Mapper DJI-450",
    personnel: "R. Chen",
    material: "N/A",
    measurement: "Area: 4.5 sq km",
    status: "in-progress",
    notes: "Western section completed. Eastern section delayed due to weather conditions.",
    media: "https://images.unsplash.com/photo-1508108712903-49b7ef9b1df8?q=80&w=2069&auto=format&fit=crop",
    referenceId: "PROJ-2023-05-C",
    coordinates: [-97.7131, 30.2572]
  },
  {
    id: "LOG-004",
    timestamp: "2023-05-18T09:00:00Z",
    location: "Massey's Test Facility",
    activityCategory: "Maintenance",
    activityType: "Scheduled",
    equipment: "Generator G-100",
    personnel: "F. Rodriguez, M. Smith",
    material: "Oil, filters",
    measurement: "Runtime: 5000 hrs",
    status: "completed",
    notes: "Routine maintenance completed. Next scheduled in 500 hours.",
    media: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=2069&auto=format&fit=crop",
    referenceId: "PROJ-2023-05-D",
    coordinates: [-97.7431, 30.2672]
  },
  {
    id: "LOG-005",
    timestamp: "2023-05-19T11:30:00Z",
    location: "Highpoint Tower",
    activityCategory: "Inspection",
    activityType: "Structural",
    equipment: "Scanner X-5",
    personnel: "K. Wong, D. Miller",
    material: "N/A",
    measurement: "Stress factors within normal range",
    status: "completed",
    notes: "All structural elements pass inspection. Recertification valid for 12 months.",
    media: "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?q=80&w=2187&auto=format&fit=crop",
    referenceId: "PROJ-2023-05-E",
    coordinates: [-97.7531, 30.2772]
  },
  {
    id: "LOG-006",
    timestamp: "2023-05-20T14:00:00Z",
    location: "Westside Project",
    activityCategory: "Construction",
    activityType: "Foundation",
    equipment: "Excavator E-250, Concrete Mixer CM-10",
    personnel: "Construction Team A",
    material: "Reinforced concrete",
    measurement: "Foundation depth: 3.5m",
    status: "in-progress",
    notes: "Northwest corner completed. Moving to northeast section tomorrow.",
    media: "https://images.unsplash.com/photo-1521791055366-0d553872125f?q=80&w=2069&auto=format&fit=crop",
    referenceId: "PROJ-2023-05-F",
    coordinates: [-97.7831, 30.2372]
  },
  {
    id: "LOG-007",
    timestamp: "2023-05-21T08:45:00Z",
    location: "Sanchez Site",
    activityCategory: "Logistics",
    activityType: "Material Delivery",
    equipment: "Truck Fleet (5 vehicles)",
    personnel: "Logistics Team B",
    material: "Steel beams, prefab panels",
    measurement: "67 tons total",
    status: "completed",
    notes: "All materials delivered and inventoried. Storage area secure.",
    media: "https://images.unsplash.com/photo-1542621334-a254cf47733d?q=80&w=2070&auto=format&fit=crop",
    referenceId: "PROJ-2023-05-G",
    coordinates: [-97.8031, 30.2272]
  },
  {
    id: "LOG-008",
    timestamp: "2023-05-22T10:00:00Z",
    location: "Riverside Extension",
    activityCategory: "Environmental",
    activityType: "Impact Assessment",
    equipment: "Water Quality Testers",
    personnel: "E. Nguyen, J. Brown",
    material: "Water samples",
    measurement: "All parameters within acceptable limits",
    status: "completed",
    notes: "Environmental impact assessment completed. Results submitted to regulatory agency.",
    media: "https://images.unsplash.com/photo-1527489377706-5bf97e608852?q=80&w=2259&auto=format&fit=crop",
    referenceId: "PROJ-2023-05-H",
    coordinates: [-97.7131, 30.2572]
  },
  {
    id: "LOG-009",
    timestamp: "2023-05-23T13:15:00Z",
    location: "Highpoint Tower",
    activityCategory: "Safety",
    activityType: "Drill",
    equipment: "Safety Systems",
    personnel: "All on-site personnel",
    material: "N/A",
    measurement: "Evacuation time: 4.5 minutes",
    status: "completed",
    notes: "Emergency evacuation drill conducted successfully. Two areas identified for improvement.",
    media: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2070&auto=format&fit=crop",
    referenceId: "PROJ-2023-05-I",
    coordinates: [-97.7531, 30.2772]
  },
  {
    id: "LOG-010",
    timestamp: "2023-05-24T09:30:00Z",
    location: "Westside Project",
    activityCategory: "Planning",
    activityType: "Schedule Review",
    equipment: "N/A",
    personnel: "Project Management Team",
    material: "N/A",
    measurement: "N/A",
    status: "planned",
    notes: "Meeting scheduled to review project timeline and resource allocation for next phase.",
    referenceId: "PROJ-2023-05-J",
    coordinates: [-97.7831, 30.2372]
  },
  {
    id: "LOG-011",
    timestamp: "2023-05-25T11:00:00Z",
    location: "Massey's Test Facility",
    activityCategory: "Training",
    activityType: "Operator Certification",
    equipment: "Simulator XR-5",
    personnel: "New Operator Group C",
    material: "Training materials",
    measurement: "Certification pass rate: 92%",
    status: "completed",
    notes: "12 new operators certified. 1 trainee scheduled for additional training next week.",
    media: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop",
    referenceId: "PROJ-2023-05-K",
    coordinates: [-97.7431, 30.2672]
  },
  {
    id: "LOG-012",
    timestamp: "2023-05-26T14:30:00Z",
    location: "Sanchez Site",
    activityCategory: "Equipment",
    activityType: "Maintenance",
    equipment: "Crane CR-300",
    personnel: "Maintenance Team A",
    material: "Replacement parts",
    measurement: "Downtime: 3.5 hours",
    status: "delayed",
    notes: "Maintenance delayed due to parts availability. Expected completion tomorrow.",
    media: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=2070&auto=format&fit=crop",
    referenceId: "PROJ-2023-05-L",
    coordinates: [-97.8031, 30.2272]
  },
  {
    id: "LOG-013",
    timestamp: "2023-05-27T08:15:00Z",
    location: "Riverside Extension",
    activityCategory: "Testing",
    activityType: "Water Flow",
    equipment: "Flow Meters",
    personnel: "S. Garcia, R. Johnson",
    material: "N/A",
    measurement: "Flow rate: 45 m³/h",
    status: "completed",
    notes: "Flow test completed successfully. Results within design parameters.",
    media: "https://images.unsplash.com/photo-1548407260-da850faa41e3?q=80&w=1887&auto=format&fit=crop",
    referenceId: "PROJ-2023-05-M",
    coordinates: [-97.7131, 30.2572]
  },
  {
    id: "LOG-014",
    timestamp: "2023-05-28T10:45:00Z",
    location: "Highpoint Tower",
    activityCategory: "Construction",
    activityType: "HVAC Installation",
    equipment: "HVAC Units Model H-100",
    personnel: "HVAC Team B",
    material: "Ductwork, cooling units",
    measurement: "Installation 75% complete",
    status: "in-progress",
    notes: "HVAC installation continuing on floors 15-20. Scheduled completion by Friday.",
    media: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070&auto=format&fit=crop",
    referenceId: "PROJ-2023-05-N",
    coordinates: [-97.7531, 30.2772]
  },
  {
    id: "LOG-015",
    timestamp: "2023-05-29T13:00:00Z",
    location: "Westside Project",
    activityCategory: "Inspection",
    activityType: "Quality Control",
    equipment: "Testing Equipment Suite",
    personnel: "QC Team A",
    material: "N/A",
    measurement: "All specifications met",
    status: "cancelled",
    notes: "Inspection cancelled due to unforeseen circumstances. Rescheduled for next week.",
    referenceId: "PROJ-2023-05-O",
    coordinates: [-97.7831, 30.2372]
  }
];

// Helper functions to process data
export const getLocationGroups = (): { location: string; coordinates: [number, number]; count: number }[] => {
  const locations = mockLogData.reduce((acc, log) => {
    const existing = acc.find(l => l.location === log.location);
    if (existing) {
      existing.count += 1;
    } else if (log.coordinates) {
      acc.push({ 
        location: log.location, 
        coordinates: log.coordinates,
        count: 1
      });
    }
    return acc;
  }, [] as { location: string; coordinates: [number, number]; count: number }[]);
  
  return locations;
};

export const getStatusCounts = () => {
  return mockLogData.reduce((acc, log) => {
    acc[log.status] = (acc[log.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

export const getCategoryCounts = () => {
  return mockLogData.reduce((acc, log) => {
    acc[log.activityCategory] = (acc[log.activityCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};
