import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogEntry } from '@/lib/types';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack, Info, ZoomIn, ZoomOut, RotateCcw, Filter, Search, Clock, CalendarDays } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";

interface NetworkVisualizationProps {
  logs: LogEntry[];
}

interface Node {
  id: string;
  group: string;
  label: string;
  type: string;
  size: number;
  icon?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  episodeId?: string;
  timestamp?: string;
}

interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
  type: string;
  strength?: number;
}

interface ClusterNode {
  id: string;
  name: string;
  children: Node[];
}

// Enhanced visuals with more creative emoji representations
const typeToEmoji: Record<string, string> = {
  'location': '🏢',
  'activity': '⚙️',
  'resource': '📦',
  'equipment': '🔧',
  'personnel': '👤',
  'log': '📝',
  'episode': '🎬',
  'timestamp': '🕒',
  'category': '🏷️',
  'status': '🚦'
};

// Color scheme with enhanced color palette for better visual distinction
const TYPE_COLORS: Record<string, string> = {
  'location': '#4338ca',    // Indigo
  'activity': '#0891b2',    // Cyan
  'resource': '#ca8a04',    // Yellow
  'equipment': '#2563eb',   // Blue
  'personnel': '#7c3aed',   // Violet
  'log': '#dc2626',         // Red
  'episode': '#059669',     // Emerald
  'timestamp': '#9333ea',   // Purple
  'category': '#0d9488',    // Teal
  'status': '#f97316'       // Orange
};

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({ logs }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [storySteps, setStorySteps] = useState<{ nodes: Node[], links: Link[] }[]>([]);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [simulationPaused, setSimulationPaused] = useState(false);
  const [showNodeLabels, setShowNodeLabels] = useState(true);
  const [colorMode, setColorMode] = useState<'category' | 'connectivity' | 'time'>('category');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTypes, setFilteredTypes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'network' | 'timeline' | 'clusters'>('network');
  const [episodes, setEpisodes] = useState<Record<string, LogEntry[]>>({});
  const [timeRange, setTimeRange] = useState<[Date, Date] | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const { toast } = useToast();
  
  const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);
  
  // Generate episodes from logs based on time proximity
  useEffect(() => {
    if (!logs || logs.length === 0) return;
    
    // Sort logs by timestamp
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Group logs into episodes based on time gaps (more than 3 hours = new episode)
    const episodesMap: Record<string, LogEntry[]> = {};
    let currentEpisodeId = "ep-1";
    let episodeCount = 1;
    let lastTimestamp: Date | null = null;
    
    sortedLogs.forEach(log => {
      const logTime = new Date(log.timestamp);
      
      // If this is the first log or the time gap is more than 3 hours, start a new episode
      if (!lastTimestamp || (logTime.getTime() - lastTimestamp.getTime()) > 3 * 60 * 60 * 1000) {
        currentEpisodeId = `ep-${episodeCount++}`;
        episodesMap[currentEpisodeId] = [];
      }
      
      episodesMap[currentEpisodeId].push({...log, episodeId: currentEpisodeId});
      lastTimestamp = logTime;
    });
    
    setEpisodes(episodesMap);
    
    // If we have time range data, set it
    if (sortedLogs.length > 0) {
      setTimeRange([
        new Date(sortedLogs[0].timestamp),
        new Date(sortedLogs[sortedLogs.length - 1].timestamp)
      ]);
    }
  }, [logs]);

  // Generate enhanced network data from logs with episode connections
  useEffect(() => {
    if (!logs || logs.length === 0) return;
    
    try {
      // Create nodes for each unique entity
      const allNodes: Node[] = [];
      const allLinks: Link[] = [];
      const uniqueEntities: Record<string, Set<string>> = {
        location: new Set(),
        activity: new Set(),
        resource: new Set(),
        equipment: new Set(),
        personnel: new Set(),
        category: new Set(),
        status: new Set(),
        episode: new Set()
      };

      // Add episode nodes first
      Object.keys(episodes).forEach(episodeId => {
        uniqueEntities.episode.add(episodeId);
        allNodes.push({
          id: `episode-${episodeId}`,
          group: 'episode',
          label: `Episode ${episodeId.replace('ep-', '')}`,
          type: 'episode',
          size: 45,
          icon: typeToEmoji.episode
        });
      });

      // Create entity nodes for all types
      logs.forEach(log => {
        if (!log.id) return; // Skip logs without ID
        
        const episodeId = Object.keys(episodes).find(epId => 
          episodes[epId].some(epLog => epLog.id === log.id)
        ) || 'ep-unknown';
        
        // Process location
        if (log.location && !uniqueEntities.location.has(log.location)) {
          uniqueEntities.location.add(log.location);
          allNodes.push({
            id: `loc-${log.location}`,
            group: 'location',
            label: log.location,
            type: 'location',
            size: 35,
            icon: typeToEmoji.location
          });
        }
        
        // Process activity type
        if (!uniqueEntities.activity.has(log.activityType)) {
          uniqueEntities.activity.add(log.activityType);
          allNodes.push({
            id: `act-${log.activityType}`,
            group: 'activity',
            label: log.activityType,
            type: 'activity',
            size: 30,
            icon: typeToEmoji.activity
          });
        }
        
        // Process material
        if (log.material && !uniqueEntities.resource.has(log.material)) {
          uniqueEntities.resource.add(log.material);
          allNodes.push({
            id: `res-${log.material}`,
            group: 'resource',
            label: log.material,
            type: 'resource',
            size: 25,
            icon: typeToEmoji.resource
          });
        }
        
        // Process equipment
        if (log.equipment && !uniqueEntities.equipment.has(log.equipment)) {
          uniqueEntities.equipment.add(log.equipment);
          allNodes.push({
            id: `equip-${log.equipment}`,
            group: 'equipment',
            label: log.equipment,
            type: 'equipment',
            size: 28,
            icon: typeToEmoji.equipment
          });
        }
        
        // Process personnel
        if (log.personnel && !uniqueEntities.personnel.has(log.personnel)) {
          uniqueEntities.personnel.add(log.personnel);
          allNodes.push({
            id: `pers-${log.personnel}`,
            group: 'personnel',
            label: log.personnel,
            type: 'personnel',
            size: 28,
            icon: typeToEmoji.personnel
          });
        }
        
        // Process category
        if (log.activityCategory && !uniqueEntities.category.has(log.activityCategory)) {
          uniqueEntities.category.add(log.activityCategory);
          allNodes.push({
            id: `cat-${log.activityCategory}`,
            group: 'category',
            label: log.activityCategory,
            type: 'category',
            size: 26,
            icon: typeToEmoji.category
          });
        }
        
        // Process status
        if (log.status && !uniqueEntities.status.has(log.status)) {
          uniqueEntities.status.add(log.status);
          allNodes.push({
            id: `stat-${log.status}`,
            group: 'status',
            label: log.status,
            type: 'status',
            size: 24,
            icon: typeToEmoji.status
          });
        }
      });

      // Create timestamp nodes for each day
      const dateMap = new Map<string, Date>();
      logs.forEach(log => {
        if (!log.timestamp) return;
        
        const logDate = new Date(log.timestamp);
        const dateKey = logDate.toISOString().split('T')[0];
        
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, logDate);
          allNodes.push({
            id: `time-${dateKey}`,
            group: 'timestamp',
            label: new Date(dateKey).toLocaleDateString(),
            type: 'timestamp',
            size: 32,
            icon: typeToEmoji.timestamp,
            timestamp: dateKey
          });
        }
      });

      // Create log nodes and links with additional connections
      logs.forEach(log => {
        if (!log.id || !log.timestamp) return;
        
        const logDate = new Date(log.timestamp);
        const dateKey = logDate.toISOString().split('T')[0];
        const episodeId = Object.keys(episodes).find(epId => 
          episodes[epId].some(epLog => epLog.id === log.id)
        ) || 'ep-unknown';
        
        // Add log node with episode information
        const logNode: Node = {
          id: `log-${log.id}`,
          group: 'log',
          label: `Log #${log.id}`,
          type: 'log',
          size: 20,
          icon: typeToEmoji.log,
          episodeId: episodeId,
          timestamp: log.timestamp
        };
        allNodes.push(logNode);
        
        // Connect log to episode
        allLinks.push({
          source: `log-${log.id}`,
          target: `episode-${episodeId}`,
          value: 4,
          type: 'part_of',
          strength: 0.8
        });
        
        // Connect log to timestamp
        allLinks.push({
          source: `log-${log.id}`,
          target: `time-${dateKey}`,
          value: 3,
          type: 'occurred_on',
          strength: 0.7
        });
        
        // Create links between log and other entities
        allLinks.push({
          source: `log-${log.id}`,
          target: `loc-${log.location}`,
          value: 3,
          type: 'at',
          strength: 0.6
        });
        
        allLinks.push({
          source: `log-${log.id}`,
          target: `act-${log.activityType}`,
          value: 2,
          type: 'is',
          strength: 0.5
        });
        
        // Connect to category
        if (log.activityCategory) {
          allLinks.push({
            source: `log-${log.id}`,
            target: `cat-${log.activityCategory}`,
            value: 2,
            type: 'categorized_as',
            strength: 0.5
          });
        }
        
        // Connect to status
        if (log.status) {
          allLinks.push({
            source: `log-${log.id}`,
            target: `stat-${log.status}`,
            value: 2,
            type: 'has_status',
            strength: 0.4
          });
        }
        
        if (log.material) {
          allLinks.push({
            source: `log-${log.id}`,
            target: `res-${log.material}`,
            value: 1,
            type: 'uses',
            strength: 0.3
          });
        }
        
        if (log.equipment) {
          allLinks.push({
            source: `log-${log.id}`,
            target: `equip-${log.equipment}`,
            value: 1,
            type: 'with',
            strength: 0.3
          });
        }
        
        if (log.personnel) {
          allLinks.push({
            source: `log-${log.id}`,
            target: `pers-${log.personnel}`,
            value: 1,
            type: 'by',
            strength: 0.3
          });
        }
      });

      // Connect episodes chronologically
      const episodeKeys = Object.keys(episodes).sort();
      for (let i = 0; i < episodeKeys.length - 1; i++) {
        allLinks.push({
          source: `episode-${episodeKeys[i]}`,
          target: `episode-${episodeKeys[i + 1]}`,
          value: 5,
          type: 'followed_by',
          strength: 0.2
        });
      }
      
      // Connect entities that appear in consecutive episodes
      // This creates the "connecting dots" between episode logs
      Object.entries(uniqueEntities).forEach(([entityType, entityValues]) => {
        if (entityType === 'episode') return;
        
        entityValues.forEach(entityValue => {
          // Find which episodes this entity appears in
          const entityEpisodes = new Set<string>();
          
          logs.forEach(log => {
            const episodeId = Object.keys(episodes).find(epId => 
              episodes[epId].some(epLog => epLog.id === log.id)
            );
            
            if (!episodeId) return;
            
            // Check if this entity appears in this log
            let hasEntity = false;
            switch(entityType) {
              case 'location':
                hasEntity = log.location === entityValue;
                break;
              case 'activity':
                hasEntity = log.activityType === entityValue;
                break;
              case 'resource':
                hasEntity = log.material === entityValue;
                break;
              case 'equipment':
                hasEntity = log.equipment === entityValue;
                break;
              case 'personnel':
                hasEntity = log.personnel === entityValue;
                break;
              case 'category':
                hasEntity = log.activityCategory === entityValue;
                break;
              case 'status':
                hasEntity = log.status === entityValue;
                break;
            }
            
            if (hasEntity) {
              entityEpisodes.add(episodeId);
            }
          });
          
          // If the entity appears in multiple episodes, create connections
          if (entityEpisodes.size > 1) {
            const entityPrefix = {
              'location': 'loc-',
              'activity': 'act-',
              'resource': 'res-',
              'equipment': 'equip-',
              'personnel': 'pers-',
              'category': 'cat-',
              'status': 'stat-'
            }[entityType] || '';
            
            const entityNodeId = `${entityPrefix}${entityValue}`;
            
            // Connect entity to all its episodes
            Array.from(entityEpisodes).forEach(episodeId => {
              allLinks.push({
                source: entityNodeId,
                target: `episode-${episodeId}`,
                value: 2,
                type: 'appears_in',
                strength: 0.15
              });
            });
          }
        });
      });

      // Create animated story progression
      const steps = [];
      
      // First show episodes
      steps.push({
        nodes: allNodes.filter(n => n.type === 'episode'),
        links: allLinks.filter(l => {
          const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
          const targetId = typeof l.target === 'string' ? l.target : l.target.id;
          return sourceId.startsWith('episode-') && targetId.startsWith('episode-');
        })
      });
      
      // Then add timestamps
      steps.push({
        nodes: allNodes.filter(n => n.type === 'episode' || n.type === 'timestamp'),
        links: allLinks.filter(l => {
          const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
          const targetId = typeof l.target === 'string' ? l.target : l.target.id;
          const nodes = steps[0].nodes.map(n => n.id);
          return nodes.includes(sourceId) || nodes.includes(targetId) ||
                sourceId.startsWith('time-') || targetId.startsWith('time-');
        })
      });
      
      // Add logs by episode
      const episodeIds = Object.keys(episodes).sort();
      
      for (let i = 0; i < episodeIds.length; i++) {
        const epId = episodeIds[i];
        const episodeLogs = episodes[epId];
        const logIds = episodeLogs.map(log => `log-${log.id}`);
        
        // Add logs for this episode
        const currentNodes = new Set([
          ...steps[steps.length - 1].nodes.map(n => n.id),
          ...logIds
        ]);
        
        // Add entity nodes related to these logs
        const relatedEntities = new Set<string>();
        
        episodeLogs.forEach(log => {
          if (log.location) relatedEntities.add(`loc-${log.location}`);
          if (log.activityType) relatedEntities.add(`act-${log.activityType}`);
          if (log.material) relatedEntities.add(`res-${log.material}`);
          if (log.equipment) relatedEntities.add(`equip-${log.equipment}`);
          if (log.personnel) relatedEntities.add(`pers-${log.personnel}`);
          if (log.activityCategory) relatedEntities.add(`cat-${log.activityCategory}`);
          if (log.status) relatedEntities.add(`stat-${log.status}`);
        });
        
        // Add related entities to the nodes set
        Array.from(relatedEntities).forEach(id => currentNodes.add(id));
        
        // Create the step with all accumulated nodes and their links
        const stepNodes = allNodes.filter(node => currentNodes.has(node.id));
        
        const stepLinks = allLinks.filter(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;
          return currentNodes.has(sourceId) && currentNodes.has(targetId);
        });
        
        steps.push({ nodes: stepNodes, links: stepLinks });
      }

      // Validate links to ensure all source and target nodes exist
      const nodeIds = new Set(allNodes.map(node => node.id));
      const validLinks = allLinks.filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        return nodeIds.has(sourceId) && nodeIds.has(targetId);
      });

      setStorySteps(steps);
      setNodes(steps[0].nodes);
      setLinks(validLinks); // Use validated links
    } catch (error) {
      console.error("Error generating network data:", error);
      toast({
        title: "Error in network visualization",
        description: "Failed to process log data for visualization.",
        variant: "destructive",
      });
    }
  }, [logs, episodes, toast]);

  // Calculate node connectivity for heat coloring
  const nodeConnectivity = useMemo(() => {
    const connectivity: Record<string, number> = {};
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      connectivity[sourceId] = (connectivity[sourceId] || 0) + 1;
      connectivity[targetId] = (connectivity[targetId] || 0) + 1;
    });
    
    return connectivity;
  }, [links]);

  // Filter nodes based on search term
  const filteredNodes = useMemo(() => {
    if (!searchTerm && filteredTypes.length === 0) return nodes;
    
    return nodes.filter(node => {
      const matchesSearch = searchTerm ? 
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) : 
        true;
        
      const matchesType = filteredTypes.length > 0 ? 
        filteredTypes.includes(node.type) : 
        true;
        
      return matchesSearch && matchesType;
    });
  }, [nodes, searchTerm, filteredTypes]);

  // Filter links based on filtered nodes
  const filteredLinks = useMemo(() => {
    if (!searchTerm && filteredTypes.length === 0) return links;
    
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    
    return links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
  }, [links, filteredNodes, searchTerm, filteredTypes]);

  // Find the shortest path between two nodes using BFS
  const findShortestPath = (startNodeId: string, endNodeId: string) => {
    // Create a map of node connections
    const connections: Record<string, string[]> = {};
    
    filteredLinks.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      if (!connections[sourceId]) connections[sourceId] = [];
      if (!connections[targetId]) connections[targetId] = [];
      
      connections[sourceId].push(targetId);
      connections[targetId].push(sourceId); // Treat as undirected for path finding
    });
    
    // BFS queue
    const queue: string[][] = [[startNodeId]];
    const visited = new Set<string>([startNodeId]);
    
    while (queue.length > 0) {
      const path = queue.shift()!;
      const nodeId = path[path.length - 1];
      
      if (nodeId === endNodeId) {
        return path;
      }
      
      const neighbors = connections[nodeId] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
    
    return null; // No path found
  };

  // Track entity interactions across time
  const entityTimeline = useMemo(() => {
    const timeline: Record<string, {date: string, entities: Record<string, string[]>}> = {};
    
    if (logs.length === 0) return timeline;
    
    logs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      
      if (!timeline[date]) {
        timeline[date] = {
          date,
          entities: {}
        };
      }
      
      // Record all entity interactions on this date
      if (log.location) {
        if (!timeline[date].entities['location']) timeline[date].entities['location'] = [];
        if (!timeline[date].entities['location'].includes(log.location)) {
          timeline[date].entities['location'].push(log.location);
        }
      }
      
      if (log.activityType) {
        if (!timeline[date].entities['activity']) timeline[date].entities['activity'] = [];
        if (!timeline[date].entities['activity'].includes(log.activityType)) {
          timeline[date].entities['activity'].push(log.activityType);
        }
      }
      
      if (log.material) {
        if (!timeline[date].entities['resource']) timeline[date].entities['resource'] = [];
        if (!timeline[date].entities['resource'].includes(log.material)) {
          timeline[date].entities['resource'].push(log.material);
        }
      }
      
      if (log.equipment) {
        if (!timeline[date].entities['equipment']) timeline[date].entities['equipment'] = [];
        if (!timeline[date].entities['equipment'].includes(log.equipment)) {
          timeline[date].entities['equipment'].push(log.equipment);
        }
      }
      
      if (log.personnel) {
        if (!timeline[date].entities['personnel']) timeline[date].entities['personnel'] = [];
        if (!timeline[date].entities['personnel'].includes(log.personnel)) {
          timeline[date].entities['personnel'].push(log.personnel);
        }
      }
    });
    
    return timeline;
  }, [logs]);

  // Create and update visualization
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || filteredNodes.length === 0) return;

    try {
      // Clear previous visualization
      d3.select(svgRef.current).selectAll('*').remove();

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      // Create SVG with zoom capability
      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height);
        
      const zoomContainer = svg.append('g');
      
      // Set up zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.3, 5])
        .on('zoom', (event) => {
          zoomContainer.attr('transform', event.transform);
          setZoomLevel(event.transform.k);
        });
        
      svg.call(zoom as any);

      // Add definitions for effects
      const defs = svg.append('defs');
      
      // Create radial gradient for background
      const gradient = defs.append('radialGradient')
        .attr('id', 'network-background')
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '70%');
        
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'rgba(79, 70, 229, 0.08)');
        
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'rgba(255, 255, 255, 0)');
      
      // Add the background
      svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'url(#network-background)');

      // Create more elaborate filters for visual effects
      
      // Glow effect filter
      const glowFilter = defs.append('filter')
        .attr('id', 'glow')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
        
      // Add color matrix for tinting the glow
      glowFilter.append('feColorMatrix')
        .attr('type', 'matrix')
        .attr('values', '0 0 0 0 0.4 0 0 0 0 0.4 0 0 0 0 0.8 0 0 0 1 0');
      
      // Add blur effect
      glowFilter.append('feGaussianBlur')
        .attr('stdDeviation', 5)
        .attr('result', 'coloredBlur');
        
      // Merge original & blur
      const feMerge = glowFilter.append('feMerge');
      feMerge.append('feMergeNode')
        .attr('in', 'coloredBlur');
      feMerge.append('feMergeNode')
        .attr('in', 'SourceGraphic');
      
      // Highlight filter with stronger glow for selected nodes
      const highlightFilter = defs.append('filter')
        .attr('id', 'highlight')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
        
      highlightFilter.append('feColorMatrix')
        .attr('type', 'matrix')
        .attr('values', '0 0 0 0 1 0 0 0 0 0.8 0 0 0 0 0.2 0 0 0 1 0');
        
      highlightFilter.append('feGaussianBlur')
        .attr('stdDeviation', 8)
        .attr('result', 'coloredBlur');
        
      const highlightMerge = highlightFilter.append('feMerge');
      highlightMerge.append('feMergeNode')
        .attr('in', 'coloredBlur');
      highlightMerge.append('feMergeNode')
        .attr('in', 'SourceGraphic');
        
      // Create pulse animation filter with more dynamic effect
      const pulseFilter = defs.append('filter')
        .attr('id', 'pulse')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
        
      // Create animation with multiple steps
      const pulseGaussian = pulseFilter.append('feGaussianBlur')
        .attr('in', 'SourceGraphic')
        .attr('stdDeviation', 2)
        .attr('result', 'blur');
        
      // Add animated values for pulse effect
      pulseGaussian.append('animate')
        .attr('attributeName', 'stdDeviation')
        .attr('values', '1;3;5;3;1')
        .attr('dur', '3s')
        .attr('repeatCount', 'indefinite');
        
      // Add color animation to the pulse
      const pulseMatrix = pulseFilter.append('feColorMatrix')
        .attr('type', 'matrix')
        .attr('values', '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7')
        .attr('result', 'glow');
        
      // Animate the color
      pulseMatrix.append('animate')
        .attr('attributeName', 'values')
        .attr('values', '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7; 1 0 0 0 0.2 0 1 0 0 0.2 0 0 1 0 0.2 0 0 0 18 -7; 1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7')
        .attr('dur', '3s')
        .attr('repeatCount', 'indefinite');

      // Merge for pulse
      const pulseMerge = pulseFilter.append('feMerge');
      pulseMerge.append('feMergeNode')
        .attr('in', 'glow');
      pulseMerge.append('feMergeNode')
        .attr('in', 'SourceGraphic');

      // Create path glowing filter for connections
      const pathGlowFilter = defs.append('filter')
        .attr('id', 'pathGlow')
        .attr('x', '-40%')
        .attr('y', '-40%')
        .attr('width', '180%')
        .attr('height', '180%');
        
      pathGlowFilter.append('feGaussianBlur')
        .attr('stdDeviation', 4)
        .attr('result', 'blurred');
        
      const pathFilterMerge = pathGlowFilter.append('feMerge');
      pathFilterMerge.append('feMergeNode')
        .attr('in', 'blurred');
      pathFilterMerge.append('feMergeNode')
        .attr('in', 'SourceGraphic');

      // Define color scale with enhanced colors
      const getNodeColor = (node: any) => {
        if (colorMode === 'connectivity') {
          // Color based on number of connections (blue to red heat)
          const connectivityColorScale = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([0, d3.max(Object.values(nodeConnectivity)) || 10]);
          return connectivityColorScale(nodeConnectivity[node.id] || 0);
        } else if (colorMode === 'time' && node.timestamp) {
          // Color based on timestamp (time gradient)
          if (!timeRange) return TYPE_COLORS[node.type] || '#666';
          
          const timeColorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([
              timeRange[0].getTime(),
              timeRange[1].getTime()
            ]);
          
          return timeColorScale(new Date(node.timestamp).getTime());
        } else {
          // Color based on node type
          return TYPE_COLORS[node.type] || '#666';
        }
      };

      // Create arrow marker for directed links
      defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .append('path')
        .attr('d', 'M 0,-5 L 10,0 L 0,5')
        .attr('fill', '#ccc')
        .attr('stroke-opacity', 0.6);
        
      // Create highlighted path marker
      defs.append('marker')
        .attr('id', 'highlightedArrow')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .append('path')
        .attr('d', 'M 0,-5 L 10,0 L 0,5')
        .attr('fill', '#ff7b00')
        .attr('stroke-opacity', 1);

      // Create container for links
      const linkGroup = zoomContainer.append('g').attr('class', 'links');
      
      // Create link elements with gradients and enhanced styling
      const link = linkGroup.selectAll('path')
        .data(filteredLinks)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('marker-end', (d: any) => {
          // Check if this link is part of the highlighted path
          if (highlightedPath.length > 0) {
            const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
            const targetId = typeof d.target === 'string' ? d.target : d.target.id;
            
            // Find consecutive entries in the path
            for (let i = 0; i < highlightedPath.length - 1; i++) {
              if (
                (highlightedPath[i] === sourceId && highlightedPath[i+1] === targetId) ||
                (highlightedPath[i] === targetId && highlightedPath[i+1] === sourceId)
              ) {
                return 'url(#highlightedArrow)';
              }
            }
          }
          return 'url(#arrowhead)';
        })
        .attr('stroke', (d: any) => {
          // Check if this link is part of the highlighted path
          if (highlightedPath.length > 0) {
            const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
            const targetId = typeof d.target === 'string' ? d.target : d.target.id;
            
            // Find consecutive entries in the path
            for (let i = 0; i < highlightedPath.length - 1; i++) {
              if (
                (highlightedPath[i] === sourceId && highlightedPath[i+1] === targetId) ||
                (highlightedPath[i] === targetId && highlightedPath[i+1] === sourceId)
              ) {
                return '#ff7b00'; // Highlighted path color
              }
            }
          }
          
          // Create a unique gradient ID for each link
          const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
          const targetId = typeof d.target === 'string' ? d.target : d.target.id;
          const gradientId = `link-gradient-${sourceId}-${targetId}`.replace(/[^a-zA-Z0-9]/g, '-');
          
          // Get node types
          const sourceType = typeof d.source === 'object' ? d.source.type : 
            filteredNodes.find(n => n.id === d.source)?.type || 'log';
          const targetType = typeof d.target === 'object' ? d.target.type : 
            filteredNodes.find(n => n.id === d.target)?.type || 'log';
          
          // Create gradient definition
          const linkGradient = defs.append('linearGradient')
            .attr('id', gradientId)
            .attr('gradientUnits', 'userSpaceOnUse');
          
          // Set gradient colors based on source and target node types
          linkGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', TYPE_COLORS[sourceType] || '#666');
          
          linkGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', TYPE_COLORS[targetType] || '#666');
            
          return `url(#${gradientId})`;
        })
        .attr('stroke-width', (d: any) => {
          // Make highlighted paths thicker
          if (highlightedPath.length > 0) {
            const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
            const targetId = typeof d.target === 'string' ? d.target : d.target.id;
            
            for (let i = 0; i < highlightedPath.length - 1; i++) {
              if (
                (highlightedPath[i] === sourceId && highlightedPath[i+1] === targetId) ||
                (highlightedPath[i] === targetId && highlightedPath[i+1] === sourceId)
              ) {
                return Math.sqrt(d.value) * 3;
              }
            }
          }
          return Math.sqrt(d.value) * 1.8;
        })
        .attr('stroke-opacity', (d: any) => {
          // Make highlighted paths more visible
          if (highlightedPath.length > 0) {
            const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
            const targetId = typeof d.target === 'string' ? d.target : d.target.id;
            
            for (let i = 0; i < highlightedPath.length - 1; i++) {
              if (
                (highlightedPath[i] === sourceId && highlightedPath[i+1] === targetId) ||
                (highlightedPath[i] === targetId && highlightedPath[i+1] === sourceId)
              ) {
                return 1;
              }
            }
            
            return 0.3; // Dim non-highlighted links
          }
          
          return 0.6; // Default opacity
        })
        .attr('fill', 'none')
        .attr('stroke-dasharray', (d: any) => {
          const linkType = d.type;
          
          // Different dash patterns for different relationship types
          switch(linkType) {
            case 'part_of': return '0'; // Solid line
            case 'followed_by': return '10,5';
            case 'appears_in': return '5,5';
            case 'at': return '0'; // Solid line
            case 'is': return '0'; // Solid line
            case 'occurred_on': return '5,3,2,3';
            default: return '5,3';
          }
        })
        .attr('stroke-linecap', 'round')
        .attr('filter', (d: any) => {
          // Apply glow to highlighted path
          if (highlightedPath.length > 0) {
            const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
            const targetId = typeof d.target === 'string' ? d.target : d.target.id;
            
            for (let i = 0; i < highlightedPath.length - 1; i++) {
              if (
                (highlightedPath[i] === sourceId && highlightedPath[i+1] === targetId) ||
                (highlightedPath[i] === targetId && highlightedPath[i+1] === sourceId)
              ) {
                return 'url(#pathGlow)';
              }
            }
          }
          return 'none';
        });

      // Add animated flow effects based on relationship types
      link.each(function(d: any) {
        const linkType = d.type;
        const linkElement = d3.select(this);
        
        if (['followed_by', 'appears_in'].includes(linkType)) {
          // Add animated dash offset for these link types
          linkElement.append('animate')
            .attr('attributeName', 'stroke-dashoffset')
            .attr('from', 0)
            .attr('to', 100)
            .attr('dur', d.type === 'followed_by' ? '8s' : '15s')
            .attr('repeatCount', 'indefinite');
        }
      });
              
      // Create container for nodes
      const nodeGroup = zoomContainer.append('g').attr('class', 'nodes');
      
      // Create node objects with proper ID validation
      const validatedNodes = filteredNodes.map(node => ({
        ...node,
        id: node.id // Ensure ID exists
      }));
      
      // Validate links to ensure all references exist
      const validatedLinks = filteredLinks.map(link => {
        const source = typeof link.source === 'string' ? link.source : link.source.id;
        const target = typeof link.target === 'string' ? link.target : link.target.id;
        
        return {
          ...link,
          source,
          target
        };
      }).filter(link => {
        const sourceExists = validatedNodes.some(node => node.id === link.source);
        const targetExists = validatedNodes.some(node => node.id === link.target);
        return sourceExists && targetExists;
      });
      
      // Create node elements with enhanced styling
      const node = nodeGroup.selectAll('.node')
        .data(filteredNodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
        )
        .on('mouseover', (event, d: any) => {
          setHoveredNode(d);
          
          // Highlight connected links and nodes
          link.attr('stroke-opacity', (l: any) => {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            return (sourceId === d.id || targetId === d.id) ? 1 : 0.2;
          })
          .attr('stroke-width', (l: any) => {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            return (sourceId === d.id || targetId === d.id) 
              ? Math.sqrt(l.value) * 3 
              : Math.sqrt(l.value) * 1.8;
          })
          .attr('filter', (l: any) => {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            return (sourceId === d.id || targetId === d.id) ? 'url(#pathGlow)' : 'none';
          });
          
          // Find connected nodes
          const connectedNodeIds = new Set<string>();
          link.each((l: any) => {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            
            if (sourceId === d.id) connectedNodeIds.add(targetId);
            if (targetId === d.id) connectedNodeIds.add(sourceId);
          });
          
          // Highlight connected nodes
          node.classed('connected', (n: any) => n.id === d.id || connectedNodeIds.has(n.id));
          node.classed('dimmed', (n: any) => n.id !== d.id && !connectedNodeIds.has(n.id));
          
          // Show label for all connected nodes
          node.select('.node-label')
            .attr('opacity', (n: any) => {
              if (n.id === d.id || connectedNodeIds.has(n.id)) return 1;
              return showNodeLabels ? 0.6 : 0;
            })
            .attr('font-weight', (n: any) => {
              return (n.id === d.id || connectedNodeIds.has(n.id)) ? 'bold' : 'normal';
            });
          
          // Scale up the node slightly with a smooth transition
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('transform', (d: any) => `translate(${d.x},${d.y}) scale(1.3)`);
            
          // Apply filter for the glowing effect
          d3.select(event.currentTarget).select('.node-circle')
            .transition()
            .duration(200)
            .attr('filter', 'url(#highlight)');
        })
        .on('mouseout', (event, d: any) => {
          if (!selectedNode) {
            setHoveredNode(null);
            
            // Reset link appearance
            link.attr('stroke-opacity', 0.6)
                .attr('stroke-width', (l: any) => Math.sqrt(l.value) * 1.8)
                .attr('filter', 'none');
                
            // Reset node classes
            node.classed('connected', false);
            node.classed('dimmed', false);
            
            // Reset label visibility
            node.select('.node-label')
              .attr('opacity', showNodeLabels ? 1 : 0)
              .attr('font-weight', 'normal');
          }
          
          // Reset node scale and filter with a smooth transition
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('transform', (d: any) => `translate(${d.x},${d.y}) scale(1)`);
            
          d3.select(event.currentTarget).select('.node-circle')
            .transition()
            .duration(200)
            .attr('filter', (d: any) => {
              if (selectedNode && selectedNode.id === d.id) {
                return 'url(#highlight)';
              }
              if (highlightedPath.includes(d.id)) {
                return 'url(#pulse)';
              }
              return 'url(#glow)';
            });
        })
        .on('click', (event, d: any) => {
          if (selectedNode && selectedNode.id === d.id) {
            setSelectedNode(null);
            setHighlightedPath([]);
            
            // Reset link appearance
            link.attr('stroke-opacity', 0.6)
                .attr('stroke-width', (l: any) => Math.sqrt(l.value) * 1.8)
                .attr('marker-end', 'url(#arrowhead)')
                .attr('filter', 'none');
                
            // Reset node classes
            node.classed('connected', false);
            node.classed('dimmed', false);
            
            // Reset label visibility
            node.select('.node-label')
              .attr('opacity', showNodeLabels ? 1 : 0)
              .attr('font-weight', 'normal');
              
            // Reset node filters
            node.select('.node-circle')
              .attr('filter', 'url(#glow)');
          } else {
            setSelectedNode(d);
            
            // Find connected nodes
            const connectedNodeIds = new Set<string>();
            link.each((l: any) => {
              const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
              const targetId = typeof l.target === 'object' ? l.target.id : l.target;
              
              if (sourceId === d.id) connectedNodeIds.add(targetId);
              if (targetId === d.id) connectedNodeIds.add(sourceId);
            });
            
            // Highlight connected nodes
            node.classed('connected', (n: any) => n.id === d.id || connectedNodeIds.has(n.id));
            node.classed('dimmed', (n: any) => n.id !== d.id && !connectedNodeIds.has(n.id));
            
            // Show label for all connected nodes
            node.select('.node-label')
              .attr('opacity', (n: any) => {
                if (n.id === d.id || connectedNodeIds.has(n.id)) return 1;
                return 0;
              })
              .attr('font-weight', (n: any) => {
                return (n.id === d.id || connectedNodeIds.has(n.id)) ? 'bold' : 'normal';
              });
              
            // Highlight connected links
            link.attr('stroke-opacity', (l: any) => {
              const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
              const targetId = typeof l.target === 'object' ? l.target.id : l.target;
              return (sourceId === d.id || targetId === d.id) ? 1 : 0.1;
            })
            .attr('stroke-width', (l: any) => {
              const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
              const targetId = typeof l.target === 'object' ? l.target.id : l.target;
              return (sourceId === d.id || targetId === d.id) 
                ? Math.sqrt(l.value) * 3 
                : Math.sqrt(l.value) * 1.8;
            })
            .attr('filter', (l: any) => {
              const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
              const targetId = typeof l.target === 'object' ? l.target.id : l.target;
              return (sourceId === d.id || targetId === d.id) ? 'url(#pathGlow)' : 'none';
            });
            
            // Clear any existing path highlight
            setHighlightedPath([]);
            
            // Set filter for selected node
            node.select('.node-circle')
              .attr('filter', (n: any) => {
                return n.id === d.id ? 'url(#highlight)' : 'url(#glow)';
              });
          }
        });
        
      // Apply filters based on node status
      node.each(function(d: any) {
        if (highlightedPath.includes(d.id)) {
          d3.select(this).select('.node-circle')
            .attr('filter', 'url(#pulse)');
        }
      });

      // Create more visually appealing node shapes with dynamic effects
      
      // Add outer glow for nodes
      node.append('circle')
        .attr('r', (d: any) => d.size + 8)
        .attr('fill', (d: any) => getNodeColor(d))
        .attr('fill-opacity', 0.2)
        .attr('filter', 'url(#glow)');
      
      // Add decorative ring with patterns based on node type
      node.each(function(d: any) {
        const nodeGroup = d3.select(this);
        
        if (d.type === 'episode') {
          // For episode nodes, add film strip pattern
          nodeGroup.append('circle')
            .attr('r', (d: any) => d.size + 3)
            .attr('fill', 'none')
            .attr('stroke', getNodeColor(d))
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '6 2')
            .attr('stroke-opacity', 0.8);
        } else if (d.type === 'timestamp') {
          // For timestamp nodes, add clock-like pattern
          nodeGroup.append('circle')
            .attr('r', (d: any) => d.size + 3)
            .attr('fill', 'none')
            .attr('stroke', getNodeColor(d))
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '1 1')
            .attr('stroke-opacity', 0.8);
        } else {
          // For other node types, add custom ring styles
          nodeGroup.append('circle')
            .attr('r', (d: any) => d.size + 3)
            .attr('fill', 'none')
            .attr('stroke', getNodeColor(d))
            .attr('stroke-width', 1.5)
            .attr('stroke-opacity', 0.6)
            .attr('stroke-dasharray', d.type === 'log' ? '3,1' : '6,3');
        }
      });
        
      // Add node background with drop shadow effect
      node.append('circle')
        .attr('r', (d: any) => d.size)
        .attr('fill', (d: any) => {
          // Create unique gradient ID for each node
          const gradientId = `node-gradient-${d.id}`.replace(/[^a-zA-Z0-9]/g, '-');
          
          // Create radial gradient for the node
          const nodeGradient = defs.append('radialGradient')
            .attr('id', gradientId)
            .attr('cx', '0.3')
            .attr('cy', '0.3')
            .attr('r', '0.7')
            .attr('fx', '0.3')
            .attr('fy', '0.3');
            
          nodeGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', d3.rgb(getNodeColor(d)).brighter(0.5).toString());
            
          nodeGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', getNodeColor(d));
            
          return `url(#${gradientId})`;
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('class', 'node-circle')
        .attr('filter', (d: any) => {
          if (selectedNode && selectedNode.id === d.id) {
            return 'url(#highlight)';
          }
          if (highlightedPath.includes(d.id)) {
            return 'url(#pulse)';
          }
          return 'url(#glow)';
        });
        
      // Apply pulse effect to selected or searched nodes
      node.each(function(d: any) {
        if (searchTerm && d.label.toLowerCase().includes(searchTerm.toLowerCase())) {
          d3.select(this).select('.node-circle')
            .attr('filter', 'url(#pulse)');
        }
      });
        
      // Add dynamic icons with 3D-like effect
      node.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('font-size', (d: any) => d.size * 0.7)
        .attr('fill', '#fff')
        .attr('stroke', 'rgba(0,0,0,0.3)')
        .attr('stroke-width', '0.5')
        .attr('paint-order', 'stroke')
        .text((d: any) => d.icon || '');

      // Add labels for nodes with enhanced styling
      node.append('text')
        .attr('class', 'node-label')
        .attr('dy', (d: any) => d.size + 18)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('fill', '#333')
        .attr('font-weight', 'bold')
        .attr('opacity', showNodeLabels ? 1 : 0)
        .attr('pointer-events', 'none')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', '3px')
        .attr('paint-order', 'stroke')
        .text((d: any) => {
          const maxLength = 14;
          return d.label.length > maxLength 
            ? d.label.substring(0, maxLength) + '...' 
            : d.label;
        });

      // Create more visually complex count labels for nodes with multiple connections
      node.filter(d => (nodeConnectivity[d.id] || 0) > 1)
        .append('g')
        .attr('transform', (d: any) => `translate(${d.size * 0.8}, ${-d.size * 0.8})`)
        .each(function(d: any) {
          const countGroup = d3.select(this);
          
          // Add shadow effect
          countGroup.append('circle')
            .attr('r', 10)
            .attr('fill', '#374151')
            .attr('filter', 'url(#glow)')
            .attr('opacity', 0.8);
            
          // Add connection count circle
          countGroup.append('circle')
            .attr('r', 10)
            .attr('fill', '#374151')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5);
            
          // Add count text
          countGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', '9px')
            .attr('fill', '#fff')
            .attr('font-weight', 'bold')
            .text(d => nodeConnectivity[d.id] || 0);
        });

      // Update link paths function with more natural curves
      function updateLinkPaths() {
        link.attr('d', (d: any) => {
          const sourceX = typeof d.source === 'object' ? d.source.x : d.source.x;
          const sourceY = typeof d.source === 'object' ? d.source.y : d.source.y;
          const targetX = typeof d.target === 'object' ? d.target.x : d.target.x;
          const targetY = typeof d.target === 'object' ? d.target.y : d.target.y;
          
          const dx = targetX - sourceX;
          const dy = targetY - sourceY;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
          
          // Adjust the end points to not overlap nodes
          const sourceNode = typeof d.source === 'object' ? d.source : filteredNodes.find(n => n.id === d.source);
          const targetNode = typeof d.target === 'object' ? d.target : filteredNodes.find(n => n.id === d.target);
          
          if (!sourceNode || !targetNode) return '';
          
          const sourceRadius = sourceNode.size;
          const targetRadius = targetNode.size;
          
          const angle = Math.atan2(dy, dx);
          const sourceOffsetX = Math.cos(angle) * sourceRadius;
          const sourceOffsetY = Math.sin(angle) * sourceRadius;
          const targetOffsetX = Math.cos(angle) * (targetRadius + 5); // +5 for arrowhead
          const targetOffsetY = Math.sin(angle) * (targetRadius + 5);
          
          const adjustedSourceX = sourceX + sourceOffsetX;
          const adjustedSourceY = sourceY + sourceOffsetY;
          const adjustedTargetX = targetX - targetOffsetX;
          const adjustedTargetY = targetY - targetOffsetY;
          
          // Use different curve styles based on link type
          if (d.type === 'followed_by' || d.type === 'part_of') {
            // Straight line for sequential relationships
            return `M${adjustedSourceX},${adjustedSourceY}L${adjustedTargetX},${adjustedTargetY}`;
          } else {
            // Arc for other relationships
            return `M${adjustedSourceX},${adjustedSourceY}A${dr},${dr} 0 0,1 ${adjustedTargetX},${adjustedTargetY}`;
          }
        });
      }

      // Create a more complex force simulation with better layout constraints
      const simulation = d3.forceSimulation(validatedNodes as d3.SimulationNodeDatum[])
        .force('charge', d3.forceManyBody()
          .strength((d: any) => {
            // Adjust repulsive force based on node type
            switch(d.type) {
              case 'episode': return -400;
              case 'timestamp': return -300;
              case 'location': return -200;
              case 'log': return -80;
              default: return -150;
            }
          }))
        .force('link', d3.forceLink(validatedLinks)
          .id((d: any) => d.id)
          .distance((d: any) => {
            // Adjust link distance based on node types and connection strength
            const sourceType = typeof d.source === 'object' ? d.source.type : 
              filteredNodes.find(n => n.id === d.source)?.type;
            const targetType = typeof d.target === 'object' ? d.target.type : 
              filteredNodes.find(n => n.id === d.target)?.type;
              
            // Base distance, modified by node types
            let distance = 120;
            
            // Shorter distance for logs to episodes
            if ((sourceType === 'log' && targetType === 'episode') || 
                (sourceType === 'episode' && targetType === 'log')) {
              distance = 80;
            }
            
            // Shorter distance for logs to their attributes
            else if (sourceType === 'log' || targetType === 'log') {
              distance = 60;
            }
            
            // Longer distance between episodes
            else if (sourceType === 'episode' && targetType === 'episode') {
              distance = 250;
            }
            
            // Adjust based on relationship strength if defined
            if (d.strength) {
              distance = distance * (1 / d.strength);
            } else {
              // Adjust based on relationship value
              distance += 30 / d.value;
            }
            
            return distance;
          })
          .strength((d: any) => d.strength || 0.4))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide()
          .radius((d: any) => d.size * 1.5))
        .force('x', d3.forceX(width / 2).strength(0.05))
        .force('y', d3.forceY(height / 2).strength(0.05))
        .on('tick', () => {
          // Constrain nodes to view area with padding
          const padding = 50;
          filteredNodes.forEach((d: any) => {
            d.x = Math.max(padding, Math.min(width - padding, d.x));
            d.y = Math.max(padding, Math.min(height - padding, d.y));
          });

          // Update node positions
          node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
          
          // Update link paths
          updateLinkPaths();
        });

      // Store simulation for updates
      simulationRef.current = simulation;

      // Zoom to fit all nodes
      const autoZoom = () => {
        if (!svgRef.current || !containerRef.current || filteredNodes.length === 0) return;
        
        // Compute bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        filteredNodes.forEach((d: any) => {
          minX = Math.min(minX, d.x - d.size);
          minY = Math.min(minY, d.y - d.size);
          maxX = Math.max(maxX, d.x + d.size);
          maxY = Math.max(maxY, d.y + d.size);
        });
        
        const padding = 40;
        const dx = maxX - minX + padding * 2;
        const dy = maxY - minY + padding * 2;
        const x = minX - padding;
        const y = minY - padding;
        
        // Determine scale
        const scale = Math.min(width / dx, height / dy, 2);
        
        // Compute center
        const centerX = x + dx / 2;
        const centerY = y + dy / 2;
        
        // Transition zoom
        svg.transition()
          .duration(750)
          .call(
            zoom.transform as any,
            d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(scale)
              .translate(-centerX, -centerY)
          );
      };

      // Run auto zoom once nodes are set
      setTimeout(autoZoom, 100);

      // Pause or resume simulation
      if (simulationPaused) {
        simulation.stop();
      } else {
        simulation.alphaTarget(0.1).restart();
      }

      // Functions for drag behavior
      function dragstarted(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event: any, d: any) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0);
        if (!selectedNode || selectedNode.id !== d.id) {
          d.fx = null;
          d.fy = null;
        }
      }
    } catch (error) {
      console.error("Error rendering network visualization:", error);
      toast({
        title: "Visualization Error",
        description: "There was a problem rendering the network visualization.",
        variant: "destructive",
      });
    }

    // Cleanup function
    return () => {
      if (simulationRef.current) simulationRef.current.stop();
    };
  }, [filteredNodes, filteredLinks, showNodeLabels, colorMode, nodeConnectivity, searchTerm, simulationPaused, selectedNode, highlightedPath, toast]);

  // Effect for animation steps
  useEffect(() => {
    if (isAnimating && currentStep < storySteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setNodes(storySteps[currentStep + 1].nodes);
        setLinks(storySteps[currentStep + 1].links);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isAnimating, currentStep, storySteps]);

  // Support functions for controls
  const handleStepChange = (step: number) => {
    if (step >= 0 && step < storySteps.length) {
      setCurrentStep(step);
      setNodes(storySteps[step].nodes);
      setLinks(storySteps[step].links);
      setIsAnimating(false);
    }
  };

  const handlePlayPause = () => {
    setIsAnimating(!isAnimating);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setNodes(storySteps[0].nodes);
    setLinks(storySteps[0].links);
    setIsAnimating(false);
    setHoveredNode(null);
    setSelectedNode(null);
    setSearchTerm('');
    setFilteredTypes([]);
    setHighlightedPath([]);
  };

  const handleToggleSimulation = () => {
    setSimulationPaused(!simulationPaused);
  };

  const handleToggleLabels = () => {
    setShowNodeLabels(!showNodeLabels);
  };

  const handleToggleColorMode = () => {
    setColorMode(prev => {
      if (prev === 'category') return 'connectivity';
      if (prev === 'connectivity') return 'time';
      return 'category';
    });
  };

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(
        d3.zoom().scaleBy as any, 1.3
      );
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(
        d3.zoom().scaleBy as any, 0.7
      );
  };

  const handleTypeFilter = (type: string) => {
    setFilteredTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };
  
  // Find path between selected nodes
  const findPath = () => {
    if (!selectedNode || !hoveredNode || selectedNode.id === hoveredNode.id) return;
    
    const path = findShortestPath(selectedNode.id, hoveredNode.id);
    
    if (path) {
      setHighlightedPath(path);
      toast({
        title: "Path found",
        description: `Found connection path between ${selectedNode.label} and ${hoveredNode.label} with ${path.length - 1} links`,
      });
    } else {
      toast({
        title: "No path found",
        description: `Couldn't find a connection between ${selectedNode.label} and ${hoveredNode.label}`,
        variant: "destructive",
      });
    }
  };

  // Generate clusters for hierarchical view
  const generateClusters = () => {
    const clusters: ClusterNode[] = [
      { id: 'episodes', name: 'Episodes', children: [] },
      { id: 'locations', name: 'Locations', children: [] },
      { id: 'activities', name: 'Activities', children: [] },
      { id: 'resources', name: 'Resources', children: [] },
      { id: 'equipment', name: 'Equipment', children: [] },
      { id: 'personnel', name: 'Personnel', children: [] },
      { id: 'timestamps', name: 'Timepoints', children: [] },
    ];
    
    nodes.forEach(node => {
      switch(node.type) {
        case 'episode':
          clusters[0].children.push(node);
          break;
        case 'location':
          clusters[1].children.push(node);
          break;
        case 'activity':
        case 'category':
          clusters[2].children.push(node);
          break;
        case 'resource':
          clusters[3].children.push(node);
          break;
        case 'equipment':
          clusters[4].children.push(node);
          break;
        case 'personnel':
          clusters[5].children.push(node);
          break;
        case 'timestamp':
          clusters[6].children.push(node);
          break;
      }
    });
    
    // Filter out empty clusters
    return clusters.filter(cluster => cluster.children.length > 0);
  };
  
  const clusters = useMemo(generateClusters, [nodes]);

  return (
    <div className="flex flex-col h-full">
      <Tabs 
        value={viewMode} 
        onValueChange={(value) => setViewMode(value as any)}
        className="mb-4"
      >
        <div className="flex justify-between items-center mb-2">
          <TabsList>
            <TabsTrigger value="network">Network View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            <TabsTrigger value="clusters">Cluster View</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-3">
            <Badge 
              variant={colorMode === 'category' ? "default" : "outline"}
              className="cursor-pointer"
              onClick={handleToggleColorMode}
            >
              {colorMode === 'category' 
                ? "Category Colors" 
                : colorMode === 'connectivity' 
                  ? "Connectivity Heat" 
                  : "Time Gradient"}
            </Badge>
            
            <Badge 
              variant={showNodeLabels ? "default" : "outline"} 
              className="cursor-pointer"
              onClick={handleToggleLabels}
            >
              {showNodeLabels ? "Labels On" : "Labels Off"}
            </Badge>
          </div>
        </div>
        
        <div className="flex mb-4">
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 border rounded-md mr-2 flex-grow"
          />
          
          <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-thin">
            {Object.keys(typeToEmoji).map(type => (
              <Button
                key={type}
                variant={filteredTypes.includes(type) ? "default" : "outline"}
                size="sm"
                onClick={() => handleTypeFilter(type)}
                className="text-xs whitespace-nowrap"
              >
                {typeToEmoji[type as keyof typeof typeToEmoji]} {type}
              </Button>
            ))}
          </div>
        </div>
        
        <TabsContent value="network" className="m-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleStepChange(currentStep - 1)}
                disabled={currentStep === 0}>
                <SkipBack className="h-4 w-4 mr-1" />
                Prev
              </Button>
              
              <Button 
                variant={isAnimating ? "default" : "outline"} 
                size="sm"
                onClick={handlePlayPause}>
                {isAnimating ? (
                  <><Pause className="h-4 w-4 mr-1" /> Pause</>
                ) : (
                  <><Play className="h-4 w-4 mr-1" /> Play</>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleStepChange(currentStep + 1)}
                disabled={currentStep === storySteps.length - 1}>
                Next
                <SkipForward className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            <TooltipProvider>
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleZoomIn}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom In</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleZoomOut}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom Out</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleReset}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset View</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleToggleSimulation}>
                      {simulationPaused ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {simulationPaused ? "Resume Simulation" : "Pause Simulation"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
          
          <div className="relative flex-grow bg-gray-50 rounded-lg shadow-inner overflow-hidden" 
            style={{ height: 'calc(100vh - 320px)', minHeight: '500px' }}
            ref={containerRef}>
            <svg 
              ref={svgRef} 
              className="w-full h-full cursor-move"
            />
            
            {/* Node hover tooltip */}
            {hoveredNode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-4 bottom-4 glass p-3 rounded-lg shadow-lg max-w-xs z-10"
              >
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">{hoveredNode.icon}</span>
                  <h3 className="font-bold text-lg">{hoveredNode.label}</h3>
                </div>
                <p><span className="font-semibold">Type:</span> {hoveredNode.type}</p>
                <p><span className="font-semibold">Connections:</span> {nodeConnectivity[hoveredNode.id] || 0}</p>
                {hoveredNode.episodeId && (
                  <p><span className="font-semibold">Episode:</span> {hoveredNode.episodeId.replace('ep-', '#')}</p>
                )}
                {hoveredNode.timestamp && (
                  <p><span className="font-semibold">Time:</span> {new Date(hoveredNode.timestamp).toLocaleString()}</p>
                )}
                {selectedNode && selectedNode.id !== hoveredNode.id && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={findPath}
                  >
                    Find path to {selectedNode.label}
                  </Button>
                )}
              </motion.div>
            )}
            
            {/* Selected node detailed view */}
            {selectedNode && selectedNode.type === 'log' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-4 top-4 glass p-4 rounded-lg shadow-lg max-w-sm z-10"
              >
                {(() => {
                  const logId = selectedNode.id.replace('log-', '');
                  const logData = logs.find(log => log.id.toString() === logId);
                  
                  if (!logData) return <p>Log not found</p>;
                  
                  return (
                    <>
                      <h3 className="font-bold text-lg mb-2">Log #{logData.id}</h3>
                      <div className="space-y-2">
                        <p><span className="font-semibold">Date:</span> {new Date(logData.timestamp).toLocaleString()}</p>
                        <p><span className="font-semibold">Location:</span> {logData.location}</p>
                        <p><span className="font-semibold">Activity:</span> {logData.activityType}</p>
                        {logData.material && <p><span className="font-semibold">Material:</span> {logData.material}</p>}
                        {logData.equipment && <p><span className="font-semibold">Equipment:</span> {logData.equipment}</p>}
                        {logData.personnel && <p><span className="font-semibold">Personnel:</span> {logData.personnel}</p>}
                        <p><span className="font-semibold">Notes:</span> {logData.notes}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3"
                        onClick={() => setSelectedNode(null)}
                      >
                        Close
                      </Button>
                    </>
                  );
                })()}
              </motion.div>
            )}
            
            {/* Selected episode detailed view */}
            {selectedNode && selectedNode.type === 'episode' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-4 top-4 glass p-4 rounded-lg shadow-lg max-w-sm z-10"
              >
                {(() => {
                  const episodeId = selectedNode.id.replace('episode-', '');
                  const episodeLogs = episodes[episodeId] || [];
                  
                  return (
                    <>
                      <h3 className="font-bold text-lg mb-2">Episode {episodeId.replace('ep-', '#')}</h3>
                      <div className="space-y-2">
                        <p><span className="font-semibold">Logs:</span> {episodeLogs.length}</p>
                        {episodeLogs.length > 0 && (
                          <>
                            <p><span className="font-semibold">Time Period:</span> {
                              `${new Date(episodeLogs[0].timestamp).toLocaleDateString()} - ${new Date(episodeLogs[episodeLogs.length - 1].timestamp).toLocaleDateString()}`
                            }</p>
                            <p><span className="font-semibold">Locations:</span> {
                              Array.from(new Set(episodeLogs.map(log => log.location))).join(', ')
                            }</p>
                            <p><span className="font-semibold">Activities:</span> {
                              Array.from(new Set(episodeLogs.map(log => log.activityType))).slice(0, 3).join(', ') +
                              (Array.from(new Set(episodeLogs.map(log => log.activityType))).length > 3 ? '...' : '')
                            }</p>
                          </>
                        )}
                      </div>
                      <div className="mt-3 max-h-40 overflow-auto">
                        <h4 className="text-sm font-semibold mb-2">Episode Logs:</h4>
                        {episodeLogs.map(log => (
                          <div key={log.id} className="text-sm p-2 mb-2 bg-white rounded-md">
                            <div className="font-medium">{log.activityType}</div>
                            <div className="text-gray-600">{new Date(log.timestamp).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3"
                        onClick={() => setSelectedNode(null)}
                      >
                        Close
                      </Button>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </div>
          
          <div className="mt-3 flex items-center">
            <span className="text-sm font-medium mr-2">Timeline:</span>
            <div className="flex-grow">
              <Slider 
                value={[currentStep]} 
                min={0} 
                max={storySteps.length - 1} 
                step={1} 
                onValueChange={(value) => handleStepChange(value[0])}
              />
            </div>
            <span className="text-sm ml-2">
              Step {currentStep + 1}/{storySteps.length}
            </span>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            {isAnimating 
              ? "Auto-playing network evolution..." 
              : "Use the timeline to explore how the network evolves, or Play to animate."}
          </div>
          
          {/* Legend */}
          <div className="mt-4 glass p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Network Legend</h4>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {Object.entries(typeToEmoji).map(([type, emoji]) => (
                <div key={type} className="flex items-center text-xs" onClick={() => handleTypeFilter(type)} style={{cursor: 'pointer'}}>
                  <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: TYPE_COLORS[type] }}></span>
                  <span className="mr-1">{emoji}</span>
                  <span>{type}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="timeline" className="m-0">
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col h-full" style={{ minHeight: '600px' }}>
            <h3 className="text-lg font-medium mb-4">Entity Timeline Analysis</h3>
            
            <div className="flex-grow overflow-auto">
              <div className="relative">
                {/* Timeline axis */}
                <div className="absolute left-36 right-0 h-1 bg-gray-200 top-6"></div>
                
                {/* Timeline entries */}
                {Object.entries(entityTimeline)
                  .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                  .map(([date, data], index) => (
                    <div key={date} className="flex items-start mb-8">
                      {/* Date marker */}
                      <div className="w-36 pr-4 flex-shrink-0">
                        <div className="font-medium">{new Date(date).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{
                          logs.filter(log => new Date(log.timestamp).toISOString().split('T')[0] === date).length
                        } logs</div>
                      </div>
                      
                      {/* Timeline point */}
                      <div className="relative">
                        <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-primary -ml-2 mt-2"></div>
                        
                        {/* Entity groups */}
                        <div className="pl-8 pt-1">
                          <AnimatePresence>
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                              <Card className="p-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {Object.entries(data.entities).map(([entityType, entities]) => (
                                    <div key={entityType} className="glass p-2 rounded-lg">
                                      <div className="flex items-center mb-2">
                                        <span className="mr-2">{typeToEmoji[entityType as keyof typeof typeToEmoji]}</span>
                                        <span className="font-medium capitalize">{entityType}s</span>
                                      </div>
                                      <div className="text-sm">
                                        {entities.map(entity => (
                                          <Badge key={entity} variant="secondary" className="mr-1 mb-1">
                                            {entity}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="mt-3 text-sm">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => {
                                      // Find logs from this date
                                      const dateLogs = logs.filter(log => 
                                        new Date(log.timestamp).toISOString().split('T')[0] === date
                                      );
                                      
                                      if (dateLogs.length > 0) {
                                        const firstLog = dateLogs[0];
                                        const logNode = nodes.find(n => n.id === `log-${firstLog.id}`);
                                        
                                        if (logNode) {
                                          setSelectedNode(logNode);
                                          // Scroll back to network view
                                          setViewMode('network');
                                        }
                                      }
                                    }}
                                  >
                                    View in Network
                                  </Button>
                                </div>
                              </Card>
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="clusters" className="m-0">
          <div className="bg-gray-50 rounded-lg p-4" style={{ minHeight: '600px' }}>
            <h3 className="text-lg font-medium mb-4">Entity Clusters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clusters.map(cluster => (
                <Card key={cluster.id} className="p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2" 
                      style={{ backgroundColor: TYPE_COLORS[cluster.name.toLowerCase().replace(/s$/, '')] || '#666' }}>
                      <span className="text-white text-lg">
                        {typeToEmoji[cluster.name.toLowerCase().replace(/s$/, '') as keyof typeof typeToEmoji]}
                      </span>
                    </div>
                    <h4 className="text-lg font-medium">{cluster.name}</h4>
                    <Badge className="ml-2">{cluster.children.length}</Badge>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {cluster.children.map((node, i) => (
                      <div 
                        key={node.id}
                        className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                        onClick={() => {
                          setSelectedNode(node);
                          setViewMode('network');
                        }}
                      >
                        <span className="text-lg mr-2">{node.icon}</span>
                        <span className="text-sm">{node.label}</span>
                        {node.episodeId && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            Ep {node.episodeId.replace('ep-', '#')}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
              
              {/* Episode connections */}
              {Object.keys(episodes).length > 1 && (
                <Card className="p-4 col-span-1 md:col-span-2 lg:col-span-3">
                  <h4 className="text-lg font-medium mb-3">Episode Connections</h4>
                  <div className="overflow-x-auto">
                    <div className="flex items-center space-x-2 min-w-max">
                      {Object.entries(episodes)
                        .sort(([idA], [idB]) => idA.localeCompare(idB))
                        .map(([episodeId, logs], index, array) => (
                          <React.Fragment key={episodeId}>
                            <div 
                              className="glass p-2 rounded-lg cursor-pointer flex flex-col items-center"
                              onClick={() => {
                                const epNode = nodes.find(n => n.id === `episode-${episodeId}`);
                                if (epNode) {
                                  setSelectedNode(epNode);
                                  setViewMode('network');
                                }
                              }}
                            >
                              <div className="font-medium">Episode {episodeId.replace('ep-', '#')}</div>
                              <div className="text-xs text-gray-500">{logs.length} logs</div>
                              <div className="text-xs mt-1">
                                {Array.from(new Set(logs.map(log => log.location))).length} locations
                              </div>
                            </div>
                            
                            {index < array.length - 1 && (
                              <div className="flex-shrink-0">
                                <svg width="30" height="24" className="text-gray-400">
                                  <line x1="0" y1="12" x2="30" y2="12" stroke="currentColor" strokeWidth="2" strokeDasharray="2,2" />
                                  <polygon points="30,12 22,6 22,18" fill="currentColor" />
                                </svg>
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                    </div>
                  </div>
                  
                  {/* Shared entities across episodes */}
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Shared Entities Across Episodes</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {['location', 'activity', 'resource'].map(entityType => {
                        // Find entities that appear in multiple episodes
                        const entityCounts: Record<string, string[]> = {};
                        
                        Object.entries(episodes).forEach(([episodeId, logs]) => {
                          logs.forEach(log => {
                            let entityValue: string | undefined;
                            
                            switch(entityType) {
                              case 'location': entityValue = log.location; break;
                              case 'activity': entityValue = log.activityType; break;
                              case 'resource': entityValue = log.material; break;
                            }
                            
                            if (entityValue) {
                              if (!entityCounts[entityValue]) {
                                entityCounts[entityValue] = [];
                              }
                              if (!entityCounts[entityValue].includes(episodeId)) {
                                entityCounts[entityValue].push(episodeId);
                              }
                            }
                          });
                        });
                        
                        // Filter to only entities that appear in multiple episodes
                        const sharedEntities = Object.entries(entityCounts)
                          .filter(([_, episodes]) => episodes.length > 1)
                          .sort((a, b) => b[1].length - a[1].length);
                        
                        return (
                          <div key={entityType} className="glass p-3 rounded-lg">
                            <div className="flex items-center mb-2">
                              <span className="mr-2">{typeToEmoji[entityType as keyof typeof typeToEmoji]}</span>
                              <span className="font-medium capitalize">{entityType}s</span>
                            </div>
                            
                            {sharedEntities.length > 0 ? (
                              <div className="space-y-2">
                                {sharedEntities.slice(0, 5).map(([entity, episodes]) => (
                                  <div key={entity} className="text-sm flex justify-between">
                                    <span>{entity}</span>
                                    <Badge variant="secondary">{episodes.length} episodes</Badge>
                                  </div>
                                ))}
                                {sharedEntities.length > 5 && (
                                  <div className="text-xs text-center text-gray-500">
                                    +{sharedEntities.length - 5} more...
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                No shared {entityType}s found
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkVisualization;
