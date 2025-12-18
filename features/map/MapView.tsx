
import React, { useRef, useEffect, useState, useMemo } from 'react';
import Supercluster from 'supercluster';
import { 
  Wrench, Zap, Truck, Sparkles, MapPin, 
  Filter, X, CircleDollarSign, Eye, Star, User, ChevronDown
} from 'lucide-react';
import { UserRole, ServiceCategory, ProviderStore, ServiceOrder, PublicRequest, RequestApplicant, SavedAddress } from '../../types';
import { Button, Input, FilterModal } from '../../components/UIComponents';

const ICONS_SVG = {
  plomeria: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  electricidad: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  mudanza: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`,
  limpieza: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>`,
  default: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`,
  home: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  briefcase: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`
};

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];

const CATEGORIES: ServiceCategory[] = [
  { id: 'all', name: 'Todos', icon: 'grid' },
  { id: 'plomeria', name: 'Plomería', icon: 'wrench' },
  { id: 'electricidad', name: 'Electricidad', icon: 'zap' },
  { id: 'mudanza', name: 'Fletes', icon: 'truck' },
  { id: 'limpieza', name: 'Limpieza', icon: 'sparkles' },
];

interface MapViewProps {
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
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [newReqOffer, setNewReqOffer] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');
  const [newReqCat, setNewReqCat] = useState('plomeria');
  
