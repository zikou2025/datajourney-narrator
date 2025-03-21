import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  useReducer,
} from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { LogEntry } from '@/lib/types'; // Assuming this is your log entry type
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';

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
  source: string; // Now using IDs directly
  target: string; // Now using IDs directly
  value: number;
  type: string;
}

// Moved typeToEmoji here so it is not recreated every render
const typeToEmoji: Record<string, string> = {
  location: '🏢',
  activity: '⚙️',
  resource: '📦',
  equipment: '🔧',
  personnel: '👤',
  log: '📝',
};

interface State {
  currentStep: number;
  isAnimating: boolean;
  simulationPaused: boolean;
  showNodeLabels: boolean;
  colorMode: 'category' | 'connectivity';
  searchTerm: string;
  filteredTypes: string[];
  selectedNodeId: string | null; // Store ID for selected node
}

type Action =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'TOGGLE_ANIMATION' }
  | { type: 'TOGGLE_SIMULATION' }
  | { type: 'TOGGLE_LABELS' }
  | { type: 'TOGGLE_COLOR_MODE' }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'TOGGLE_FILTER_TYPE'; payload: string }
  | { type: 'SET_SELECTED_NODE'; payload: string | null };

const initialState: State = {
  currentStep: 0,
  isAnimating: false,
  simulationPaused: false,
  showNodeLabels: true,
  colorMode: 'category',
  searchTerm: '',
  filteredTypes: [],
  selectedNodeId: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'TOGGLE_ANIMATION':
      return { ...state, isAnimating: !state.isAnimating };
    case 'TOGGLE_SIMULATION':
      return { ...state, simulationPaused: !state.simulationPaused };
    case 'TOGGLE_LABELS':
      return { ...state, showNodeLabels: !state.showNodeLabels };
    case 'TOGGLE_COLOR_MODE':
      return {
        ...state,
        colorMode: state.colorMode === 'category' ? 'connectivity' : 'category',
      };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'TOGGLE_FILTER_TYPE': {
      const type = action.payload;
      const filteredTypes = state.filteredTypes.includes(type)
        ? state.filteredTypes.filter(t => t !== type)
        : [...state.filteredTypes, type];
      return { ...state, filteredTypes };
    }
    case 'SET_SELECTED_NODE':
      return { ...state, selectedNodeId: action.payload };
    default:
      return state;
  }
};

interface NetworkVisualizationProps {
  logs: LogEntry[];
}

