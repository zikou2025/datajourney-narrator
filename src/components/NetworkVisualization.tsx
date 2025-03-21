
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogEntry } from '@/lib/types';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack, Info, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";

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
}

interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
  type: string;
}

const typeToEmoji: Record<string, string> = {
  'location': '🏢',
  'activity': '⚙️',
  'resource': '📦',
  'equipment': '🔧',
  'personnel': '👤',
  'log': '📝'
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
  const [colorMode, setColorMode] = useState<'category' | 'connectivity'>('category');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTypes, setFilteredTypes] = useState<string[]>([]);
  
  const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);
  
  // Generate network data from logs
  useEffect(() => {
    if (!logs || logs.length === 0) return;
    
    // Create nodes for each unique entity
    const allNodes: Node[] = [];
    const allLinks: Link[] = [];
    const uniqueEntities: Record<string, Set<string>> = {
      location: new Set(),
      activity: new Set(),
      resource: new Set(),
      equipment: new Set(),
      personnel: new Set()
    };

    // Create entity nodes first
    logs.forEach(log => {
      // Process location
      if (!uniqueEntities.location.has(log.location)) {
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
    });

    // Create log nodes and links
    logs.forEach(log => {
      // Add log node
      const logNode: Node = {
        id: `log-${log.id}`,
        group: 'log',
        label: `Log #${log.id}`,
        type: 'log',
        size: 20,
        icon: typeToEmoji.log
      };
      allNodes.push(logNode);
      
      // Create links between log and other entities
      allLinks.push({
        source: `log-${log.id}`,
        target: `loc-${log.location}`,
        value: 3,
        type: 'at'
      });
      
      allLinks.push({
        source: `log-${log.id}`,
        target: `act-${log.activityType}`,
        value: 2,
        type: 'is'
      });
      
      if (log.material) {
        allLinks.push({
          source: `log-${log.id}`,
          target: `res-${log.material}`,
          value: 1,
          type: 'uses'
        });
      }
      
      if (log.equipment) {
        allLinks.push({
          source: `log-${log.id}`,
          target: `equip-${log.equipment}`,
          value: 1,
          type: 'with'
        });
      }
      
      if (log.personnel) {
        allLinks.push({
          source: `log-${log.id}`,
          target: `pers-${log.personnel}`,
          value: 1,
          type: 'by'
        });
      }
    });

    // Create animated story progression
    const steps = [];
    const increment = Math.max(1, Math.ceil(logs.length / 12)); // Show 12 steps max
    
    // First show locations
    steps.push({
      nodes: allNodes.filter(n => n.type === 'location'),
      links: []
    });
    
    // Then add activities
    steps.push({
      nodes: allNodes.filter(n => n.type === 'location' || n.type === 'activity'),
      links: allLinks.filter(l => {
        const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
        const targetId = typeof l.target === 'string' ? l.target : l.target.id;
        return steps[0].nodes.some(n => n.id === sourceId) || 
               steps[0].nodes.some(n => n.id === targetId);
      })
    });
    
    // Progressive reveal of logs
    for (let i = 0; i < logs.length; i += increment) {
      const logsSubset = logs.slice(0, i + increment);
      const logNodeIds = logsSubset.map(log => `log-${log.id}`);
      
      const stepNodes = allNodes.filter(node => 
        node.type === 'location' || 
        node.type === 'activity' || 
        logNodeIds.includes(node.id) ||
        logsSubset.some(log => 
          (node.type === 'resource' && node.label === log.material) ||
          (node.type === 'equipment' && node.label === log.equipment) ||
          (node.type === 'personnel' && node.label === log.personnel)
        )
      );
      
      const stepLinks = allLinks.filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        return stepNodes.some(n => n.id === sourceId) && 
               stepNodes.some(n => n.id === targetId);
      });
      
      steps.push({ nodes: stepNodes, links: stepLinks });
    }

    setStorySteps(steps);
    setNodes(steps[0].nodes);
    setLinks(steps[0].links);
  }, [logs]);

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

  // Create and update visualization
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || filteredNodes.length === 0) return;

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
      .attr('stop-color', 'rgba(99, 102, 241, 0.08)');
      
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(255, 255, 255, 0)');
    
    // Add the background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#network-background)');

    // Create filter for the glow effect
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('width', '300%')
      .attr('height', '300%')
      .attr('x', '-100%')
      .attr('y', '-100%');
      
    filter.append('feGaussianBlur')
      .attr('stdDeviation', 3)
      .attr('result', 'blur');
      
    filter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');
      
    // Create pulse animation filter
    const pulseFilter = defs.append('filter')
      .attr('id', 'pulse')
      .attr('width', '300%')
      .attr('height', '300%')
      .attr('x', '-100%')
      .attr('y', '-100%');
      
    const pulseAnimation = pulseFilter.append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', 2)
      .attr('result', 'blur');
      
    // Add animated values for pulse effect
    const animate = pulseAnimation.append('animate')
      .attr('attributeName', 'stdDeviation')
      .attr('values', '1;3;1')
      .attr('dur', '2s')
      .attr('repeatCount', 'indefinite');

    // Define color scale
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['location', 'activity', 'resource', 'equipment', 'personnel', 'log'])
      .range(['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444']);
      
    // Define connectivity color scale (blue to red heat)
    const connectivityColorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([0, d3.max(Object.values(nodeConnectivity)) || 10]);

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

    // Create container for links
    const linkGroup = zoomContainer.append('g').attr('class', 'links');
    
    // Create link elements with gradients
    const link = linkGroup.selectAll('path')
      .data(filteredLinks)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('marker-end', 'url(#arrowhead)')
      .attr('stroke', (d: any) => {
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
          .attr('stop-color', colorScale(sourceType));
        
        linkGradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', colorScale(targetType));
          
        return `url(#${gradientId})`;
      })
      .attr('stroke-width', (d: any) => Math.sqrt(d.value) * 1.8)
      .attr('stroke-opacity', 0.6)
      .attr('fill', 'none')
      .attr('stroke-dasharray', '5,3')
      .attr('stroke-linecap', 'round');

    // Create animated flow effect
    link.append('animate')
      .attr('attributeName', 'stroke-dashoffset')
      .attr('from', 0)
      .attr('to', 20)
      .attr('dur', '1.5s')
      .attr('repeatCount', 'indefinite');
            
    // Create container for nodes
    const nodeGroup = zoomContainer.append('g').attr('class', 'nodes');
    
    // Create node elements
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
          });
        
        // Scale up the node slightly
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr('transform', (d: any) => `translate(${d.x},${d.y}) scale(1.3)`);
      })
      .on('mouseout', (event, d: any) => {
        if (!selectedNode) {
          setHoveredNode(null);
          
          // Reset link appearance
          link.attr('stroke-opacity', 0.6)
              .attr('stroke-width', (l: any) => Math.sqrt(l.value) * 1.8);
              
          // Reset node classes
          node.classed('connected', false);
          node.classed('dimmed', false);
          
          // Reset label visibility
          node.select('.node-label')
            .attr('opacity', showNodeLabels ? 1 : 0);
        }
        
        // Reset node scale
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr('transform', (d: any) => `translate(${d.x},${d.y}) scale(1)`);
      })
      .on('click', (event, d: any) => {
        if (selectedNode && selectedNode.id === d.id) {
          setSelectedNode(null);
          
          // Reset link appearance
          link.attr('stroke-opacity', 0.6)
              .attr('stroke-width', (l: any) => Math.sqrt(l.value) * 1.8);
              
          // Reset node classes
          node.classed('connected', false);
          node.classed('dimmed', false);
          
          // Reset label visibility
          node.select('.node-label')
            .attr('opacity', showNodeLabels ? 1 : 0);
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
          });
        }
      });

    // Add outer glow for nodes
    node.append('circle')
      .attr('r', (d: any) => d.size + 8)
      .attr('fill', (d: any) => {
        return colorMode === 'category' 
          ? colorScale(d.type) 
          : connectivityColorScale(nodeConnectivity[d.id] || 0);
      })
      .attr('fill-opacity', 0.2)
      .attr('filter', 'url(#glow)');
    
    // Add outer ring 
    node.append('circle')
      .attr('r', (d: any) => d.size + 3)
      .attr('fill', 'none')
      .attr('stroke', (d: any) => {
        return colorMode === 'category' 
          ? colorScale(d.type) 
          : connectivityColorScale(nodeConnectivity[d.id] || 0);
      })
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', '6,3');
      
    // Add node background
    node.append('circle')
      .attr('r', (d: any) => d.size)
      .attr('fill', (d: any) => {
        return colorMode === 'category' 
          ? colorScale(d.type) 
          : connectivityColorScale(nodeConnectivity[d.id] || 0);
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('class', 'node-circle');
      
    // Apply pulse effect to selected or searched nodes
    node.each(function(d: any) {
      if (searchTerm && d.label.toLowerCase().includes(searchTerm.toLowerCase())) {
        d3.select(this).select('.node-circle')
          .attr('filter', 'url(#pulse)');
      }
    });
      
    // Add icons
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('font-size', (d: any) => d.size * 0.7)
      .text((d: any) => d.icon || '');

    // Add labels for nodes
    node.append('text')
      .attr('class', 'node-label')
      .attr('dy', (d: any) => d.size + 18)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#333')
      .attr('font-weight', 'bold')
      .attr('opacity', showNodeLabels ? 1 : 0)
      .attr('pointer-events', 'none')
      .text((d: any) => {
        const maxLength = 14;
        return d.label.length > maxLength 
          ? d.label.substring(0, maxLength) + '...' 
          : d.label;
      });

    // Create count labels for nodes with multiple connections
    node.append('circle')
      .filter(d => (nodeConnectivity[d.id] || 0) > 1)
      .attr('r', 10)
      .attr('cx', (d: any) => d.size * 0.8)
      .attr('cy', (d: any) => -d.size * 0.8)
      .attr('fill', '#374151')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);
      
    node.append('text')
      .filter(d => (nodeConnectivity[d.id] || 0) > 1)
      .attr('x', (d: any) => d.size * 0.8)
      .attr('y', (d: any) => -d.size * 0.8)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '9px')
      .attr('fill', '#fff')
      .attr('font-weight', 'bold')
      .text(d => nodeConnectivity[d.id] || 0);

    // Update link paths function
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
        
        return `M${adjustedSourceX},${adjustedSourceY}A${dr},${dr} 0 0,1 ${adjustedTargetX},${adjustedTargetY}`;
      });
    }

    // Create a force simulation
    const simulation = d3.forceSimulation(filteredNodes as d3.SimulationNodeDatum[])