  const [zoom, setZoom] = useState(14);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);

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
      points.push({
        type: 'Feature',
        properties: { cluster: false, request: req, type: 'request' },
        geometry: { type: 'Point', coordinates: [req.coordinates.y, req.coordinates.x] }
      });
    });

    index.load(points);
    if (bounds) setBounds([...bounds]);
  }, [props.providers, props.publicRequests, props.filterCategory, props.role, index]);

  // Leaflet Initialization
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // @ts-ignore
    const L = window.L;
    if (!L) return;

    const map = L.map(containerRef.current, {
        center: DEFAULT_CENTER,
        zoom: 14,
        zoomControl: false, // DESACTIVADO
        attributionControl: false // DESACTIVADO (Marca de agua)
    });

    // Dark Tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    mapRef.current = map;

    const updateView = () => {
      setZoom(map.getZoom());
      const b = map.getBounds();
      setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
      props.onMapCenterChange?.(map.getCenter().lat, map.getCenter().lng);
    };

    map.on('moveend', updateView);
    map.on('zoomend', updateView);
    
    // Initial update
    updateView();

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // External location fly
  useEffect(() => {
    if (mapRef.current && props.clientLocation) {
      mapRef.current.flyTo([props.clientLocation.lat, props.clientLocation.lng], 16);
    }
  }, [props.clientLocation]);

  // Sync Markers
  useEffect(() => {
    if (!mapRef.current || !bounds) return;
    const map = mapRef.current;
    // @ts-ignore
    const L = window.L;
    const activeIds = new Set<string>();

    // 1. Saved Addresses
    if (props.role === UserRole.CLIENT) {
      props.savedAddresses.forEach(addr => {
        const id = `addr-${addr.id}`;
        activeIds.add(id);
        if (!markersRef.current.has(id)) {
          const isHome = addr.name.toLowerCase().includes('casa');
          const isWork = addr.name.toLowerCase().includes('trabajo');
          const iconHtml = isHome ? ICONS_SVG.home : isWork ? ICONS_SVG.briefcase : ICONS_SVG.default;
          
          const icon = L.divIcon({
            html: `<div class="flex flex-col items-center">
                    <div class="w-8 h-8 bg-zinc-800 border border-zinc-600 text-white flex items-center justify-center rounded-full shadow-lg">${iconHtml}</div>
                    <div class="text-[8px] font-bold bg-black text-white px-1 mt-1 border border-zinc-700 uppercase tracking-wider whitespace-nowrap">${addr.name}</div>
                   </div>`,
            className: '',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });
          
          const marker = L.marker([addr.coordinates.x, addr.coordinates.y], { icon }).addTo(map);
          markersRef.current.set(id, marker);
        }
      });
    }

    // 2. Clusters
    const clusters = index.getClusters(bounds, Math.floor(zoom));
    clusters.forEach(cluster => {
      const [lng, lat] = cluster.geometry.coordinates;
      const { cluster: isCluster, point_count: pointCount, cluster_id: clusterId } = cluster.properties;
      const id = isCluster 
          ? `cluster-${clusterId}` 
          : (cluster.properties.type === 'provider' ? `prov-${cluster.properties.provider.id}` : `req-${cluster.properties.request.id}`);
      
      activeIds.add(id);

      if (markersRef.current.has(id)) {
        markersRef.current.get(id).setLatLng([lat, lng]);
        return;
      }

      let icon;
      if (isCluster) {
        const size = Math.min(30 + (pointCount / clusters.length) * 40, 60);
        icon = L.divIcon({
          html: `<span>${pointCount}</span>`,
          className: 'cluster-marker-div',
          iconSize: [size, size],
          iconAnchor: [size/2, size/2]
        });
      } else {
        if (cluster.properties.type === 'provider') {
          const p = cluster.properties.provider;
          const isSelected = props.selectedProvider?.id === p.id;
          const svg = (ICONS_SVG as any)[p.categoryId] || ICONS_SVG.default;
          icon = L.divIcon({
            html: `<div class="relative flex flex-col items-center justify-center transition-all ${isSelected ? 'scale-125 z-[5000]' : ''}">
                    <div class="w-10 h-10 ${isSelected ? 'bg-white text-black' : 'bg-black text-white'} border border-white flex items-center justify-center shadow-lg rounded-sm">${svg}</div>
                    ${showPrices ? `<div class="absolute -bottom-4 bg-green-500 text-black text-[8px] font-bold px-1 rounded-sm border border-white shadow-sm">${p.priceBase}</div>` : ''}
                   </div>`,
            className: '',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });
        } else {
          const r = cluster.properties.request;
          const isMine = r.ownerId === 'current_user';
          const svg = (ICONS_SVG as any)[r.category.id] || ICONS_SVG.default;
          icon = L.divIcon({
            html: `<div class="flex flex-col items-center">
                    <div class="w-10 h-10 ${isMine ? 'bg-blue-600' : 'bg-white text-black'} border-2 border-white flex items-center justify-center rounded-full shadow-lg">
                      ${isMine ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>' : svg}
                    </div>
                    ${!isMine ? `<div class="bg-white text-black text-[9px] font-bold px-1 rounded-sm mt-1 border border-zinc-300 shadow-sm whitespace-nowrap">${r.offerPrice}</div>` : ''}
                   </div>`,
            className: '',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });
        }
      }

      const marker = L.marker([lat, lng], { icon }).addTo(map);
      marker.on('click', (e: any) => {
        L.DomEvent.stopPropagation(e);
        if (isCluster) {
          const expansionZoom = Math.min(index.getClusterExpansionZoom(clusterId), 18);
          map.flyTo([lat, lng], expansionZoom);
        } else {
          if (cluster.properties.type === 'provider') props.onSelectProvider(cluster.properties.provider);
          else props.onSelectPublicRequest(cluster.properties.request);
        }
      });
      markersRef.current.set(id, marker);
    });

    // Cleanup
    markersRef.current.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

  }, [bounds, zoom, props.providers, props.publicRequests, props.selectedProvider, showPrices]);

  const handleCreatePublicRequest = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    const cat = CATEGORIES.find(c => c.id === newReqCat) || CATEGORIES[1];
    
    props.onAddPublicRequest({
        coordinates: { x: center.lat, y: center.lng },
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
    <div className="relative w-full h-full overflow-hidden">
      <div ref={containerRef} className="w-full h-full z-0" />
      <div className="leaflet-vignette" />
      
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

      {/* Selection Preview Card */}
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

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} categories={CATEGORIES} currentCategory={props.filterCategory} onSelectCategory={props.onFilterChange} />
    </div>
  );
};