// Memoized NetworkNode Component
const NetworkNode = React.memo(
  ({
    node,
    colorMode,
    nodeConnectivity,
    hoveredNodeId,
    selectedNodeId,
    searchTerm,
  }: {
    node: Node;
    colorMode: 'category' | 'connectivity';
    nodeConnectivity: Record<string, number>;
    hoveredNodeId: string | null;
    selectedNodeId: string | null;
    searchTerm: string;
  }) => {
    const isHovered = node.id === hoveredNodeId;
    const isSelected = node.id === selectedNodeId;
    const colorScale = useMemo(
      () =>
        d3
          .scaleOrdinal<string>()
          .domain([
            'location',
            'activity',
            'resource',
            'equipment',
            'personnel',
            'log',
          ])
          .range([
            '#4f46e5',
            '#10b981',
            '#f59e0b',
            '#3b82f6',
            '#8b5cf6',
            '#ef4444',
          ]),
      []
    ); // Fixed scale
    const connectivityColorScale = useMemo(
      () => d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 10]),
      []
    );
    const isHighlighted =
      (searchTerm && node.label.toLowerCase().includes(searchTerm.toLowerCase())) ||
      isSelected ||
      isHovered;

    return (
      <g
        className={`node ${isHighlighted ? 'highlighted' : ''}`}
        transform={`translate(${node.x},${node.y})`}
        aria-label={node.label} // Accessibility: label for the node
        tabIndex={0}
      >
        {/* Outer glow */}
        <circle
          r={node.size + 8}
          fill={
            colorMode === 'category'
              ? colorScale(node.type)
              : connectivityColorScale(nodeConnectivity[node.id] || 0)
          }
          fillOpacity={0.2}
          filter="url(#glow)"
        />

        {/* Outer Ring */}
        <circle
          r={node.size + 3}
          fill="none"
          stroke={
            colorMode === 'category'
              ? colorScale(node.type)
              : connectivityColorScale(nodeConnectivity[node.id] || 0)
          }
          strokeWidth={1.5}
          strokeOpacity={0.6}
          strokeDasharray="6,3"
        />

        {/* Node Background */}
        <circle
          r={node.size}
          fill={
            colorMode === 'category'
              ? colorScale(node.type)
              : connectivityColorScale(nodeConnectivity[node.id] || 0)
          }
          stroke="#fff"
          strokeWidth={2}
          className="node-circle"
          filter={
            searchTerm && node.label.toLowerCase().includes(searchTerm.toLowerCase())
              ? 'url(#pulse)'
              : undefined
          }
        />

        {/* Icon */}
        <text
          textAnchor="middle"
          dy="0.3em"
          fontSize={node.size * 0.7}
          aria-hidden="true"
        >
          {node.icon || ''}
        </text>

        {/* Label */}
        <text
          className="node-label"
          dy={node.size + 18}
          textAnchor="middle"
          fontSize="11px"
          fill="#333"
          fontWeight="bold"
          opacity={1} // Show labels by default (controlled by state)
          pointerEvents="none"
        >
          {node.label.length > 14 ? node.label.substring(0, 14) + '...' : node.label}
        </text>

        {/* Count Circle */}
        {nodeConnectivity[node.id] && nodeConnectivity[node.id] > 1 && (
          <>
            <circle
              r={10}
              cx={node.size * 0.8}
              cy={-node.size * 0.8}
              fill="#374151"
              stroke="#fff"
              strokeWidth={1}
            />
            <text
              x={node.size * 0.8}
              y={-node.size * 0.8}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="9px"
              fill="#fff"
              fontWeight="bold"
              aria-hidden="true"
            >
              {nodeConnectivity[node.id]}
            </text>
          </>
        )}
      </g>
    );
  }
);

// Memoized NetworkLink Component
const NetworkLink = React.memo(
  ({
    link,
    nodes,
    colorScale,
  }: {
    link: Link;
    nodes: Record<string, Node>;
    colorScale: d3.ScaleOrdinal<string, string, never>;
  }) => {
    // Define arrow marker for directed links
    const source = nodes[link.source];
    const target = nodes[link.target];

    if (!source || !target) {
      return null; // Handle cases where source or target is missing
    }

    const dx = target.x! - source.x!;
    const dy = target.y! - source.y!;
    const dr = Math.sqrt(dx * dx + dy * dy) * 1.2; // Curve radius
    const angle = Math.atan2(dy, dx);
    const sourceRadius = source.size;
    const targetRadius = target.size;

    const sourceOffsetX = Math.cos(angle) * sourceRadius;
    const sourceOffsetY = Math.sin(angle) * sourceRadius;
    const targetOffsetX = Math.cos(angle) * (targetRadius + 5); // +5 for arrowhead
    const targetOffsetY = Math.sin(angle) * (targetRadius + 5);

    const adjustedSourceX = source.x! + sourceOffsetX;
    const adjustedSourceY = source.y! + sourceOffsetY;
    const adjustedTargetX = target.x! - targetOffsetX;
    const adjustedTargetY = target.y! - targetOffsetY;

    const gradientId = `link-gradient-${source.id}-${target.id}`.replace(
      /[^a-zA-Z0-9]/g,
      '-'
    ); // Unique gradient ID
    return (
      <path
        className="link"
        markerEnd="url(#arrowhead)"
        stroke={`url(#${gradientId})`}
        strokeWidth={Math.sqrt(link.value) * 1.8}
        strokeOpacity={0.6}
        fill="none"
        strokeDasharray="5,3"
        strokeLinecap="round"
        d={`M${adjustedSourceX},${adjustedSourceY}A${dr},${dr} 0 0,1 ${adjustedTargetX},${adjustedTargetY}`}
      >
        <animate
          attributeName="stroke-dashoffset"
          from={0}
          to={20}
          dur="1.5s"
          repeatCount="indefinite"
        />
      </path>
    );
  }
);

