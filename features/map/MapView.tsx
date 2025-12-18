
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import Supercluster from 'supercluster';
import { GoogleMap, MarkerF, OverlayViewF, InfoWindowF } from '@react-google-maps/api';
import { 
  Wrench, Zap, Truck, Sparkles, MapPin, 
  Filter, X, CircleDollarSign, Eye, Star, User, ChevronDown
} from 'lucide-react';
import { UserRole, ServiceCategory, ProviderStore, ServiceOrder, PublicRequest, RequestApplicant, SavedAddress } from '../../types';
import { Button, Input, FilterModal } from '../../components/UIComponents';

// Helper to create SVG Data URI
const createSvgIcon = (svgString: string, color: string = 'white') => {
    const encoded = encodeURIComponent(svgString.replace('currentColor', color));
    return `data:image/svg+xml;charset=UTF-8,${encoded}`;
};

// Modern Pin SVG with inner icon support
const PIN_PATH = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

const createPinSvg = (innerIconPath: string, color: string = 'black', bgColor: string = 'white', iconColor: string = 'black') => {
    const icon = innerIconPath.replace(/currentColor/g, iconColor);
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
        <path d="${PIN_PATH}" fill="${bgColor}" stroke="${color}" stroke-width="1" filter="url(#shadow)"/>
        <g transform="translate(7, 4) scale(0.6)">
            ${icon}
        </g>
    </svg>`;
};

// Simple Icon SVG (No Pin Background)
const createSimpleIconSvg = (innerIconPath: string, color: string = 'white') => {
    const icon = innerIconPath.replace(/currentColor/g, color);
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.8)"/>
        </filter>
        <g filter="url(#shadow)">
            ${icon}
        </g>
    </svg>`;
};

// Inner paths for icons
const PATHS = {
    plomeria: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="currentColor"/>',
    electricidad: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor"/>',
    mudanza: '<path d="M1 3h15v13H1z" fill="currentColor"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" fill="currentColor"/><circle cx="5.5" cy="18.5" r="2.5" fill="currentColor"/><circle cx="18.5" cy="18.5" r="2.5" fill="currentColor"/>',
    limpieza: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z" fill="currentColor"/>',
    default: '<circle cx="12" cy="12" r="5" fill="currentColor"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" stroke-width="2"/>',
    briefcase: '<rect width="20" height="14" x="2" y="7" rx="2" ry="2" fill="currentColor"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" fill="currentColor"/>',
    user: '<circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" fill="currentColor"/>',
    raisingHand: '<path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="currentColor"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" fill="currentColor"/><path d="M19 13l-1.5-4.5a1.5 1.5 0 0 0-2.8 1L16 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
};

const ICONS_SVG = {
  plomeria: createSimpleIconSvg(PATHS.plomeria, '#06b6d4'), // Cyan
  electricidad: createSimpleIconSvg(PATHS.electricidad, '#eab308'), // Yellow
  mudanza: createSimpleIconSvg(PATHS.mudanza, '#f97316'), // Orange
  limpieza: createSimpleIconSvg(PATHS.limpieza, '#a855f7'), // Purple
  default: createSimpleIconSvg(PATHS.default, '#9ca3af'), // Gray
  home: createSimpleIconSvg(PATHS.home, '#60a5fa'), // Light Blue
  briefcase: createSimpleIconSvg(PATHS.briefcase, '#fb923c'), // Light Orange
  user: createSimpleIconSvg(PATHS.user, '#34d399'), // Light Green
  raisingHand: createSimpleIconSvg(PATHS.raisingHand, '#ef4444') // Red for "Help needed"
};

const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };

const CATEGORIES: ServiceCategory[] = [
  { id: 'all', name: 'Todos', icon: 'grid' },
  { id: 'plomeria', name: 'Plomería', icon: 'wrench' },
  { id: 'electricidad', name: 'Electricidad', icon: 'zap' },
  { id: 'mudanza', name: 'Fletes', icon: 'truck' },
  { id: 'limpieza', name: 'Limpieza', icon: 'sparkles' },
];

const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#18181b" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
];

