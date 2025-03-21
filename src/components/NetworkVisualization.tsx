
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogEntry } from '@/lib/types';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

interface NetworkVisualizationProps {
  logs: LogEntry[];
}

interface Node {
  id: string;
  group: string;
  label: string;
  type: string;
  size: number;
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

  // Process logs to create network data
  useEffect(() => {
    if (!logs || logs.length === 0) return;

    // Create nodes for each unique entity
    const allNodes: Node[] = [];
    const allLinks: Link[] = [];
    const locationNodes: Set<string> = new Set();
    const activityNodes: Set<string> = new Set();
    const resourceNodes: Set<string> = new Set();
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
          size: 25
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
          size: 20
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
          size: 15
        });
      }
      
      if (log.equipment && !resourceNodes.has(log.equipment)) {
        resourceNodes.add(log.equipment);
        allNodes.push({
          id: `equip-${log.equipment}`,
          group: 'equipment',
          label: log.equipment,
          type: 'equipment',
          size: 15
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
          size: 18
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
        size: 10
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

    // Define color scale
    const colorScale = d3.scaleOrdinal()
      .domain(['location', 'activity', 'resource', 'equipment', 'personnel', 'log'])
      .range(['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444']);

    // Create simulation
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(70)
      )
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size * 1.5));

    // Create link elements
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke-width', (d: any) => Math.sqrt(d.value))
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6);

    // Create node elements
    const node = svg.append('g')
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    // Add circles for each node
    node.append('circle')
      .attr('r', (d: any) => d.size)
      .attr('fill', (d: any) => colorScale(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add labels for nodes
    node.append('text')
      .attr('dy', (d: any) => d.size + 8)
      .attr('text-anchor', 'middle')
      .text((d: any) => d.label)
      .attr('font-size', '10px')
      .attr('fill', '#333');

    // Add title for hover tooltip
    node.append('title')
      .text((d: any) => `${d.label} (${d.type})`);

    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
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
      .attr('transform', 'translate(20, 20)');

    const legendData = [
      { type: 'location', label: 'Location' },
      { type: 'activity', label: 'Activity' },
      { type: 'resource', label: 'Resource' },
      { type: 'equipment', label: 'Equipment' },
      { type: 'personnel', label: 'Personnel' },
      { type: 'log', label: 'Log Entry' }
    ];

    legendData.forEach((item, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendItem.append('circle')
        .attr('r', 6)
        .attr('fill', colorScale(item.type));

      legendItem.append('text')
        .attr('x', 15)
        .attr('y', 4)
        .text(item.label)
        .attr('font-size', '12px');
    });

    return () => {
      simulation.stop();
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
        <h2 className="text-lg font-medium">Network Visualization</h2>
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
