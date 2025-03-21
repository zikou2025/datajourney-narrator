import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogEntry } from '@/lib/types';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
}

interface Link {
  source: string;
  target: string;
  value: number;
  type: string;
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({ logs }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [storySteps, setStorySteps] = useState<{ nodes: Node[], links: Link[] }[]>([]);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  // Process logs to create network data
  useEffect(() => {
    if (!logs || logs.length === 0) return;

    // Create nodes for each unique entity
    const allNodes: Node[] = [];
    const allLinks: Link[] = [];
    const locationNodes: Set<string> = new Set();
    const activityNodes: Set<string> = new Set();
    const resourceNodes: Set<string> = new Set();
    const equipmentNodes: Set<string> = new Set();
    const personNodes: Set<string> = new Set();

    // Create location nodes
    logs.forEach(log => {
      if (!locationNodes.has(log.location)) {
        locationNodes.add(log.location);
        allNodes.push({
          id: `loc-${log.location}`,
          group: 'location',
          label: log.location,
          type: 'location',
          size: 30,
          icon: '🏢'
        });
      }
    });

    // Create activity nodes
    logs.forEach(log => {
      if (!activityNodes.has(log.activityType)) {
        activityNodes.add(log.activityType);
        allNodes.push({
          id: `act-${log.activityType}`,
          group: 'activity',
          label: log.activityType,
          type: 'activity',
          size: 25,
          icon: '⚙️'
        });
      }
    });

    // Create resource nodes
    logs.forEach(log => {
      if (log.material && !resourceNodes.has(log.material)) {
        resourceNodes.add(log.material);
        allNodes.push({
          id: `res-${log.material}`,
          group: 'resource',
          label: log.material,
          type: 'resource',
          size: 20,
          icon: '📦'
        });
      }
    });
    
    // Create equipment nodes
    logs.forEach(log => {
      if (log.equipment && !equipmentNodes.has(log.equipment)) {
        equipmentNodes.add(log.equipment);
        allNodes.push({
          id: `equip-${log.equipment}`,
          group: 'equipment',
          label: log.equipment,
          type: 'equipment',
          size: 22,
          icon: '🔧'
        });
      }
    });

    // Create personnel nodes
    logs.forEach(log => {
      if (log.personnel && !personNodes.has(log.personnel)) {
        personNodes.add(log.personnel);
        allNodes.push({
          id: `pers-${log.personnel}`,
          group: 'personnel',
          label: log.personnel,
          type: 'personnel',
          size: 24,
          icon: '👤'
        });
      }
    });

    // Create log nodes
    logs.forEach(log => {
      allNodes.push({
        id: `log-${log.id}`,
        group: 'log',
        label: log.activityType,
        type: 'log',
        size: 18,
        icon: '📝'
      });
    });

    // Create links between logs and other entities
    logs.forEach(log => {
      // Log to location
      allLinks.push({
        source: `log-${log.id}`,
        target: `loc-${log.location}`,
        value: 3,
        type: 'at'
      });

      // Log to activity
      allLinks.push({
        source: `log-${log.id}`,
        target: `act-${log.activityType}`,
        value: 2,
        type: 'is'
      });

      // Log to material
      if (log.material) {
        allLinks.push({
          source: `log-${log.id}`,
          target: `res-${log.material}`,
          value: 1,
          type: 'uses'
        });
      }

      // Log to equipment
      if (log.equipment) {
        allLinks.push({
          source: `log-${log.id}`,
          target: `equip-${log.equipment}`,
          value: 1,
          type: 'with'
        });
      }

      // Log to personnel
      if (log.personnel) {
        allLinks.push({
          source: `log-${log.id}`,
          target: `pers-${log.personnel}`,
          value: 1,
          type: 'by'
        });
      }
    });

    // Create animation story steps (progressive reveal)
    const steps = [];
    const increment = Math.max(1, Math.ceil(logs.length / 10)); // Show 10 steps max
    
    // First show locations
    steps.push({
      nodes: allNodes.filter(n => n.type === 'location'),
      links: []
    });
    
    // Then add activities
    steps.push({
      nodes: allNodes.filter(n => n.type === 'location' || n.type === 'activity'),
      links: allLinks.filter(l => 
        steps[0].nodes.some(n => n.id === l.source) || 
        steps[0].nodes.some(n => n.id === l.target)
      )
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
      
      const stepLinks = allLinks.filter(link => 
        stepNodes.some(n => n.id === link.source) && 
        stepNodes.some(n => n.id === link.target)
      );
      
      steps.push({ nodes: stepNodes, links: stepLinks });
    }

    setStorySteps(steps);
    setNodes(steps[0].nodes);
    setLinks(steps[0].links);
  }, [logs]);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Create SVG element
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Add radial gradient background
    const defs = svg.append('defs');
    
    // Create a radial gradient for the background
    const gradient = defs.append('radialGradient')
      .attr('id', 'network-background')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
      
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(79, 70, 229, 0.1)');
      
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(255, 255, 255, 0)');
    
    // Add the background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#network-background)');

    // Define color scale with better colors for entity types
    const colorScale = d3.scaleOrdinal()
      .domain(['location', 'activity', 'resource', 'equipment', 'personnel', 'log'])
      .range(['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444']);

    // Create simulation with improved forces
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(d => 100) // Longer distance to see connections better
      )
      .force('charge', d3.forceManyBody().strength(-180)) // Stronger repulsion
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size * 1.8)); // Larger collision radius

    // Create a group for the links
    const linkGroup = svg.append('g').attr('class', 'links');
    
    // Create link elements with gradients
    const link = linkGroup.selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('stroke', (d: any) => {
        // Create a unique gradient ID for each link
        const gradientId = `link-gradient-${d.source.id}-${d.target.id}`.replace(/[^a-zA-Z0-9]/g, '-');
        
        // Create gradient definition
        const linkGradient = defs.append('linearGradient')
          .attr('id', gradientId)
          .attr('gradientUnits', 'userSpaceOnUse');
        
        // Set gradient colors based on source and target node types
        linkGradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', (d: any) => {
            const sourceType = typeof d.source === 'object' ? d.source.type : 
              nodes.find(n => n.id === d.source)?.type || 'log';
            return colorScale(sourceType);
          });
        
        linkGradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', (d: any) => {
            const targetType = typeof d.target === 'object' ? d.target.type : 
              nodes.find(n => n.id === d.target)?.type || 'log';
            return colorScale(targetType);
          });
          
        return `url(#${gradientId})`;
      })
      .attr('stroke-width', (d: any) => Math.sqrt(d.value) * 1.5)
      .attr('stroke-opacity', 0.7)
      .attr('fill', 'none'); // Important for paths
      
    // Add subtle curve to links
    link.attr('stroke-dasharray', '4,2')
        .style('animation', 'dash 15s linear infinite');
        
    // Create a group for all nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes');
    
    // Create node elements - using groups for each node
    const node = nodeGroup.selectAll('.node')
      .data(nodes)
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
          return (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.2;
        })
        .attr('stroke-width', (l: any) => {
          return (l.source.id === d.id || l.target.id === d.id) 
            ? Math.sqrt(l.value) * 2.5 
            : Math.sqrt(l.value) * 1.5;
        });
        
        // Scale up the node slightly
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr('transform', (d: any) => `translate(${d.x},${d.y}) scale(1.2)`);
      })
      .on('mouseout', (event, d: any) => {
        setHoveredNode(null);
        
        // Reset link appearance
        link.attr('stroke-opacity', 0.7)
            .attr('stroke-width', (l: any) => Math.sqrt(l.value) * 1.5);
            
        // Reset node scale
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr('transform', (d: any) => `translate(${d.x},${d.y}) scale(1)`);
      });

    // Add decorative outer ring for each node
    node.append('circle')
      .attr('r', (d: any) => d.size + 5)
      .attr('fill', 'none')
      .attr('stroke', (d: any) => colorScale(d.type))
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.5)
      .attr('stroke-dasharray', '3,2');
      
    // Add glow effect for nodes
    node.append('circle')
      .attr('r', (d: any) => d.size)
      .attr('fill', (d: any) => colorScale(d.type))
      .attr('fill-opacity', 0.3)
      .attr('filter', 'url(#glow)');
      
    // Create a filter for the glow effect
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
      
    filter.append('feGaussianBlur')
      .attr('stdDeviation', 3)
      .attr('result', 'blur');
      
    filter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Add circle backgrounds for each node
    node.append('circle')
      .attr('r', (d: any) => d.size)
      .attr('fill', (d: any) => colorScale(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
      
    // Add icons if available
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('font-size', (d: any) => d.size * 0.7)
      .text((d: any) => d.icon || '');

    // Add labels for nodes
    node.append('text')
      .attr('dy', (d: any) => d.size + 15)
      .attr('text-anchor', 'middle')
      .text((d: any) => {
        const maxLength = 12;
        return d.label.length > maxLength 
          ? d.label.substring(0, maxLength) + '...' 
          : d.label;
      })
      .attr('font-size', '10px')
      .attr('fill', '#333')
      .attr('font-weight', 'bold')
      .attr('class', 'node-label');

    // Create animated paths for links
    function updateLinkPaths() {
      link.attr('d', (d: any) => {
        const dx = d.target.x - d.source.x,
              dy = d.target.y - d.source.y,
              dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // Add some curve
              
        // Create a curved path between nodes
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });
    }

    // Update positions on each tick
    simulation.on('tick', () => {
      // Keep nodes within bounds
      nodes.forEach((d: any) => {
        d.x = Math.max(d.size, Math.min(width - d.size, d.x));
        d.y = Math.max(d.size, Math.min(height - d.size, d.y));
      });
      
      // Update link paths
      updateLinkPaths();

      // Update node positions
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Define drag behavior functions
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
      d.fx = null;
      d.fy = null;
    }

    // Add legend
    const legend = svg.append('g')
      .attr('transform', 'translate(20, 20)')
      .attr('class', 'legend');

    const legendData = [
      { type: 'location', label: 'Location', icon: '🏢' },
      { type: 'activity', label: 'Activity', icon: '⚙️' },
      { type: 'resource', label: 'Resource', icon: '📦' },
      { type: 'equipment', label: 'Equipment', icon: '🔧' },
      { type: 'personnel', label: 'Personnel', icon: '👤' },
      { type: 'log', label: 'Log Entry', icon: '📝' }
    ];

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`);

    // Add icon background
    legendItems.append('circle')
      .attr('r', 8)
      .attr('fill', (d) => colorScale(d.type));

    // Add legend icons
    legendItems.append('text')
      .attr('x', 0)
      .attr('y', 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text(d => d.icon);

    // Add legend text
    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 4)
      .text(d => d.label)
      .attr('font-size', '12px')
      .attr('alignment-baseline', 'middle');

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes dash {
        to {
          stroke-dashoffset: 24;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      simulation.stop();
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    };
  }, [nodes, links]);

  // Animation controls
  const startAnimation = () => {
    setIsAnimating(true);
    animateStep();
  };

  const stopAnimation = () => {
    setIsAnimating(false);
  };

  const nextStep = () => {
    if (currentStep < storySteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setNodes(storySteps[currentStep + 1].nodes);
      setLinks(storySteps[currentStep + 1].links);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setNodes(storySteps[currentStep - 1].nodes);
      setLinks(storySteps[currentStep - 1].links);
    }
  };

  const animateStep = () => {
    if (isAnimating && currentStep < storySteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setNodes(storySteps[currentStep + 1].nodes);
      setLinks(storySteps[currentStep + 1].links);
      
      setTimeout(animateStep, 2000);
    } else {
      setIsAnimating(false);
    }
  };

  return (
    <div className="glass rounded-xl p-6 w-full h-[600px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium flex items-center">
          <svg className="w-5 h-5 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Network Analysis
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ml-2 text-muted-foreground">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">This visualization shows relationships between locations, activities, equipment, personnel, and materials in the log data.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h2>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={prevStep} disabled={currentStep === 0}>
            <SkipBack className="h-4 w-4" />
          </Button>
          
          {isAnimating ? (
            <Button size="sm" variant="outline" onClick={stopAnimation}>
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={startAnimation} disabled={currentStep === storySteps.length - 1}>
              <Play className="h-4 w-4" />
            </Button>
          )}
          
          <Button size="sm" variant="outline" onClick={nextStep} disabled={currentStep === storySteps.length - 1}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 relative">
        <svg ref={svgRef} className="w-full h-full" />
        
        {hoveredNode && (
          <div 
            className="absolute bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-200 z-10"
            style={{
              top: '20px',
              right: '20px',
              maxWidth: '250px'
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{hoveredNode.icon}</span>
              <h3 className="font-medium">{hoveredNode.label}</h3>
            </div>
            <p className="text-xs text-muted-foreground capitalize">Type: {hoveredNode.type}</p>
            {hoveredNode.type === 'log' && (
              <div className="mt-2 text-xs">
                <p>Activity related to {hoveredNode.label}</p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-2 text-sm text-center text-muted-foreground">
        {currentStep === 0 && "Starting with locations..."}
        {currentStep === 1 && "Adding activity types..."}
        {currentStep > 1 && currentStep < storySteps.length - 1 && `Showing log entries ${currentStep - 1}/${storySteps.length - 2}...`}
        {currentStep === storySteps.length - 1 && "Complete network visualization"}
      </div>
    </div>
  );
};

export default NetworkVisualization;
