
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getLocationGroups } from '@/lib/mockData';
import { Maximize, Minimize, MapPin } from 'lucide-react';
import TransitionLayout from './TransitionLayout';

interface LogMapProps {
  selectedLocation: string | null;
  setSelectedLocation: (location: string | null) => void;
}

const LogMap: React.FC<LogMapProps> = ({ selectedLocation, setSelectedLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  
  useEffect(() => {
    // Load the Mapbox script dynamically
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js';
    script.async = true;
    
    script.onload = () => {
      // Initialize Mapbox map
      if (!mapContainerRef.current) return;
      
      // Replace with your Mapbox token - for demo purposes only
      // In production, use env variables or backend authentication
      const mapboxgl = window.mapboxgl;
      mapboxgl.accessToken = 'pk.eyJ1IjoiZXhhbXBsZXVzZXIiLCJhIjoiY2xhYmZlcjc5MDduNTN3bXZ1cjlscmdjcyJ9.3J4I-XMofGTNJ-5uZvLRaQ';
      
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
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
      
      // Add location markers
      mapRef.current.on('load', () => {
        const locations = getLocationGroups();
        
        locations.forEach(location => {
          if (location.coordinates) {
            const el = document.createElement('div');
            el.className = 'location-marker';
            el.innerHTML = `
              <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200">
                <div class="w-4 h-4 bg-primary rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                  ${location.count}
                </div>
              </div>
            `;
            
            // Create a popup
            const popup = new mapboxgl.Popup({ offset: 25 })
              .setHTML(`<h3 class="text-sm font-medium">${location.location}</h3>
                        <p class="text-xs">${location.count} logs</p>`);
            
            // Create marker
            const marker = new mapboxgl.Marker(el)
              .setLngLat(location.coordinates)
              .setPopup(popup)
              .addTo(mapRef.current!);
              
            // Add click event
            el.addEventListener('click', () => {
              setSelectedLocation(location.location);
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
      });
    };
    
    document.head.appendChild(script);
    
    // Load Mapbox CSS
    const link = document.createElement('link');
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
      document.head.removeChild(script);
      document.head.removeChild(link);
    };
  }, [selectedLocation]);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Allow the map to resize
    setTimeout(() => {
      mapRef.current?.resize();
    }, 300);
  };
  
  return (
    <TransitionLayout animation="fade" className="w-full">
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[500px] rounded-xl overflow-hidden'}`}
        >
          <div ref={mapContainerRef} className="w-full h-full" />
          
          {/* Location list panel */}
          {!isFullscreen && (
            <div className="absolute top-4 left-4 max-w-xs glass rounded-lg p-4 max-h-[400px] overflow-y-auto">
              <h3 className="text-sm font-medium mb-3">Locations</h3>
              <div className="space-y-2">
                {getLocationGroups().map((location, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedLocation(location.location)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center
                      ${selectedLocation === location.location 
                        ? 'bg-primary text-white' 
                        : 'hover:bg-secondary/80'}`}
                  >
                    <MapPin className="w-3 h-3 mr-2 flex-shrink-0" />
                    <span>{location.location}</span>
                    <span className="ml-auto bg-white/20 text-xs rounded-full px-1.5 py-0.5">
                      {location.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Controls */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 glass-darker p-2 rounded-full shadow-sm hover:bg-black/10 transition-colors"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>
          
          {/* Fullscreen overlay */}
          {isFullscreen && (
            <div className="absolute bottom-8 left-8 right-8 glass rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Location Map</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedLocation ? selectedLocation : 'Select a location to view details'}
                </p>
              </div>
              <div className="flex space-x-3">
                {getLocationGroups().map((location, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedLocation(location.location)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors
                      ${selectedLocation === location.location 
                        ? 'bg-primary text-white' 
                        : 'glass-darker hover:bg-black/10'}`}
                  >
                    {location.location}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </TransitionLayout>
  );
};

// Extend the Window interface
declare global {
  interface Window {
    mapboxgl: any;
  }
}

export default LogMap;