// Network Component (D3.js rendering)
const Network = React.memo(
  ({
    nodes,
    links,
    showNodeLabels,
    colorMode,
    nodeConnectivity,
    searchTerm,
    selectedNodeId,
    hoveredNodeId,
    setHoveredNodeId,
    onNodeClick,
    simulationPaused,
  }: {
    nodes: Node[];
    links: Link[];
    showNodeLabels: boolean;
    colorMode: 'category' | 'connectivity';
    nodeConnectivity: Record<string, number>;
    searchTerm: string;
    selectedNodeId: string | null;
    hoveredNodeId: string | null;
    setHoveredNodeId: (nodeId: string | null) => void;
    onNodeClick: (nodeId: string) => void;
    simulationPaused: boolean;
  }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const simulationRef = useRef<
      d3.Simulation<d3.SimulationNodeDatum, undefined> | null
    >(null);

    const colorScale = useMemo(
      () =>
        d3
          .scaleOrdinal<string>()
          .domain([
            'location',
            'activity',
            'resource',
            'equipment',
            'personnel',
            'log',
          ])
          .range([
            '#4f46e5',
            '#10b981',
            '#f59e0b',
            '#3b82f6',
            '#8b5cf6',
            '#ef4444',
          ]),
      []
    );

    useEffect(() => {
      if (!svgRef.current || !containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      // Select the SVG and clear it
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();

      const zoomContainer = svg.append('g');

      // Set up zoom behavior
      const zoom = d3.zoom().scaleExtent([0.3, 5]);

      const zoomed = (transform: d3.Transform) => {
        zoomContainer.attr('transform', transform.toString());
      };

      zoom.on('zoom', ({ transform }) => zoomed(transform));

      svg.call(zoom as any);

      // Add definitions for effects
      const defs = svg.append('defs');

      // Create radial gradient for background
      const gradient = defs
        .append('radialGradient')
        .attr('id', 'network-background')
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '70%');

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'rgba(99, 102, 241, 0.08)');

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'rgba(255, 255, 255, 0)');

      // Add the background
      svg
        .append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'url(#network-background)');

      // Create filter for the glow effect
      const filter = defs
        .append('filter')
        .attr('id', 'glow')
        .attr('width', '300%')
        .attr('height', '300%')
        .attr('x', '-100%')
        .attr('y', '-100%');

      filter
        .append('feGaussianBlur')
        .attr('stdDeviation', 3)
        .attr('result', 'blur');

      filter
        .append('feComposite')
        .attr('in', 'SourceGraphic')
        .attr('in2', 'blur')
        .attr('operator', 'over');

      // Create pulse animation filter
      const pulseFilter = defs
        .append('filter')
        .attr('id', 'pulse')
        .attr('width', '300%')
        .attr('height', '300%')
        .attr('x', '-100%')
        .attr('y', '-100%');

      const pulseAnimation = pulseFilter
        .append('feGaussianBlur')
        .attr('in', 'SourceGraphic')
        .attr('stdDeviation', 2)
        .attr('result', 'blur');

      // Add animated values for pulse effect
      pulseAnimation
        .append('animate')
        .attr('attributeName', 'stdDeviation')
        .attr('values', '1;3;1')
        .attr('dur', '2s')
        .attr('repeatCount', 'indefinite');

      // Create arrow marker for directed links
      defs
        .append('marker')
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

      // Define gradients for each link
      const gradients = defs
        .selectAll('linearGradient')
        .data(links, (d: any) => `link-gradient-${d.source}-${d.target}`)
        .enter()
        .append('linearGradient')
        .attr('id', (d: any) => {
          const source = nodes.find(n => n.id === d.source)?.type || 'log';
          const target = nodes.find(n => n.id === d.target)?.type || 'log';
          return `link-gradient-${source}-${target}`;
        })
        .attr('gradientUnits', 'userSpaceOnUse');

      gradients
        .append('stop')
        .attr('offset', '0%')
        .attr(
          'stop-color',
          (d: any) =>
            colorScale(nodes.find(n => n.id === d.source)?.type || 'log') || '#ccc'
        );
      gradients
        .append('stop')
        .attr('offset', '100%')
        .attr(
          'stop-color',
          (d: any) =>
            colorScale(nodes.find(n => n.id === d.target)?.type || 'log') || '#ccc'
        );

      // Create container for links
      const linkGroup = zoomContainer.append('g').attr('class', 'links');
      const nodeMap: Record<string, Node> = nodes.reduce((acc, node) => {
        acc[node.id] = node;
        return acc;
      }, {});

      // Create container for nodes
      const nodeGroup = zoomContainer.append('g').attr('class', 'nodes');

      // Create node elements
      const d3Nodes = nodeGroup
        .selectAll('.node')
        .data(nodes, (d: any) => d.id) // Key function for data join
        .join(
          enter => {
            const g = enter
              .append('g')
              .attr('class', 'node')
              .call(drag(simulationRef));

            // Add node background
            g.append('circle')
              .attr('r', (d: any) => d.size)
              .attr('fill', (d: any) => {
                return colorMode === 'category'
                  ? colorScale(d.type)
                  : colorScale(d.type);
              })
              .attr('stroke', '#fff')
              .attr('stroke-width', 2)
              .attr('class', 'node-circle');

            return g;
          },
          update => update,
          exit => exit.remove()
        )
        .on('mouseover', (event: any, d: Node) => {
          setHoveredNodeId(d.id);
        })
        .on('mouseout', () => {
          setHoveredNodeId(null);
        })
        .on('click', (event: any, d: Node) => {
          onNodeClick(d.id);
        });

      const drag = (simulationRef: any) => {
        const dragstarted = (event: any, d: any) => {
          if (!event.active) simulationRef.current.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        };

        const dragged = (event: any, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        };

        const dragended = (event: any, d: any) => {
          if (!event.active) simulationRef.current.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        };

        return d3
          .drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended);
      };

      // Key function for data join
      const d3Links = linkGroup
        .selectAll('.link')
        .data(links, (d: any) => `${d.source}-${d.target}`)
        .join(
          enter => {
            const link = enter.append('path');
            return link;
          },
          update => update,
          exit => exit.remove()
        )
        .attr('class', 'link')
        .attr('marker-end', 'url(#arrowhead)');

      // Create a force simulation
      const simulation = d3
        .forceSimulation(nodes as d3.SimulationNodeDatum[])
        .force(
          'link',
          d3
            .forceLink(links)
            .id((d: any) => d.id)
            .distance((d: any) => {
              // Adjust link distance based on node types and connection strength
              const source = nodes.find(n => n.id === d.source);
              const target = nodes.find(n => n.id === d.target);

              if (!source || !target) {
                return 50;
              }

              const sourceType = source.type;
              const targetType = target.type;

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
            .strength(0.6)
        )
        .force('charge', d3.forceManyBody().strength((d: any) => -d.size * 15))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force(
          'collision',
          d3.forceCollide().radius((d: any) => d.size * 1.5)
        )
        .on('tick', () => {
          // Constrain nodes to view area with padding
          const padding = 50;
          nodes.forEach((d: any) => {
            d.x = Math.max(padding, Math.min(width - padding, d.x));
            d.y = Math.max(padding, Math.min(height - padding, d.y));
          });

          // Update node positions
          d3Nodes.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

          // Update link paths
          d3Links.attr('d', (d: any) => {
            const source = nodeMap[d.source];
            const target = nodeMap[d.target];

            if (!source || !target) {
              return ''; // Return empty string if source or target doesn't exist
            }

            const dx = target.x! - source.x!;
            const dy = target.y! - source.y!;
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
            const angle = Math.atan2(dy, dx);

            const sourceRadius = source.size;
            const targetRadius = target.size;

            const sourceOffsetX = Math.cos(angle) * sourceRadius;
            const sourceOffsetY = Math.sin(angle) * sourceRadius;
            const targetOffsetX = Math.cos(angle) * (targetRadius + 5); // +5 for arrowhead
            const targetOffsetY = Math.sin(angle) * (targetRadius + 5);

            const adjustedSourceX = source.x! + sourceOffsetX;
            const adjustedSourceY = source.y! + sourceOffsetY;
            const adjustedTargetX = target.x! - targetOffsetX;
            const adjustedTargetY = target.y! - targetOffsetY;

            return `M${adjustedSourceX},${adjustedSourceY}A${dr},${dr} 0 0,1 ${adjustedTargetX},${adjustedTargetY}`;
          });
        });

      // Store simulation for updates
      simulationRef.current = simulation;

      const autoZoom = () => {
        if (
          !svgRef.current ||
          !containerRef.current ||
          nodes.length === 0
        ) {
          return;
        }

        // Compute bounds
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        nodes.forEach((d: any) => {
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
        svg
          .transition()
          .duration(750)
          .call(
            zoom.transform as any,
            d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(scale)
              .translate(-centerX, -centerY)
          );
      };

      setTimeout(autoZoom, 100);
      // Pause or resume simulation
      if (simulationPaused) {
        simulation.stop();
      } else {
        simulation.alphaTarget(0.1).restart();
      }

      // Cleanup function
      return () => {
        if (simulation) simulation.stop();
      };
    }, [
      nodes,
      links,
      showNodeLabels,
      colorMode,
      nodeConnectivity,
      searchTerm,
      simulationPaused,
      selectedNodeId,
    ]);

    const nodeMap: Record<string, Node> = useMemo(() => {
      return nodes.reduce((acc, node) => {
        acc[node.id] = node;
        return acc;
      }, {});
    }, [nodes]);

    return (
      <div
        className="relative flex-grow bg-gray-50 rounded-lg shadow-inner overflow-hidden"
        ref={containerRef}
      >
        <svg
          ref={svgRef}
          className="w-full h-full cursor-move"
          aria-label="Network visualization"
          role="img"
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="pulse">
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="2"
                result="blur"
              />
              <animate
                attributeName="stdDeviation"
                values="1;3;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </filter>
            <marker
              id="arrowhead"
              viewBox="-0 -5 10 10"
              refX={20}
              refY={0}
              orient="auto"
              markerWidth={6}
              markerHeight={6}
            >
              <path d="M 0,-5 L 10,0 L 0,5" fill="#ccc" strokeOpacity={0.6} />
            </marker>
          </defs>
          <g className="links">
            {links.map((link, index) => {
              return (
                <NetworkLink
                  link={link}
                  key={`link-${index}`}
                  nodes={nodeMap}
                  colorScale={colorScale}
                />
              );
            })}
          </g>
          <g className="nodes">
            {nodes.map(node => (
              <NetworkNode
                key={node.id}
                node={node}
                colorMode={colorMode}
                nodeConnectivity={nodeConnectivity}
                hoveredNodeId={hoveredNodeId}
                selectedNodeId={selectedNodeId}
                searchTerm={searchTerm}
              />
            ))}
          </g>
        </svg>
      </div>
    );
  }
);