interface MapViewProps {
  isLoaded: boolean;
  role: UserRole;
  providers: ProviderStore[];
  orders: ServiceOrder[];
  publicRequests: PublicRequest[];
  selectedProvider: ProviderStore | null;
  selectedOrder: ServiceOrder | null;
  selectedPublicRequest: PublicRequest | null;
  myProviderProfile: ProviderStore;
  filterCategory: string;
  isRequesting: boolean;
  requestDescription: string;
  onSelectProvider: (p: ProviderStore | null) => void;
  onSelectOrder: (o: ServiceOrder | null) => void;
  onSelectPublicRequest: (r: PublicRequest | null) => void;
  onRequestDescriptionChange: (text: string) => void;
  onSetIsRequesting: (val: boolean) => void;
  onSendRequest: () => void;
  onAcceptOrder: (o: ServiceOrder) => void;
  onRejectOrder: (id: string) => void;
  onApplyToRequest: (r: PublicRequest) => void;
  onAcceptApplicant: (reqId: string, applicant: RequestApplicant) => void;
  onDeleteRequest: (reqId: string) => void;
  onViewClientProfile: (name: string) => void;
  onStartChat: (name: string, contextId: string) => void;
  onFilterChange: (id: string) => void;
  onAddPublicRequest: (req: Partial<PublicRequest>) => void;
  onOpenAddressModal: () => void;
  currentAddress: string;
  isCreatingRequest: boolean;
  onSetIsCreatingRequest: (val: boolean) => void;
  savedAddresses: SavedAddress[];
  clientLocation: { lat: number; lng: number };
  onUpdateLocation: (loc: { lat: number; lng: number }) => void;
  onMapCenterChange?: (lat: number, lng: number) => void;
}

