
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogEntry } from '@/lib/types';
import { Maximize, Minimize, MapPin, Layers, List, Filter, Info, X, Compass, ChevronDown } from 'lucide-react';
import TransitionLayout from './TransitionLayout';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';
import { Dropdown, DropdownMenu, DropdownItem } from './ui/dropdown';

interface LogMapProps {
  selectedLocation: string | null;
  setSelectedLocation: (location: string | null) => void;
  logs: LogEntry[];
  onLogSelect?: (logId: string) => void;
  isLoading?: boolean;
}

type MapStyle = 'light' | 'dark' | 'satellite' | 'streets' | 'outdoors';
type FilterOption = 'all' | 'recent' | 'highActivity' | 'lowActivity';

const LogMap: React.FC<LogMapProps> = ({ 
  selectedLocation, 
  setSelectedLocation, 
  logs,
  onLogSelect,
  isLoading = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>('light');
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [selectedLocationDetails, setSelectedLocationDetails] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const { theme } = useTheme();
  
  // Get location data from real logs
  const getLocationGroups = () => {
    const locationMap = new Map<string, { 
      count: number, 
      coordinates?: [number, number],
      logIds: string[],
      lastActivity?: Date,
      firstActivity?: Date
    }>();
    
    // Mock coordinates for locations if not provided in logs
    const defaultCoordinates: Record<string, [number, number]> = {
      "Massey's Test Facility": [-97.7431, 30.2672],
      "Sanchez Site": [-97.8331, 30.1872],
      "Delta Junction": [-97.6531, 30.3472],
      "North Ridge": [-97.7231, 30.4272],
      "West Portal": [-97.9131, 30.2472],
      "South Basin": [-97.7631, 30.1272],
      "East Quarry": [-97.6131, 30.2772],
      "Central Processing": [-97.7731, 30.2972],
      // Add more locations with mock coordinates
      "Highland Operations": [-97.6931, 30.3172],
      "Lower Containment": [-97.7831, 30.1772],
      "Research Zone Alpha": [-97.8431, 30.3072]
    };
    
    logs.forEach(log => {
      if (log.location) {
        const locationData = locationMap.get(log.location) || { 
          count: 0, 
          logIds: [],
          lastActivity: undefined,
          firstActivity: undefined
        };
        
        locationData.count += 1;
        if (log.id) locationData.logIds.push(log.id);
        
        // Track activity timestamps
        const timestamp = log.timestamp ? new Date(log.timestamp) : new Date();
        if (!locationData.lastActivity || timestamp > locationData.lastActivity) {
          locationData.lastActivity = timestamp;
        }
        if (!locationData.firstActivity || timestamp < locationData.firstActivity) {
          locationData.firstActivity = timestamp;
        }
        
        // Use coordinates from log or default coordinates
        if (log.coordinates) {
          locationData.coordinates = log.coordinates;
        } else if (defaultCoordinates[log.location]) {
          locationData.coordinates = defaultCoordinates[log.location];
        }
        
        locationMap.set(log.location, locationData);
      }
    });
    
    return Array.from(locationMap.entries()).map(([location, data]) => ({
      location,
      count: data.count,
      coordinates: data.coordinates,
      logIds: data.logIds,
      lastActivity: data.lastActivity,
      firstActivity: data.firstActivity,
      daysSinceLastActivity: data.lastActivity ? 
        Math.floor((new Date().getTime() - data.lastActivity.getTime()) / (1000 * 3600 * 24)) : 
        undefined
    }));
  };

  const allLocations = getLocationGroups();
  
  // Filter locations based on activeFilter
  const getFilteredLocations = () => {
    let filtered = [...allLocations];
    
    // Apply search filter
    if (search) {
      filtered = filtered.filter(loc => 
        loc.location.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply category filter
    switch(activeFilter) {
      case 'recent':
        filtered = filtered.filter(loc => loc.daysSinceLastActivity !== undefined && loc.daysSinceLastActivity < 7)
          .sort((a, b) => {
            if (!a.lastActivity || !b.lastActivity) return 0;
            return b.lastActivity.getTime() - a.lastActivity.getTime();
          });
        break;
      case 'highActivity':
        filtered = filtered.sort((a, b) => b.count - a.count).slice(0, 5);
        break;
      case 'lowActivity':
        filtered = filtered.sort((a, b) => a.count - b.count).slice(0, 5);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }
    
    return filtered;
  };
  
  const locations = getFilteredLocations();
  
  // Get map style URL based on selected style and theme
  const getMapStyleUrl = () => {
    const isDarkMode = theme === 'dark';
    
    switch(mapStyle) {
      case 'dark':
        return 'mapbox://styles/mapbox/dark-v11';
      case 'satellite':
        return 'mapbox://styles/mapbox/satellite-streets-v12';
      case 'streets':
        return 'mapbox://styles/mapbox/streets-v12';
      case 'outdoors':
        return 'mapbox://styles/mapbox/outdoors-v12';
      case 'light':
      default:
        return isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
    }
  };
  
  // Initialize map and add markers
  const initializeMap = () => {
    if (!mapContainerRef.current || mapRef.current) return;
    
    // Replace with your Mapbox token - for demo purposes only
    // In production, use env variables or backend authentication
    mapboxgl.accessToken = 'pk.eyJ1IjoiemFjazk0MDAiLCJhIjoiY204aTdlbGd5MDJiNTJuc2dkeHdtNGNkYyJ9.Wq4MoL9WLWpSgNtelwa8Gg';
    
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: getMapStyleUrl(),
      center: [-97.7431, 30.2672], // Default center
      zoom: 10,
      attributionControl: false
    });
    
    // Add navigation controls
    mapRef.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );
    
    // Add scale control
    mapRef.current.addControl(
      new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'imperial'
      }),
      'bottom-right'
    );
    
    // Add geolocate control
    mapRef.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }),
      'top-right'
    );
    
    // Add location markers when map is loaded
    mapRef.current.on('load', () => {
      addMarkersToMap();
      
      // Add heatmap layer if enabled
      if (heatmapEnabled) {
        addHeatmapLayer();
      }
    });
  };
  
  // Add markers to the map
  const addMarkersToMap = () => {
    if (!mapRef.current) return;
    
    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Add new markers
    locations.forEach(location => {
      if (location.coordinates) {
        const el = document.createElement('div');
        el.className = 'location-marker';
        
        const isSelected = selectedLocation === location.location;
        
        el.innerHTML = `
          <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 ${isSelected ? 'border-primary' : 'border-gray-200'} transition-all hover:scale-110">
            <div class="w-6 h-6 ${isSelected ? 'bg-primary' : 'bg-primary/80'} rounded-full flex items-center justify-center text-white text-[10px] font-bold transition-colors">
              ${location.count}
            </div>
          </div>
        `;
        
        // Create a popup with more detailed information
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: false,
          maxWidth: '300px'
        }).setHTML(`
          <div class="p-1">
            <h3 class="text-sm font-medium">${location.location}</h3>
            <p class="text-xs">${location.count} logs</p>
            ${location.lastActivity ? 
              `<p class="text-xs mt-1">Last activity: ${location.lastActivity.toLocaleDateString()}</p>` : ''}
            <button class="text-xs text-primary mt-2 view-details-btn">View details</button>
          </div>
        `);
        
        // Create marker
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'bottom',
          // Add slight random offset to prevent overlapping markers at same location
          offset: [Math.random() * 5 - 2.5, Math.random() * 5 - 2.5]
        })
          .setLngLat(location.coordinates)
          .setPopup(popup)
          .addTo(mapRef.current!);
        
        markersRef.current.push(marker);
        
        // Add click events
        el.addEventListener('click', () => {
          setSelectedLocation(location.location);
          
          // Fly to location
          mapRef.current?.flyTo({
            center: location.coordinates,
            zoom: 14,
            duration: 1000
          });
        });
        
        // Add event listener for the "View details" button in popup
        marker.getPopup().on('open', () => {
          setTimeout(() => {
            const detailsBtn = document.querySelector('.view-details-btn');
            if (detailsBtn) {
              detailsBtn.addEventListener('click', () => {
                setSelectedLocationDetails(location);
                setShowLocationDetails(true);
                marker.getPopup().remove();
              });
            }
          }, 10);
        });
      }
    });
    
    // If selected location, fly to it
    if (selectedLocation) {
      const location = locations.find(l => l.location === selectedLocation);
      if (location?.coordinates) {
        mapRef.current?.flyTo({
          center: location.coordinates,
          zoom: 14,
          duration: 1000
        });
      }
    }
  };
  
  // Add heatmap layer to visualize log density
  const addHeatmapLayer = () => {
    if (!mapRef.current) return;
    
    // Remove existing heatmap if it exists
    if (mapRef.current.getSource('log-density')) {
      mapRef.current.removeLayer('log-density-heat');
      mapRef.current.removeSource('log-density');
    }
    
    // Create heatmap data points from locations
    const points = locations.flatMap(location => {
      if (!location.coordinates) return [];
      
      // Create multiple points based on log count for better heatmap visualization
      return Array(Math.min(location.count, 20)).fill(0).map(() => ({
        type: 'Feature',
        properties: {
          count: location.count
        },
        geometry: {
          type: 'Point',
          coordinates: location.coordinates
        }
      }));
    });
    
    mapRef.current.addSource('log-density', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: points
      }
    });
    
    mapRef.current.addLayer(
      {
        id: 'log-density-heat',
        type: 'heatmap',
        source: 'log-density',
        paint: {
          // Increase weight based on count
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'count'], 0, 0, 10, 1],
          'heatmap-intensity': 0.6,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': 15,
          'heatmap-opacity': 0.7
        }
      },
      'waterway-label'
    );
  };
  
  // Update map style
  const updateMapStyle = (style: MapStyle) => {
    setMapStyle(style);
    if (mapRef.current) {
      mapRef.current.setStyle(getMapStyleUrl());
      
      // Need to re-add markers and layers after style change
      mapRef.current.once('styledata', () => {
        addMarkersToMap();
        if (heatmapEnabled) {
          addHeatmapLayer();
        }
      });
    }
  };
  
  // Toggle heatmap
  const toggleHeatmap = () => {
    const newState = !heatmapEnabled;
    setHeatmapEnabled(newState);
    
    if (newState && mapRef.current) {
      addHeatmapLayer();
    } else if (!newState && mapRef.current) {
      if (mapRef.current.getLayer('log-density-heat')) {
        mapRef.current.removeLayer('log-density-heat');
      }
      if (mapRef.current.getSource('log-density')) {
        mapRef.current.removeSource('log-density');
      }
    }
  };
  
  // Initialize map effect
  useEffect(() => {
    initializeMap();
    
    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
  // Update markers when locations or selected location changes
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      addMarkersToMap();
      
      // Also update heatmap if enabled
      if (heatmapEnabled) {
        addHeatmapLayer();
      }
    }
  }, [locations, selectedLocation, heatmapEnabled]);
  
  // Update map style when theme changes
  useEffect(() => {
    if (mapRef.current && mapStyle === 'light') {
      mapRef.current.setStyle(getMapStyleUrl());
      
      // Need to re-add markers and layers after style change
      mapRef.current.once('styledata', () => {
        addMarkersToMap();
        if (heatmapEnabled) {
          addHeatmapLayer();
        }
      });
    }
  }, [theme]);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Allow the map to resize
    setTimeout(() => {
      mapRef.current?.resize();
    }, 300);
  };
  
  // Show a loading state
  if (isLoading) {
    return (
      <TransitionLayout animation="fade" className="w-full">
        <div className="glass rounded-xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-medium">Loading Map Data</h2>
          <p className="text-muted-foreground mt-2">
            Preparing location information...
          </p>
        </div>
      </TransitionLayout>
    );
  }
  
  // Show a placeholder if no locations available
  if (locations.length === 0) {
    return (
      <TransitionLayout animation="fade" className="w-full">
        <div className="glass rounded-xl p-8 text-center">
          <h2 className="text-xl font-medium mb-4">No Location Data Available</h2>
          <p className="text-muted-foreground">
            Enter a transcription above to generate activity logs with location data.
          </p>
          {search && (
            <p className="mt-4 text-sm">
              No results found for "<span className="font-medium">{search}</span>".
              <button 
                onClick={() => setSearch('')} 
                className="ml-2 text-primary hover:underline"
              >
                Clear search
              </button>
            </p>
          )}
        </div>
      </TransitionLayout>
    );
  }
  
  return (
    <TransitionLayout animation="fade" className="w-full">
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-[500px] rounded-xl overflow-hidden border border-border'}`}
        >
          <div ref={mapContainerRef} className="w-full h-full" />
          
          {/* Location sidebar panel */}
          <AnimatePresence>
            {showSidebar && (
              <motion.div 
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.3 }}
                className={`absolute top-0 left-0 h-full glass border-r border-border
                  ${isFullscreen ? 'w-[280px]' : 'w-[250px]'}`}
              >
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Locations</h3>
                    <div className="flex space-x-1">
                      <Tooltip content={`${activeFilter === 'all' ? 'Filtered' : 'All'} Locations`}>
                        <Button 
                          size="xs" 
                          variant="ghost" 
                          onClick={() => setActiveFilter(activeFilter === 'all' ? 'all' : 'all')}
                          className="h-6 w-6 p-1"
                        >
                          <Filter className="w-3.5 h-3.5" />
                        </Button>
                      </Tooltip>
                      {!isFullscreen && (
                        <Tooltip content="Hide Sidebar">
                          <Button 
                            size="xs" 
                            variant="ghost" 
                            onClick={() => setShowSidebar(false)}
                            className="h-6 w-6 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search locations..."
                      className="w-full px-3 py-1.5 rounded-md text-sm bg-background/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {search && (
                      <button 
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setSearch('')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center mt-3 space-x-1">
                    <Button
                      size="xs"
                      variant={activeFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setActiveFilter('all')}
                      className="text-xs flex-1 h-7"
                    >
                      All
                    </Button>
                    <Button
                      size="xs"
                      variant={activeFilter === 'recent' ? 'default' : 'outline'}
                      onClick={() => setActiveFilter('recent')}
                      className="text-xs flex-1 h-7"
                    >
                      Recent
                    </Button>
                    <Button
                      size="xs"
                      variant={activeFilter === 'highActivity' ? 'default' : 'outline'}
                      onClick={() => setActiveFilter('highActivity')}
                      className="text-xs flex-1 h-7"
                    >
                      Highest
                    </Button>
                  </div>
                </div>
                
                <div className="overflow-y-auto h-[calc(100%-120px)] px-2 py-2">
                  <div className="space-y-1">
                    {locations.map((location, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedLocation(location.location);
                          if (location.coordinates) {
                            mapRef.current?.flyTo({
                              center: location.coordinates,
                              zoom: 14,
                              duration: 1000
                            });
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center
                          ${selectedLocation === location.location 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-secondary/80'}`}
                      >
                        <MapPin className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                        <div className="flex-1 truncate">
                          <div className="font-medium truncate">{location.location}</div>
                          {location.lastActivity && (
                            <div className="text-xs opacity-70">
                              {location.daysSinceLastActivity === 0 ? 'Today' : 
                               location.daysSinceLastActivity === 1 ? 'Yesterday' : 
                               `${location.daysSinceLastActivity} days ago`}
                            </div>
                          )}
                        </div>
                        <span className={`ml-auto text-xs rounded-full w-6 h-6 flex items-center justify-center
                          ${selectedLocation === location.location 
                            ? 'bg-white/20' 
                            : 'bg-secondary-foreground/10'}`}>
                          {location.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border bg-background/50 backdrop-blur-sm">
                  <div className="text-xs text-muted-foreground">
                    Showing {locations.length} of {allLocations.length} locations
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Sidebar toggle button (when sidebar is hidden) */}
          {!showSidebar && (
            <button
              onClick={() => setShowSidebar(true)}
              className="absolute top-4 left-4 glass-darker p-2 rounded-full shadow-sm hover:bg-black/10 transition-colors"
            >
              <List className="w-4 h-4" />
            </button>
          )}
          
          {/* Map controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <Tooltip content={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <button
                onClick={toggleFullscreen}
                className="glass-darker p-2 rounded-full shadow-sm hover:bg-black/10 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            </Tooltip>
            
            <Dropdown>
              <Tooltip content="Change Map Style">
                <button className="glass-darker p-2 rounded-full shadow-sm hover:bg-black/10 transition-colors">
                  <Layers className="w-4 h-4" />
                </button>
              </Tooltip>
              
              <DropdownMenu className="w-40">
                <DropdownItem 
                  onClick={() => updateMapStyle('light')}
                  active={mapStyle === 'light'}
                >
                  Light
                </DropdownItem>
                <DropdownItem 
                  onClick={() => updateMapStyle('dark')}
                  active={mapStyle === 'dark'}
                >
                  Dark
                </DropdownItem>
                <DropdownItem 
                  onClick={() => updateMapStyle('satellite')}
                  active={mapStyle === 'satellite'}
                >
                  Satellite
                </DropdownItem>
                <DropdownItem 
                  onClick={() => updateMapStyle('streets')}
                  active={mapStyle === 'streets'}
                >
                  Streets
                </DropdownItem>
                <DropdownItem 
                  onClick={() => updateMapStyle('outdoors')}
                  active={mapStyle === 'outdoors'}
                >
                  Outdoors
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
            
            <Tooltip content={heatmapEnabled ? "Disable Heatmap" : "Enable Heatmap"}>
              <button 
                onClick={toggleHeatmap}
                className={`p-2 rounded-full shadow-sm transition-colors ${
                  heatmapEnabled 
                    ? 'bg-primary text-white' 
                    : 'glass-darker hover:bg-black/10'
                }`}
              >
                <Compass className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
          
          {/* Selected location info panel */}
          {selectedLocation && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-6 left-1/2 transform -translate-x-1/2 glass rounded-lg px-4 py-3 shadow-lg max-w-md"
            >
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-primary" />
                <h3 className="font-medium">{selectedLocation}</h3>
                <button 
                  onClick={() => setSelectedLocation(null)} 
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {selectedLocationDetails && (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">Logs: </span>
                    <span className="font-medium">{selectedLocationDetails.count}</span>
                  </div>
                  {selectedLocationDetails.lastActivity && (
                    <div>
                      <span className="text-muted-foreground">Last activity: </span>
                      <span className="font-medium">
                        {selectedLocationDetails.lastActivity.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedLocationDetails(
                        locations.find(l => l.location === selectedLocation)
                      );
                      setShowLocationDetails(true);
                    }}
                    className="text-primary hover:underline text-sm"
                  >
                    View details
                  </button>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Location detail modal */}
          <AnimatePresence>
            {showLocationDetails && selectedLocationDetails && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"
                onClick={() => setShowLocationDetails(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-background rounded-xl shadow-xl max-w-lg w-full m-4 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-5 border-b border-border flex items-center justify-between">
                    <h3 className="text-lg font-medium">{selectedLocationDetails.location}</h3>
                    <button 
                      onClick={() => setShowLocationDetails(false)} 
                      className="text-muted-foreground hover:text-foreground"
                    >
                      
<X className="w-5 h-5" />
                   </button>
                 </div>
                 
                 <div className="p-5">
                   <div className="grid grid-cols-2 gap-4 mb-4">
                     <div className="glass p-3 rounded-lg">
                       <div className="text-sm text-muted-foreground">Total Logs</div>
                       <div className="text-2xl font-bold">{selectedLocationDetails.count}</div>
                     </div>
                     
                     <div className="glass p-3 rounded-lg">
                       <div className="text-sm text-muted-foreground">Last Activity</div>
                       <div className="text-xl font-medium">
                         {selectedLocationDetails.lastActivity ? 
                           selectedLocationDetails.lastActivity.toLocaleDateString() : 
                           'Unknown'}
                       </div>
                     </div>
                   </div>
                   
                   <div className="mb-4">
                     <h4 className="text-sm font-medium mb-2">Activity Timeline</h4>
                     {selectedLocationDetails.firstActivity && selectedLocationDetails.lastActivity ? (
                       <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
                         <div 
                           className="absolute left-0 top-0 h-full bg-primary rounded-full"
                           style={{ 
                             width: `${Math.min(100, selectedLocationDetails.count * 5)}%` 
                           }}
                         ></div>
                         <div className="absolute -top-6 left-0 text-xs">
                           {selectedLocationDetails.firstActivity.toLocaleDateString()}
                         </div>
                         <div className="absolute -top-6 right-0 text-xs">
                           {selectedLocationDetails.lastActivity.toLocaleDateString()}
                         </div>
                       </div>
                     ) : (
                       <div className="text-sm text-muted-foreground">
                         Timeline data not available
                       </div>
                     )}
                   </div>
                   
                   <div className="mb-4">
                     <h4 className="text-sm font-medium mb-2">Coordinates</h4>
                     {selectedLocationDetails.coordinates ? (
                       <div className="flex items-center space-x-2">
                         <div className="glass px-2 py-1 rounded text-xs">
                           Lat: {selectedLocationDetails.coordinates[1].toFixed(4)}
                         </div>
                         <div className="glass px-2 py-1 rounded text-xs">
                           Lng: {selectedLocationDetails.coordinates[0].toFixed(4)}
                         </div>
                         <button 
                           className="text-xs text-primary hover:underline ml-auto"
                           onClick={() => {
                             // Copy coordinates to clipboard
                             navigator.clipboard.writeText(
                               `${selectedLocationDetails.coordinates[1]}, ${selectedLocationDetails.coordinates[0]}`
                             );
                             // You'd add a toast notification here
                           }}
                         >
                           Copy
                         </button>
                       </div>
                     ) : (
                       <div className="text-sm text-muted-foreground">
                         Coordinates not available
                       </div>
                     )}
                   </div>
                   
                   {selectedLocationDetails.logIds && selectedLocationDetails.logIds.length > 0 && (
                     <div>
                       <h4 className="text-sm font-medium mb-2">Recent Logs</h4>
                       <div className="max-h-40 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                         {selectedLocationDetails.logIds.slice(0, 5).map((logId, idx) => (
                           <button
                             key={idx}
                             onClick={() => onLogSelect && onLogSelect(logId)}
                             className="w-full text-left p-2 hover:bg-secondary/50 transition-colors text-sm flex items-center justify-between"
                           >
                             <span className="truncate">Log #{idx + 1}</span>
                             <ChevronDown className="w-4 h-4 text-muted-foreground" />
                           </button>
                         ))}
                       </div>
                       
                       {selectedLocationDetails.logIds.length > 5 && (
                         <div className="mt-2 text-center">
                           <button 
                             className="text-xs text-primary hover:underline"
                             onClick={() => {
                               // Show all logs for this location
                               // Implementation would depend on your UI
                             }}
                           >
                             Show all {selectedLocationDetails.logIds.length} logs
                           </button>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
                 
                 <div className="p-4 border-t border-border flex justify-end">
                   <Button 
                     variant="outline" 
                     size="sm"
                     onClick={() => setShowLocationDetails(false)}
                     className="mr-2"
                   >
                     Close
                   </Button>
                   <Button 
                     size="sm"
                     onClick={() => {
                       setShowLocationDetails(false);
                       // Center map on this location
                       if (selectedLocationDetails.coordinates && mapRef.current) {
                         mapRef.current.flyTo({
                           center: selectedLocationDetails.coordinates,
                           zoom: 15,
                           duration: 1000
                         });
                       }
                     }}
                   >
                     Center on Map
                   </Button>
                 </div>
               </motion.div>
             </motion.div>
           )}
         </AnimatePresence>
         
         {/* Map attribution footer */}
         <div className="absolute bottom-2 right-2 text-xs text-muted-foreground glass-darker px-2 py-1 rounded">
           © Mapbox © OpenStreetMap
         </div>
       </motion.div>
     </div>
   </TransitionLayout>
 );
};

export default LogMap;
