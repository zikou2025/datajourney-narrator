
import { LogEntry } from "./types";
import { v4 as uuidv4 } from "uuid";

// Helper function to create dates
const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

// Generate mock log data
export const mockLogs: LogEntry[] = [
  {
    id: uuidv4(),
    timestamp: daysAgo(0),
    location: "Downtown Project",
    activityCategory: "Construction",
    activityType: "Foundation Work",
    equipment: "Excavator, Cement Mixer",
    personnel: "Team A",
    material: "Concrete, Steel Reinforcement",
    measurement: "100 cubic meters",
    status: "completed",
    notes: "Completed foundation work ahead of schedule. Quality inspection passed with no issues.",
    referenceId: "REF-001",
    coordinates: [-122.4194, 37.7749]
  },
  {
    id: uuidv4(),
    timestamp: daysAgo(1),
    location: "Riverside Development",
    activityCategory: "Inspection",
    activityType: "Structural Assessment",
    equipment: "Testing Equipment",
    personnel: "Engineering Team",
    material: "N/A",
    measurement: "N/A",
    status: "in-progress",
    notes: "Structural integrity assessment ongoing. Initial findings show potential issues with east wing support beams.",
    referenceId: "REF-002",
    coordinates: [-122.4005, 37.7835]
  },
  {
    id: uuidv4(),
    timestamp: daysAgo(2),
    location: "Harbor View Towers",
    activityCategory: "Planning",
    activityType: "Design Review",
    equipment: "N/A",
    personnel: "Architecture Team",
    material: "N/A",
    measurement: "N/A",
    status: "planned",
    notes: "Client requested changes to the rooftop design. New blueprints being prepared for approval.",
    referenceId: "REF-003",
    coordinates: [-122.3924, 37.7955]
  },
  {
    id: uuidv4(),
    timestamp: daysAgo(3),
    location: "Central Station Renovation",
    activityCategory: "Demolition",
    activityType: "Interior Demolition",
    equipment: "Jackhammers, Bulldozers",
    personnel: "Team B",
    material: "N/A",
    measurement: "200 square meters",
    status: "delayed",
    notes: "Unexpected asbestos found in walls. Work halted until proper containment procedures are implemented.",
    referenceId: "REF-004",
    coordinates: [-122.4104, 37.7890]
  },
  {
    id: uuidv4(),
    timestamp: daysAgo(4),
    location: "Harbor View Towers",
    activityCategory: "Construction",
    activityType: "Electrical Wiring",
    equipment: "Electrical Tools",
    personnel: "Electrical Contractors",
    material: "Copper Wire, Junction Boxes",
    measurement: "1500 meters of wiring",
    status: "completed",
    notes: "Completed electrical wiring for floors 1-10. All systems tested and working properly.",
    referenceId: "REF-005",
    coordinates: [-122.3924, 37.7955]
  },
  {
    id: uuidv4(),
    timestamp: daysAgo(5),
    location: "Downtown Project",
    activityCategory: "Safety",
    activityType: "Safety Inspection",
    equipment: "Safety Equipment",
    personnel: "Safety Officer",
    material: "N/A",
    measurement: "N/A",
    status: "completed",
    notes: "Monthly safety inspection completed. Two minor issues identified and resolved immediately.",
    referenceId: "REF-006",
    coordinates: [-122.4194, 37.7749]
  },
  {
    id: uuidv4(),
    timestamp: daysAgo(6),
    location: "Riverside Development",
    activityCategory: "Construction",
    activityType: "Roof Installation",
    equipment: "Crane, Safety Harnesses",
    personnel: "Team C",
    material: "Roofing Materials, Insulation",
    measurement: "500 square meters",
    status: "in-progress",
    notes: "Roof installation 60% complete. Weather forecast shows clear skies for the next week.",
    referenceId: "REF-007",
    coordinates: [-122.4005, 37.7835]
  },
  {
    id: uuidv4(),
    timestamp: daysAgo(7),
    location: "Mountain View Complex",
    activityCategory: "Planning",
    activityType: "Site Preparation",
    equipment: "Survey Equipment",
    personnel: "Survey Team",
    material: "N/A",
    measurement: "N/A",
    status: "planned",
    notes: "Site survey scheduled for next week. Environmental impact assessment pending approval.",
    referenceId: "REF-008",
    coordinates: [-122.3865, 37.8025]
  },
  {
    id: uuidv4(),
    timestamp: daysAgo(8),
    location: "Central Station Renovation",
    activityCategory: "Inspection",
    activityType: "Foundation Inspection",
    equipment: "Testing Equipment",
    personnel: "Engineering Team",
    material: "N/A",
    measurement: "N/A",
    status: "completed",
    notes: "Foundation inspection passed. Green light given for next phase of construction.",
    referenceId: "REF-009",
    coordinates: [-122.4104, 37.7890]
  },
  {
    id: uuidv4(),
    timestamp: daysAgo(9),
    location: "Mountain View Complex",
    activityCategory: "Construction",
    activityType: "Ground Breaking",
    equipment: "Excavator, Bulldozer",
    personnel: "Team A",
    material: "N/A",
    measurement: "1000 cubic meters",
    status: "planned",
    notes: "Ground breaking ceremony scheduled for next month. Preparations underway.",
    referenceId: "REF-010",
    coordinates: [-122.3865, 37.8025]
  }
];