.force('link', d3.forceLink(filteredLinks)
  .id((d: any) => d.id)
  .distance((d: any) => {
    // Adjust link distance based on node types and connection strength
    const sourceType = typeof d.source === 'object' ? d.source.type : 
      filteredNodes.find(n => n.id === d.source)?.type;
    const targetType = typeof d.target === 'object' ? d.target.type : 
      filteredNodes.find(n => n.id === d.target)?.type;
      
    // Default distance, modified by node types
    let distance = 100;
    
    // Adjust based on relationship strength
    distance += 30 / d.value;
    
    // Shorter distance for nodes of the same type
    if (sourceType === targetType) {
      distance *= 0.8;
    }
    
    // Special case for log nodes
    if (sourceType === 'log' || targetType === 'log') {
      distance *= 0.9;
    }
    
    return distance;
  })
  .strength(0.6))
  .force('charge', d3.forceManyBody()
    .strength((d: any) => -d.size * 15))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide()
    .radius((d: any) => d.size * 1.5))
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

// Cleanup function
return () => {
  if (simulation) simulation.stop();
};
}, [filteredNodes, filteredLinks, showNodeLabels, colorMode, nodeConnectivity, searchTerm, simulationPaused, selectedNode]);

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
};

const handleToggleSimulation = () => {
  setSimulationPaused(!simulationPaused);
};