// Controls Component
const Controls = React.memo(
  ({
    state,
    dispatch,
    storySteps,
  }: {
    state: State;
    dispatch: React.Dispatch<Action>;
    storySteps: any;
  }) => {
    const handleStepChange = useCallback(
      (step: number) => {
        dispatch({ type: 'SET_STEP', payload: step });
      },
      [dispatch]
    );

    const handlePlayPause = useCallback(() => {
      dispatch({ type: 'TOGGLE_ANIMATION' });
    }, [dispatch]);

    const handleReset = useCallback(() => {
      dispatch({ type: 'SET_STEP', payload: 0 });
      dispatch({ type: 'SET_SEARCH_TERM', payload: '' });
      dispatch({ type: 'SET_SELECTED_NODE', payload: null });
    }, [dispatch]);

    const handleToggleSimulation = useCallback(() => {
      dispatch({ type: 'TOGGLE_SIMULATION' });
    }, [dispatch]);

    const handleToggleLabels = useCallback(() => {
      dispatch({ type: 'TOGGLE_LABELS' });
    }, [dispatch]);

    const handleToggleColorMode = useCallback(() => {
      dispatch({ type: 'TOGGLE_COLOR_MODE' });
    }, [dispatch]);

    const handleSearchTermChange = useCallback(
      (term: string) => {
        dispatch({ type: 'SET_SEARCH_TERM', payload: term });
      },
      [dispatch]
    );

    const handleTypeFilter = useCallback(
      (type: string) => {
        dispatch({ type: 'TOGGLE_FILTER_TYPE', payload: type });
      },
      [dispatch]
    );

    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStepChange(state.currentStep - 1)}
              disabled={state.currentStep === 0}
            >
              <SkipBack className="h-4 w-4 mr-1" />
              Prev
            </Button>

            <Button
              variant={state.isAnimating ? 'default' : 'outline'}
              size="sm"
              onClick={handlePlayPause}
            >
              {state.isAnimating ? (
                <>
                  <Pause className="h-4 w-4 mr-1" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" /> Play
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStepChange(state.currentStep + 1)}
              disabled={state.currentStep === storySteps.length - 1}
            >
              Next
              <SkipForward className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <TooltipProvider>
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleReset}>
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
                    onClick={handleToggleLabels}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {state.showNodeLabels ? 'Hide Labels' : 'Show Labels'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleSimulation}
                  >
                    {state.simulationPaused ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {state.simulationPaused ? 'Resume Simulation' : 'Pause Simulation'}
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        <div className="flex mb-4">
          <input
            type="text"
            placeholder="Search nodes..."
            value={state.searchTerm}
            onChange={e => handleSearchTermChange(e.target.value)}
            className="px-3 py-1 border rounded-md mr-2 flex-grow"
            aria-label="Search nodes"
          />

          <div className="flex space-x-1">
            {['location', 'activity', 'resource', 'equipment', 'personnel', 'log'].map(
              type => (
                <Button
                  key={type}
                  variant={state.filteredTypes.includes(type) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTypeFilter(type)}
                  className="text-xs"
                >
                  {typeToEmoji[type as keyof typeof typeToEmoji]} {type}
                </Button>
              )
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center">
          <span className="text-sm font-medium mr-2">Timeline:</span>
          <div className="flex-grow">
            <Slider
              value={[state.currentStep]}
              min={0}
              max={storySteps.length - 1}
              step={1}
              onValueChange={value => handleStepChange(value[0])}
            />
          </div>
          <span className="text-sm ml-2">
            Step {state.currentStep + 1}/{storySteps.length}
          </span>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          {state.isAnimating
            ? 'Auto-playing network evolution...'
            : 'Use the timeline to explore how the network evolves, or Play to animate.'}
        </div>
      </>
    );
  }
);

// LogDetails Component (Moved to separate file)
const LogDetails = React.memo(
  ({
    selectedNodeId,
    logs,
    setSelectedNodeId,
  }: {
    selectedNodeId: string | null;
    logs: LogEntry[];
    setSelectedNodeId: (nodeId: string | null) => void;
  }) => {
    const logData = useMemo(() => {
      if (!selectedNodeId || !selectedNodeId.startsWith('log-')) return null;
      const logId = selectedNodeId.replace('log-', '');
      return logs.find(log => log.id.toString() === logId);
    }, [selectedNodeId, logs]);

    if (!logData) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute right-4 top-4 bg-white p-4 rounded-lg shadow-lg max-w-sm"
      >
        <h3 className="font-bold text-lg mb-2">Log #{logData.id}</h3>
        <div className="space-y-2">
          <p>
            <span className="font-semibold">Date:</span>{' '}
            {new Date(logData.timestamp).toLocaleString()}
          </p>
          <p>
            <span className="font-semibold">Location:</span> {logData.location}
          </p>
          <p>
            <span className="font-semibold">Activity:</span> {logData.activityType}
          </p>
          {logData.material && (
            <p>
              <span className="font-semibold">Material:</span> {logData.material}
            </p>
          )}
          {logData.equipment && (
            <p>
              <span className="font-semibold">Equipment:</span> {logData.equipment}
            </p>
          )}
          {logData.personnel && (
            <p>
              <span className="font-semibold">Personnel:</span> {logData.personnel}
            </p>
          )}
          <p>
            <span className="font-semibold">Notes:</span> {logData.notes}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => setSelectedNodeId(null)}
        >
          Close
        </Button>
      </motion.div>
    );
  }
);

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({ logs }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [storySteps, setStorySteps] = useState<{ nodes: Node[]; links: Link[] }[]>(
    []
  );
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Generate network data from logs (Memoized)
  const networkData = useMemo(() => {
    if (!logs || logs.length === 0) return null;

    // Create nodes for each unique entity
    const allNodes: Node[] = [];
    const allLinks: Link[] = [];
    const uniqueEntities: Record<string, Set<string>> = {
      location: new Set(),
      activity: new Set(),
      resource: new Set(),
      equipment: new Set(),
      personnel: new Set(),
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
          icon: typeToEmoji.location,
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
          icon: typeToEmoji.activity,
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
          icon: typeToEmoji.resource,
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
          icon: typeToEmoji.equipment,
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
          icon: typeToEmoji.personnel,
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
        icon: typeToEmoji.log,
        x: 0,
        y: 0,
      };
      allNodes.push(logNode);

      // Create links between log and other entities
      allLinks.push({
        source: `log-${log.id}`,
        target: `loc-${log.location}`,
        value: 3,
        type: 'at',
      });

      allLinks.push({
        source: `log-${log.id}`,
        target: `act-${log.activityType}`,
        value: 2,
        type: 'is',
      });

      if (log.material) {
        allLinks.push({
          source: `log-${log.id}`,
          target: `res-${log.material}`,
          value: 1,
          type: 'uses',
        });
      }

      if (log.equipment) {
        allLinks.push({
          source: `log-${log.id}`,
          target: `equip-${log.equipment}`,
          value: 1,
          type: 'with',
        });
      }

      if (log.personnel) {
        allLinks.push({
          source: `log-${log.id}`,
          target: `pers-${log.personnel}`,
          value: 1,
          type: 'by',
        });
      }
    });
    return { allNodes, allLinks };
  }, [logs]);

  useEffect(() => {
    if (!networkData) return;
    const { allNodes, allLinks } = networkData;

    // Create animated story progression
    const steps: { nodes: Node[]; links: Link[] }[] = [];
    const increment = Math.max(1, Math.ceil(logs.length / 12)); // Show 12 steps max

    // First show locations
    steps.push({
      nodes: allNodes.filter(n => n.type === 'location'),
      links: [],
    });

    // Then add activities
    steps.push({
      nodes: allNodes.filter(n => n.type === 'location' || n.type === 'activity'),
      links: allLinks.filter(l => {
        const sourceId = l.source;
        const targetId = l.target;
        return (
          steps[0].nodes.some(n => n.id === sourceId) ||
          steps[0].nodes.some(n => n.id === targetId)
        );
      }),
    });

    // Progressive reveal of logs
    for (let i = 0; i < logs.length; i += increment) {
      const logsSubset = logs.slice(0, i + increment);
      const logNodeIds = logsSubset.map(log => `log-${log.id}`);

      const stepNodes = allNodes.filter(
        node =>
          node.type === 'location' ||
          node.type === 'activity' ||
          logNodeIds.includes(node.id) ||
          logsSubset.some(
            log =>
              (node.type === 'resource' && node.label === log.material) ||
              (node.type === 'equipment' && node.label === log.equipment) ||
              (node.type === 'personnel' && node.label === log.personnel)
          )
      );

      const stepLinks = allLinks.filter(link => {
        const sourceId = link.source;
        const targetId = link.target;
        return stepNodes.some(n => n.id === sourceId) && stepNodes.some(n => n.id === targetId);
      });

      steps.push({ nodes: stepNodes, links: stepLinks });
    }
    setStorySteps(steps);
    setNodes(steps[0].nodes);
    setLinks(steps[0].links);
  }, [logs, networkData]);

  const nodeConnectivity = useMemo(() => {
    const connectivity: Record<string, number> = {};

    links.forEach(link => {
      connectivity[link.source] = (connectivity[link.source] || 0) + 1;
      connectivity[link.target] = (connectivity[link.target] || 0) + 1;
    });

    return connectivity;
  }, [links]);

  // Filter nodes based on search term and filtered types
  const filteredNodes = useMemo(() => {
    if (!networkData) return [];
    const { allNodes } = networkData;
    const searchTermLower = state.searchTerm.toLowerCase();
    const filteredTypesSet = new Set(state.filteredTypes); // For faster lookups

    return allNodes.filter(node => {
      const matchesSearch = searchTermLower
        ? node.label.toLowerCase().includes(searchTermLower)
        : true;
      const matchesType =
        filteredTypesSet.size > 0 ? filteredTypesSet.has(node.type) : true;

      return matchesSearch && matchesType;
    });
  }, [networkData, state.searchTerm, state.filteredTypes]);

  // Filter links based on filtered nodes
  const filteredLinks = useMemo(() => {
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
    return links.filter(
      link => filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
    );
  }, [links, filteredNodes]);

  const handleNodeClick = useCallback((nodeId: string) => {
    dispatch({ type: 'SET_SELECTED_NODE', payload: nodeId });
  }, [dispatch]);

  const setSelectedNodeId = useCallback(
    (nodeId: string | null) => {
      dispatch({ type: 'SET_SELECTED_NODE', payload: nodeId });
    },
    [dispatch]
  );

  // Effect for animation steps
  useEffect(() => {
    if (state.isAnimating && state.currentStep < storySteps.length - 1) {
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
        setNodes(storySteps[state.currentStep + 1].nodes);
        setLinks(storySteps[state.currentStep + 1].links);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [state.isAnimating, state.currentStep, storySteps, dispatch]);

  return (
    <div className="flex flex-col h-full">
      <Controls state={state} dispatch={dispatch} storySteps={storySteps} />
      <Network
        nodes={filteredNodes}
        links={filteredLinks}
        showNodeLabels={state.showNodeLabels}
        colorMode={state.colorMode}
        nodeConnectivity={nodeConnectivity}
        searchTerm={state.searchTerm}
        selectedNodeId={state.selectedNodeId}
        hoveredNodeId={hoveredNodeId}
        setHoveredNodeId={setHoveredNodeId}
        onNodeClick={handleNodeClick}
        simulationPaused={state.simulationPaused}
      />
      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredNodeId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-4 bottom-4 bg-white p-3 rounded-lg shadow-lg max-w-xs"
          >
            {(() => {
              const hoveredNode = filteredNodes.find(node => node.id === hoveredNodeId);

              if (!hoveredNode) {
                return <p>Node not found</p>;
              }
              return (
                <>
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">{hoveredNode.icon}</span>
                    <h3 className="font-bold text-lg">{hoveredNode.label}</h3>
                  </div>
                  <p>
                    <span className="font-semibold">Type:</span> {hoveredNode.type}
                  </p>
                  <p>
                    <span className="font-semibold">Connections:</span>{' '}
                    {nodeConnectivity[hoveredNode.id] || 0}
                  </p>
                  {hoveredNode.type === 'log' && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-sm italic">Click to view details</p>
                    </div>
                  )}
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.selectedNodeId && (
          <LogDetails
            selectedNodeId={state.selectedNodeId}
            logs={logs}
            setSelectedNodeId={setSelectedNodeId}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NetworkVisualization;