export const MapView: React.FC<MapViewProps> = (props) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // DEBUG: Check if API Key is present
  useEffect(() => {
    console.log("Google Maps API Key present:", !!apiKey);
    if (!apiKey) console.error("API Key is missing in MapView");
  }, [apiKey]);

  const isLoaded = props.isLoaded;
  const loadError = !isLoaded && !window.google ? { message: "Waiting for Google Maps..." } : null;

  const mapRef = useRef<google.maps.Map | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [newReqOffer, setNewReqOffer] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');
  const [newReqCat, setNewReqCat] = useState('plomeria');
  const [selectedLocation, setSelectedLocation] = useState<{type: string, position: google.maps.LatLngLiteral, info: string} | null>(null);
  
  const [zoom, setZoom] = useState(14);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [clusters, setClusters] = useState<any[]>([]);

  const hasActiveRequest = useMemo(() => {
      return props.publicRequests.some(r => r.ownerId === 'current_user' && r.status === 'OPEN');
  }, [props.publicRequests]);

  // Supercluster Instance
  const index = useMemo(() => new Supercluster({
    radius: 40,
    maxZoom: 16
  }), []);

  // Update Points
  useEffect(() => {
    const points: any[] = [];

    if (props.role === UserRole.CLIENT) {
      props.providers.forEach(p => {
        if (props.filterCategory !== 'all' && p.categoryId !== props.filterCategory) return;
        points.push({
          type: 'Feature',
          properties: { cluster: false, provider: p, type: 'provider' },
          geometry: { type: 'Point', coordinates: [p.coordinates.y, p.coordinates.x] }
        });
      });
    }

    props.publicRequests.forEach(req => {
      if (req.status !== 'OPEN') return;
      
      // Fix duplication: If I am a client, my request is shown via my User Marker (Raising Hand)
      if (props.role === UserRole.CLIENT && req.ownerId === 'current_user') return;

      points.push({
        type: 'Feature',
        properties: { cluster: false, request: req, type: 'request' },
        geometry: { type: 'Point', coordinates: [req.coordinates.y, req.coordinates.x] }
      });
    });

    console.log("Loading points into Supercluster:", points.length);
    index.load(points);
    
    // Force update clusters if bounds exist
    if (bounds) {
        const newClusters = index.getClusters(bounds, Math.floor(zoom));
        console.log("Clusters updated:", newClusters.length);
        setClusters(newClusters);
    } else {
        // Initial load fallback if bounds not ready
        const newClusters = index.getClusters([-180, -85, 180, 85], Math.floor(zoom));
        setClusters(newClusters);
    }
  }, [props.providers, props.publicRequests, props.filterCategory, props.role, index, bounds, zoom]); // Added bounds and zoom to dependency to ensure update on move


  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const onBoundsChanged = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const newZoom = map.getZoom() || 14;
    setZoom(newZoom);
    
    const b = map.getBounds();
    if (b) {
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      // [west, south, east, north]
      const newBounds: [number, number, number, number] = [sw.lng(), sw.lat(), ne.lng(), ne.lat()];
      setBounds(newBounds);
      
      const newClusters = index.getClusters(newBounds, Math.floor(newZoom));
      setClusters(newClusters);

      const center = map.getCenter();
      if (center) {
        props.onMapCenterChange?.(center.lat(), center.lng());
      }
    }
  };

  // External location fly
  useEffect(() => {
    if (mapRef.current && props.clientLocation) {
      mapRef.current.panTo({ lat: props.clientLocation.lat, lng: props.clientLocation.lng });
      mapRef.current.setZoom(16);
    }
  }, [props.clientLocation]);

  const handleCreatePublicRequest = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    if (!center) return;

    const cat = CATEGORIES.find(c => c.id === newReqCat) || CATEGORIES[1];
    
    props.onAddPublicRequest({
        coordinates: { x: center.lat(), y: center.lng() },
        description: newReqDesc,
        offerPrice: newReqOffer ? `$${newReqOffer}` : 'A Convenir',
        category: cat,
        address: props.currentAddress
    });
    props.onSetIsCreatingRequest(false);
    setNewReqDesc('');
    setNewReqOffer('');
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-900">
      {loadError ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 text-center bg-zinc-900 z-0 absolute inset-0">
          <div className="text-red-500 font-bold mb-2">Error al cargar Google Maps</div>
          <div className="text-xs text-zinc-400">{loadError.message}</div>
          {!apiKey && <div className="mt-4 text-yellow-500 text-xs">No se detectó la API Key. Asegúrate de configurar VITE_GOOGLE_MAPS_API_KEY en el archivo .env y reiniciar el servidor.</div>}
        </div>
      ) : !isLoaded ? (
        <div className="w-full h-full flex items-center justify-center text-white bg-zinc-900 z-0 absolute inset-0">Cargando Mapa...</div>
      ) : (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%', backgroundColor: '#212121' }}
          center={DEFAULT_CENTER}
          zoom={14}
          options={{
            styles: DARK_MAP_STYLES,
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onIdle={onBoundsChanged}
        >
          {/* Current Location Marker */}
          {props.clientLocation && (
              <MarkerF
                  position={props.clientLocation}
                  icon={{
                      url: createSvgIcon(hasActiveRequest ? ICONS_SVG.raisingHand : ICONS_SVG.user),
                      scaledSize: new google.maps.Size(40, 40),
                      anchor: new google.maps.Point(20, 40)
                  }}
                  onClick={() => setSelectedLocation({ 
                      type: 'current', 
                      position: props.clientLocation, 
                      info: props.currentAddress 
                  })}
                  zIndex={2000}
              />
          )}

          {/* Info Window (Custom Overlay) */}
          {selectedLocation && (
              <OverlayViewF
                  position={selectedLocation.position}
                  mapPaneName={OverlayViewF.OVERLAY_FLOAT_PANE}
              >
                  <div className="relative bg-black border border-white/20 p-4 rounded-xl shadow-2xl min-w-[200px] -translate-x-1/2 -translate-y-[140%] animate-in fade-in zoom-in duration-200 z-[3000]">
                      <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-black border-r border-b border-white/20 transform rotate-45"></div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedLocation(null); }} className="absolute top-2 right-2 text-zinc-400 hover:text-white"><X className="w-3 h-3"/></button>
                      
                      <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2 flex items-center gap-2">
                          {selectedLocation.type === 'current' ? <User className="w-3 h-3"/> : <MapPin className="w-3 h-3"/>}
                          {selectedLocation.type === 'current' ? 'Mi Ubicación' : 'Guardado'}
                      </h3>
                      <div className="text-white font-bold text-sm leading-tight">{selectedLocation.info}</div>
                  </div>
              </OverlayViewF>
          )}

          {/* Saved Addresses */}
          {props.role === UserRole.CLIENT && props.savedAddresses.map(addr => {
              const isHome = addr.name.toLowerCase().includes('casa');
              const isWork = addr.name.toLowerCase().includes('trabajo');
              const iconSvg = isHome ? ICONS_SVG.home : isWork ? ICONS_SVG.briefcase : ICONS_SVG.default;
              
              return (
                  <MarkerF
                      key={`addr-${addr.id}`}
                      position={{ lat: addr.coordinates.x, lng: addr.coordinates.y }}
                      icon={{
                          url: createSvgIcon(iconSvg),
                          scaledSize: new google.maps.Size(40, 40),
                          anchor: new google.maps.Point(20, 40) // Bottom center anchor for pin
                      }}
                      title={addr.name}
                      onClick={() => setSelectedLocation({
                          type: 'saved',
                          position: { lat: addr.coordinates.x, lng: addr.coordinates.y },
                          info: addr.address
                      })}
                  />
              );
          })}

          {/* Clusters & Markers */}
          {clusters.map(cluster => {
              const [lng, lat] = cluster.geometry.coordinates;
              const { cluster: isCluster, point_count: pointCount, cluster_id: clusterId } = cluster.properties;
              
              if (isCluster) {
                  const size = Math.min(30 + (pointCount / clusters.length) * 40, 60);
                  return (
                      <OverlayViewF
                          key={`cluster-${clusterId}`}
                          position={{ lat, lng }}
                          mapPaneName={OverlayViewF.OVERLAY_MOUSE_TARGET}
                      >
                          <div 
                              className="cluster-marker-div flex items-center justify-center bg-white text-black rounded-full font-bold shadow-lg border-2 border-black cursor-pointer hover:scale-110 transition-transform transform -translate-x-1/2 -translate-y-1/2"
                              style={{ width: size, height: size }}
                              onClick={(e) => {
                                  e.stopPropagation();
                                  const expansionZoom = Math.min(index.getClusterExpansionZoom(clusterId), 18);
                                  mapRef.current?.setZoom(expansionZoom);
                                  mapRef.current?.panTo({ lat, lng });
                              }}
                          >
                              {pointCount}
                          </div>
                      </OverlayViewF>
                  );
              }

              // Individual Marker
              if (cluster.properties.type === 'provider') {
                  const p = cluster.properties.provider;
                  const isSelected = props.selectedProvider?.id === p.id;
                  const svg = (ICONS_SVG as any)[p.categoryId] || ICONS_SVG.default;
                  
                  return (
                      <MarkerF
                          key={`prov-${p.id}`}
                          position={{ lat, lng }}
                          icon={{
                              url: createSvgIcon(svg),
                              scaledSize: new google.maps.Size(40, 40),
                              anchor: new google.maps.Point(20, 20)
                          }}
                          onClick={() => props.onSelectProvider(p)}
                          zIndex={isSelected ? 1000 : 100}
                      />
                  );
              } else {
                  const r = cluster.properties.request;
                  const isMine = r.ownerId === 'current_user';
                  
                  let svg;
                  if (props.role === UserRole.PROVIDER) {
                      svg = ICONS_SVG.raisingHand;
                  } else {
                      svg = isMine ? ICONS_SVG.raisingHand : ((ICONS_SVG as any)[r.category.id] || ICONS_SVG.default);
                  }
                  
                  return (
                      <MarkerF
                          key={`req-${r.id}`}
                          position={{ lat, lng }}
                          icon={{
                              url: createSvgIcon(svg),
                              scaledSize: new google.maps.Size(40, 40),
                              anchor: new google.maps.Point(20, 20)
                          }}
                          onClick={() => props.onSelectPublicRequest(r)}
                      />
                  );
              }
          })}
        </GoogleMap>
      )}
      
      {/* Fixed Pin for Request Creation (Uber Style) */}
      {props.isCreatingRequest && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1500] pointer-events-none flex flex-col items-center">
              <div className="relative">
                  <div className="w-12 h-12 text-black drop-shadow-2xl" dangerouslySetInnerHTML={{ __html: ICONS_SVG.default }} />
                  <div className="w-2 h-2 bg-black/50 rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2 blur-sm"></div>
              </div>
              <div className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full mt-2 shadow-lg border border-white/20">
                  Ubicación de la solicitud
              </div>
          </div>
      )}
      
      {/* Search/Address Overlay */}
      <div className="absolute top-4 left-0 right-0 z-[1001] pointer-events-none flex flex-col items-center">
          <div onClick={props.onOpenAddressModal} className="bg-black/80 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full flex items-center gap-2 pointer-events-auto shadow-lg max-w-[90%] w-full cursor-pointer hover:bg-zinc-900 active:scale-95 transition-all">
              <MapPin className="w-4 h-4 text-white" />
              <div className="text-white text-xs font-bold uppercase truncate w-full">{props.currentAddress}</div>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
          </div>
      </div>

      {props.role === UserRole.CLIENT && !props.isCreatingRequest && (
        <div className="absolute top-20 left-4 right-4 z-[1001] flex justify-between items-start pointer-events-none">
           <div className="flex gap-2">
               <button onClick={() => setIsFilterOpen(true)} className="pointer-events-auto bg-black border border-white px-4 py-2 flex items-center gap-2 shadow-lg hover:bg-white hover:text-black transition-colors">
                 <Filter className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-widest">{CATEGORIES.find(c => c.id === props.filterCategory)?.name || 'Todos'}</span>
               </button>
               <button onClick={() => setShowPrices(!showPrices)} className={`pointer-events-auto border px-3 py-2 flex items-center gap-2 shadow-lg transition-colors ${showPrices ? 'bg-white text-black border-white' : 'bg-black text-white border-white'}`}>
                 <CircleDollarSign className="w-4 h-4" />
               </button>
           </div>
        </div>
      )}

      {/* Sheet UI for Creating Requests */}
      {props.isCreatingRequest && (
        <div className="absolute bottom-0 left-0 right-0 z-[2000] bg-black border-t border-zinc-800 p-6 animate-in slide-in-from-bottom-10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black uppercase text-white">Publicar Solicitud</h3>
                <button onClick={() => props.onSetIsCreatingRequest(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4 mb-4">
                <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-2 block">Rubro</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                          <button key={cat.id} onClick={() => setNewReqCat(cat.id)} className={`px-3 py-2 border text-xs font-bold uppercase whitespace-nowrap ${newReqCat === cat.id ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-500'}`}>{cat.name}</button>
                        ))}
                    </div>
                </div>
                <Input placeholder="Descripción (ej: Instalar aire acondicionado)" value={newReqDesc} onChange={e => setNewReqDesc(e.target.value)} />
                <Input placeholder="Oferta sugerida ($)" type="number" value={newReqOffer} onChange={e => setNewReqOffer(e.target.value)} />
            </div>
            <Button onClick={handleCreatePublicRequest} disabled={!newReqDesc}>PUBLICAR EN ESTA UBICACIÓN</Button>
        </div>
      )}

      {/* Selection Preview Card (Provider) */}
      {props.selectedProvider && props.role === UserRole.CLIENT && !props.isCreatingRequest && (
          <div className="absolute bottom-4 left-4 right-4 z-[1002] animate-in slide-in-from-bottom-10">
              <div className="bg-black border border-white p-6 shadow-2xl relative rounded-sm">
                  <button onClick={() => props.onSelectProvider(null)} className="absolute -top-3 right-4 bg-white text-black p-1"><X className="w-4 h-4" /></button>
                  {!props.isRequesting ? (
                      <>
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <div className="flex items-center gap-2 mb-1"><span className="text-[10px] bg-white text-black px-1 font-bold uppercase">{props.selectedProvider.categoryName}</span></div>
                                  <h3 className="text-xl font-black uppercase">{props.selectedProvider.name}</h3>
                                  <div className="flex items-center gap-2 mt-1"><Star className="w-3 h-3 fill-white text-white" /><span className="text-xs font-mono">{props.selectedProvider.rating} ({props.selectedProvider.reviewsCount})</span></div>
                              </div>
                              <button onClick={() => props.onViewClientProfile(props.selectedProvider!.name)} className="text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-1 border border-zinc-700 px-2 py-1 hover:text-white hover:border-white transition-all"><Eye className="w-3 h-3"/> Perfil</button>
                          </div>
                          <Button onClick={() => props.onSetIsRequesting(true)}>SOLICITAR AHORA</Button>
                      </>
                  ) : (
                      <div className="space-y-4">
                          <textarea value={props.requestDescription} onChange={(e) => props.onRequestDescriptionChange(e.target.value)} className="w-full h-24 bg-zinc-900 border border-zinc-700 p-3 text-white text-sm focus:border-white focus:outline-none placeholder:text-zinc-600 resize-none" placeholder="Describe tu problema..." />
                          <Button onClick={props.onSendRequest} disabled={!props.requestDescription}>CONFIRMAR ENVÍO</Button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Selection Preview Card (Public Request - For Providers) */}
      {props.selectedPublicRequest && props.role === UserRole.PROVIDER && (
          <div className="absolute bottom-4 left-4 right-4 z-[1002] animate-in slide-in-from-bottom-10">
              <div className="bg-black border border-white p-6 shadow-2xl relative rounded-sm">
                  <button onClick={() => props.onSelectPublicRequest(null)} className="absolute -top-3 right-4 bg-white text-black p-1"><X className="w-4 h-4" /></button>
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <div className="flex items-center gap-2 mb-1"><span className="text-[10px] bg-white text-black px-1 font-bold uppercase">{props.selectedPublicRequest.category.name}</span></div>
                          <h3 className="text-xl font-black uppercase">{props.selectedPublicRequest.clientId}</h3>
                          <div className="text-xs text-zinc-400 mt-1">{props.selectedPublicRequest.address}</div>
                      </div>
                      <div className="text-right">
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Oferta</div>
                          <div className="text-xl font-mono font-black text-green-400">{props.selectedPublicRequest.offerPrice}</div>
                      </div>
                  </div>
                  <div className="bg-zinc-900 p-3 border border-zinc-800 mb-4 text-sm text-zinc-300 italic">
                      "{props.selectedPublicRequest.description}"
                  </div>
                  <Button onClick={() => props.onApplyToRequest(props.selectedPublicRequest!.id)}>APLICAR A ESTA SOLICITUD</Button>
              </div>
          </div>
      )}

      {/* My Request Details (For Client) */}
      {props.selectedPublicRequest && props.role === UserRole.CLIENT && props.selectedPublicRequest.ownerId === 'current_user' && (
          <div className="absolute bottom-4 left-4 right-4 z-[1002] animate-in slide-in-from-bottom-10">
              <div className="bg-black border border-white p-6 shadow-2xl relative rounded-sm">
                  <button onClick={() => props.onSelectPublicRequest(null)} className="absolute -top-3 right-4 bg-white text-black p-1"><X className="w-4 h-4" /></button>
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] bg-red-500 text-white px-1 font-bold uppercase">MI SOLICITUD</span>
                              <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1 font-bold uppercase">{props.selectedPublicRequest.category.name}</span>
                          </div>
                          <h3 className="text-xl font-black uppercase">Buscando Profesional</h3>
                          <div className="text-xs text-zinc-400 mt-1">{props.selectedPublicRequest.address}</div>
                      </div>
                      <div className="text-right">
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mi Oferta</div>
                          <div className="text-xl font-mono font-black text-white">{props.selectedPublicRequest.offerPrice}</div>
                      </div>
                  </div>
                  <div className="bg-zinc-900 p-3 border border-zinc-800 mb-4 text-sm text-zinc-300 italic">
                      "{props.selectedPublicRequest.description}"
                  </div>
                  <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => props.onDeleteRequest(props.selectedPublicRequest!.id)}>CANCELAR SOLICITUD</Button>
                      <Button className="flex-1 bg-white text-black" onClick={() => props.onSelectPublicRequest(null)}>CERRAR</Button>
                  </div>
              </div>
          </div>
      )}

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} categories={CATEGORIES} currentCategory={props.filterCategory} onSelectCategory={props.onFilterChange} />
    </div>
  );
};