const handleToggleLabels = () => {
  setShowNodeLabels(!showNodeLabels);
};

const handleToggleColorMode = () => {
  setColorMode(prev => prev === 'category' ? 'connectivity' : 'category');
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

return (
  <div className="flex flex-col h-full">
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
                onClick={handleToggleLabels}>
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showNodeLabels ? "Hide Labels" : "Show Labels"}
            </TooltipContent>
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
    
    <div className="flex mb-4">
      <input
        type="text"
        placeholder="Search nodes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="px-3 py-1 border rounded-md mr-2 flex-grow"
      />
      
      <div className="flex space-x-1">
        {['location', 'activity', 'resource', 'equipment', 'personnel', 'log'].map(type => (
          <Button
            key={type}
            variant={filteredTypes.includes(type) ? "default" : "outline"}
            size="sm"
            onClick={() => handleTypeFilter(type)}
            className="text-xs"
          >
            {typeToEmoji[type as keyof typeof typeToEmoji]} {type}
          </Button>
        ))}
      </div>
    </div>
    
    <div className="relative flex-grow bg-gray-50 rounded-lg shadow-inner overflow-hidden" ref={containerRef}>
      <svg 
        ref={svgRef} 
        className="w-full h-full cursor-move"
      />
      
      {/* Hover tooltip */}
      {hoveredNode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-4 bottom-4 bg-white p-3 rounded-lg shadow-lg max-w-xs"
        >
          <div className="flex items-center mb-2">
            <span className="text-lg mr-2">{hoveredNode.icon}</span>
            <h3 className="font-bold text-lg">{hoveredNode.label}</h3>
          </div>
          <p><span className="font-semibold">Type:</span> {hoveredNode.type}</p>
          <p><span className="font-semibold">Connections:</span> {nodeConnectivity[hoveredNode.id] || 0}</p>
          {hoveredNode.type === 'log' && logs.find(log => `log-${log.id}` === hoveredNode.id) && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-sm italic">Click to view details</p>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Selected node detailed view */}
      {selectedNode && selectedNode.type === 'log' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute right-4 top-4 bg-white p-4 rounded-lg shadow-lg max-w-sm"
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
  </div>
);
};

export default NetworkVisualization;
