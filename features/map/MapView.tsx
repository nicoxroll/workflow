
import React, { useRef, useEffect, useState } from 'react';
import { 
  Wrench, Zap, Truck, Sparkles, MapPin, 
  Filter, LocateFixed, X, 
  ArrowRightCircle, ArrowLeft, Send, Check,
  CircleDollarSign, Eye, MessageCircle, Hand, Trash2, Star, User, ChevronDown
} from 'lucide-react';
import L from 'leaflet';
import { UserRole, ServiceCategory, ProviderStore, ServiceOrder, PublicRequest, RequestApplicant, SavedAddress } from '../../types';
import { Button, Input, FilterModal } from '../../components/UIComponents';

// Icons SVG strings
const ICONS_SVG = {
  plomeria: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  electricidad: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  mudanza: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`,
  limpieza: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>`,
  default: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  home: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  briefcase: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`
};

const DEFAULT_CENTER = [-34.6037, -58.3816];
const CATEGORIES: ServiceCategory[] = [
  { id: 'all', name: 'Todos', icon: 'grid' },
  { id: 'plomeria', name: 'Plomería', icon: 'wrench' },
  { id: 'electricidad', name: 'Electricidad', icon: 'zap' },
  { id: 'mudanza', name: 'Fletes', icon: 'truck' },
  { id: 'limpieza', name: 'Limpieza', icon: 'sparkles' },
];

// Helper to safely calculate distance
const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return Infinity;
  const R = 6371e3; // metres
  const q1 = lat1 * Math.PI/180; 
  const q2 = lat2 * Math.PI/180;
  const dq = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dq/2) * Math.sin(dq/2) + Math.cos(q1) * Math.cos(q2) * Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper: Check if coords are valid for Leaflet
const isValidLatLng = (lat: number | undefined, lng: number | undefined) => {
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
};

// Helper for address bar icon
const getSavedAddressIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('casa')) return <Home className="w-4 h-4 text-white" />;
    if (lower.includes('oficina') || lower.includes('trabajo')) return <Briefcase className="w-4 h-4 text-white" />;
    return <MapPin className="w-4 h-4 text-white" />;
};

// Component helpers for Icon rendering
const Home = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const Briefcase = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;

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

export const MapView: React.FC<MapViewProps> = ({
  role, providers, orders, publicRequests, selectedProvider, selectedOrder, selectedPublicRequest, myProviderProfile,
  filterCategory, isRequesting, requestDescription,
  onSelectProvider, onSelectOrder, onSelectPublicRequest, onRequestDescriptionChange, onSetIsRequesting,
  onSendRequest, onAcceptOrder, onRejectOrder, onApplyToRequest, onAcceptApplicant, onDeleteRequest, onViewClientProfile, onStartChat, onFilterChange, onAddPublicRequest,
  onOpenAddressModal, currentAddress, isCreatingRequest, onSetIsCreatingRequest, savedAddresses, clientLocation, onUpdateLocation, onMapCenterChange
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{[key: string]: L.Marker}>({});
  const radiusLayerRef = useRef<L.Circle | null>(null);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  
  const [newReqOffer, setNewReqOffer] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');
  const [newReqCat, setNewReqCat] = useState('plomeria');

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const map = L.map(mapContainerRef.current, { center: DEFAULT_CENTER as L.LatLngExpression, zoom: 14, zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 20 }).addTo(map);
    mapInstanceRef.current = map;

    map.on('click', () => {
       onSelectProvider(null);
       onSelectOrder(null);
       onSelectPublicRequest(null);
       onSetIsRequesting(false);
       onSetIsCreatingRequest(false);
    });
    
    map.on('locationfound', (e) => {
        if(isValidLatLng(e.latlng.lat, e.latlng.lng)) {
            onUpdateLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
            map.flyTo(e.latlng, 16);
        }
    });

    // Track map center movement for address picking
    const handleMove = () => {
        const c = map.getCenter();
        if (onMapCenterChange && isValidLatLng(c.lat, c.lng)) {
            onMapCenterChange(c.lat, c.lng);
        }
    }
    map.on('moveend', handleMove);
    // Initial center report
    handleMove();

    return () => { map.remove(); mapInstanceRef.current = null; }
  }, []);

  // Update map view when clientLocation changes externally
  useEffect(() => {
      if (mapInstanceRef.current && isValidLatLng(clientLocation.lat, clientLocation.lng)) {
          // Check if we are already close to prevent jitter loop
          const current = mapInstanceRef.current.getCenter();
          if (Math.abs(current.lat - clientLocation.lat) > 0.0001 || Math.abs(current.lng - clientLocation.lng) > 0.0001) {
              mapInstanceRef.current.flyTo([clientLocation.lat, clientLocation.lng], 16, {
                  animate: true,
                  duration: 1.5
              });
          }
      }
  }, [clientLocation]);

  const handleCreatePublicRequest = () => {
      if(!mapInstanceRef.current) return;
      const center = mapInstanceRef.current.getCenter();
      if (!isValidLatLng(center.lat, center.lng)) return;

      const cat = CATEGORIES.find(c => c.id === newReqCat) || CATEGORIES[1];
      
      onAddPublicRequest({
          coordinates: { x: center.lat, y: center.lng },
          description: newReqDesc,
          offerPrice: newReqOffer ? `$${newReqOffer}` : 'A Convenir',
          category: cat,
          address: currentAddress === 'Buenos Aires, Centro' ? 'Ubicación en Mapa' : currentAddress
      });
      onSetIsCreatingRequest(false);
      setNewReqDesc('');
      setNewReqOffer('');
  };

  const handleLocateMe = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.locate({ setView: true, maxZoom: 16 });
  };
  
  const getCategoryIcon = (catId: string) => {
      switch(catId) {
          case 'plomeria': return <Wrench className="w-6 h-6 text-black" />;
          case 'electricidad': return <Zap className="w-6 h-6 text-black fill-black" />;
          case 'mudanza': return <Truck className="w-6 h-6 text-black" />;
          case 'limpieza': return <Sparkles className="w-6 h-6 text-black" />;
          default: return <MapPin className="w-6 h-6 text-black fill-black" />;
      }
  };

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const currentMarkers = markersRef.current;
    const activeIds = new Set();

    const myActiveRequestCategories = publicRequests
        .filter(r => r.ownerId === 'current_user' && r.status === 'OPEN')
        .map(r => r.category.id);

    const filteredProviders = providers.filter(p => {
        const catMatch = filterCategory === 'all' || p.categoryId === filterCategory;
        const distanceToClient = getDistanceInMeters(clientLocation.lat, clientLocation.lng, p.coordinates.x, p.coordinates.y);
        return catMatch && distanceToClient <= p.range;
    });

    if (role === UserRole.CLIENT) {
       if (radiusLayerRef.current) {
           map.removeLayer(radiusLayerRef.current);
           radiusLayerRef.current = null;
       }

       savedAddresses.forEach(addr => {
           if (!isValidLatLng(addr.coordinates.x, addr.coordinates.y)) return;
           activeIds.add(addr.id);
           const isHome = addr.name.toLowerCase().includes('casa');
           const isWork = addr.name.toLowerCase().includes('trabajo') || addr.name.toLowerCase().includes('oficina');
           const iconHtml = isHome ? ICONS_SVG.home : isWork ? ICONS_SVG.briefcase : ICONS_SVG.default;
           
           const markerHtml = `
             <div class="flex flex-col items-center">
                <div class="w-8 h-8 bg-zinc-800 border border-zinc-600 text-white flex items-center justify-center rounded-full shadow-lg">
                   ${iconHtml}
                </div>
                <div class="text-[8px] font-bold bg-black text-white px-1 mt-1 border border-zinc-700 uppercase tracking-wider whitespace-nowrap">${addr.name}</div>
             </div>
           `;

           if (currentMarkers[addr.id]) {
               currentMarkers[addr.id].setLatLng([addr.coordinates.x, addr.coordinates.y]);
               currentMarkers[addr.id].setIcon(L.divIcon({ html: markerHtml, className: '', iconSize: [40, 50], iconAnchor: [20, 25] }));
           } else {
               const m = L.marker([addr.coordinates.x, addr.coordinates.y], { icon: L.divIcon({ html: markerHtml, className: '', iconSize: [40, 50], iconAnchor: [20, 25] }) }).addTo(map);
               currentMarkers[addr.id] = m;
           }
       });

       filteredProviders.forEach(prov => {
          if (!isValidLatLng(prov.coordinates.x, prov.coordinates.y)) return;
          activeIds.add(prov.id);
          const isSelected = selectedProvider?.id === prov.id;
          const svgIcon = (ICONS_SVG as any)[prov.categoryId] || ICONS_SVG.default;
          const isRecommended = myActiveRequestCategories.includes(prov.categoryId);
          const showPrice = showPrices;

          const markerHtml = `
              <div class="relative flex flex-col items-center justify-center group transition-all duration-300 ${isSelected ? 'scale-125 z-50' : ''}">
                  <div class="w-10 h-10 ${isSelected ? 'bg-white text-black' : (isRecommended ? 'bg-blue-500 text-white shadow-blue-500' : 'bg-black text-white')} border ${isRecommended ? 'border-blue-300' : 'border-white'} flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.4)] rounded-sm">
                  ${svgIcon}
                  </div>
                  ${isRecommended ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></div>' : ''}
                  ${showPrice ? `<div class="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[8px] font-bold px-1 rounded-sm border border-white whitespace-nowrap shadow-sm z-50">${prov.priceBase}</div>` : ''}
              </div>`;
          if (currentMarkers[prov.id]) {
              currentMarkers[prov.id].setIcon(L.divIcon({ html: markerHtml, className: '', iconSize: [40, 48], iconAnchor: [20, 48] }));
              currentMarkers[prov.id].setZIndexOffset(isSelected ? 900 : (isRecommended ? 800 : 0));
          } else {
              const marker = L.marker([prov.coordinates.x, prov.coordinates.y], { icon: L.divIcon({ html: markerHtml, className: '', iconSize: [40, 48], iconAnchor: [20, 48] }) }).addTo(map);
              marker.on('click', (e) => { 
                L.DomEvent.stopPropagation(e); 
                onSelectProvider(prov); 
                onSelectOrder(null); 
                onSelectPublicRequest(null); 
              });
              currentMarkers[prov.id] = marker;
          }
       });

       publicRequests.filter(r => r.status === 'OPEN' && r.ownerId === 'current_user').forEach(req => {
           if (!isValidLatLng(req.coordinates.x, req.coordinates.y)) return;
           activeIds.add(req.id);
           const isSelected = selectedPublicRequest?.id === req.id;
           const reqHtml = `
              <div class="flex flex-col items-center group">
                  <div class="w-12 h-12 bg-blue-600 border-2 border-white text-white flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)] z-20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
                  </div>
              </div>`;
           if(currentMarkers[req.id]) {
               currentMarkers[req.id].setIcon(L.divIcon({ html: reqHtml, className: '', iconSize: [60, 80], iconAnchor: [30, 40] }));
           } else {
               const marker = L.marker([req.coordinates.x, req.coordinates.y], { icon: L.divIcon({ html: reqHtml, className: '', iconSize: [60, 80], iconAnchor: [30, 40] }) }).addTo(map);
               marker.on('click', (e) => { L.DomEvent.stopPropagation(e); onSelectPublicRequest(req); onSelectOrder(null); onSelectProvider(null); });
               currentMarkers[req.id] = marker;
           }
       });
    }

    if (role === UserRole.PROVIDER && isValidLatLng(myProviderProfile.coordinates.x, myProviderProfile.coordinates.y)) {
       const meId = 'me_' + myProviderProfile.id;
       activeIds.add(meId);
       const meHtml = `<div class="flex flex-col items-center"><div class="bg-black text-white text-[8px] font-bold px-1 border border-white mb-1 uppercase">Mi Ubicación</div><div class="w-8 h-8 bg-zinc-800 text-white border-2 border-white flex items-center justify-center rounded-full">${ICONS_SVG.electricidad}</div></div>`;
       if(!currentMarkers[meId]) currentMarkers[meId] = L.marker([myProviderProfile.coordinates.x, myProviderProfile.coordinates.y], { icon: L.divIcon({ html: meHtml, className: '', iconSize: [60, 60], iconAnchor: [30, 40] }), zIndexOffset: 999 }).addTo(map);

       if (radiusLayerRef.current) {
           radiusLayerRef.current.setLatLng([myProviderProfile.coordinates.x, myProviderProfile.coordinates.y]);
           radiusLayerRef.current.setRadius(myProviderProfile.range);
       } else {
           radiusLayerRef.current = L.circle([myProviderProfile.coordinates.x, myProviderProfile.coordinates.y], {
               radius: myProviderProfile.range,
               color: '#3b82f6',
               fillColor: '#3b82f6',
               fillOpacity: 0.1,
               weight: 1,
               dashArray: '5, 5'
           }).addTo(map);
       }

       orders.filter(o => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(o.status)).forEach(order => {
          if (!isValidLatLng(order.clientCoordinates.x, order.clientCoordinates.y)) return;
          activeIds.add(order.id);
          const isSelected = selectedOrder?.id === order.id;
          const markerHtml = `<div class="relative flex flex-col items-center justify-center group transition-all duration-300 ${isSelected ? 'scale-125 z-50' : ''}"><div class="w-10 h-10 ${isSelected ? 'bg-green-500 text-black' : 'bg-black text-green-500'} border-2 border-green-500 flex items-center justify-center shadow-[0_0_15px_rgba(74,222,128,0.4)] rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div></div>`;
          if (currentMarkers[order.id]) currentMarkers[order.id].setIcon(L.divIcon({ html: markerHtml, className: '', iconSize: [40, 48], iconAnchor: [20, 48] }));
          else {
              const marker = L.marker([order.clientCoordinates.x, order.clientCoordinates.y], { icon: L.divIcon({ html: markerHtml, className: '', iconSize: [40, 48], iconAnchor: [20, 48] }) }).addTo(map);
              marker.on('click', (e) => { L.DomEvent.stopPropagation(e); onSelectOrder(order); onSelectProvider(null); onSelectPublicRequest(null); });
              currentMarkers[order.id] = marker;
          }
       });
       publicRequests.filter(r => r.status === 'OPEN').forEach(req => {
           if (!isValidLatLng(req.coordinates.x, req.coordinates.y)) return;
           activeIds.add(req.id);
           const isSelected = selectedPublicRequest?.id === req.id;
           const svgIcon = (ICONS_SVG as any)[req.category.id] || ICONS_SVG.default;
           const reqHtml = `<div class="flex flex-col items-center transition-transform ${isSelected ? 'scale-110' : ''}"><div class="w-10 h-10 bg-white text-black flex items-center justify-center rounded-full border-2 border-zinc-400 shadow-[0_0_10px_rgba(255,255,255,0.5)] z-20">${svgIcon}</div><div class="bg-white text-black text-[9px] font-bold px-1 rounded-sm mt-1 border border-zinc-300 shadow-sm whitespace-nowrap">${req.offerPrice}</div></div>`;
           if (currentMarkers[req.id]) currentMarkers[req.id].setIcon(L.divIcon({ html: reqHtml, className: '', iconSize: [40, 60], iconAnchor: [20, 30] }));
           else {
              const marker = L.marker([req.coordinates.x, req.coordinates.y], { icon: L.divIcon({ html: reqHtml, className: '', iconSize: [40, 60], iconAnchor: [20, 30] }) }).addTo(map);
              marker.on('click', (e) => { L.DomEvent.stopPropagation(e); onSelectPublicRequest(req); onSelectOrder(null); onSelectProvider(null); });
              currentMarkers[req.id] = marker;
           }
       });
    }
    Object.keys(currentMarkers).forEach(id => { if (!activeIds.has(id)) { map.removeLayer(currentMarkers[id]); delete currentMarkers[id]; } });
  }, [role, providers, orders, publicRequests, selectedProvider, selectedOrder, selectedPublicRequest, filterCategory, clientLocation, currentAddress, myProviderProfile, savedAddresses, showPrices]);

  const activeCatName = CATEGORIES.find(c => c.id === filterCategory)?.name || 'Todos';

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-0 right-0 z-[500] pointer-events-none">
          <div className="flex flex-col items-center">
              <div 
                  onClick={onOpenAddressModal}
                  className={`bg-black/80 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full flex items-center gap-2 pointer-events-auto shadow-lg max-w-[90%] w-full transition-all cursor-pointer hover:bg-zinc-900 active:scale-95`}
              >
                  {getSavedAddressIcon(currentAddress)}
                  <div className="text-white text-xs font-bold uppercase truncate w-full">{currentAddress}</div>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
              </div>
          </div>
      </div>

      {role === UserRole.CLIENT && !isCreatingRequest && (
      <div className="absolute top-20 left-4 right-4 z-[500] flex justify-between items-start pointer-events-none">
         <div className="flex gap-2">
             <button onClick={() => setIsFilterOpen(true)} className="pointer-events-auto bg-black border border-white px-4 py-2 flex items-center gap-2 shadow-lg hover:bg-white hover:text-black transition-colors">
               <Filter className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-widest">{activeCatName}</span>
             </button>
             <button onClick={() => setShowPrices(!showPrices)} className={`pointer-events-auto border px-3 py-2 flex items-center gap-2 shadow-lg transition-colors ${showPrices ? 'bg-white text-black border-white' : 'bg-black text-white border-white'}`}>
               <CircleDollarSign className="w-4 h-4" />
             </button>
         </div>
      </div>
      )}

      {role === UserRole.CLIENT && !isCreatingRequest && !isRequesting && (
          <div className="absolute bottom-28 right-4 z-[500] pointer-events-auto">
             <button onClick={handleLocateMe} className="w-12 h-12 bg-black border border-white flex items-center justify-center hover:bg-zinc-800 shadow-xl transition-transform active:scale-95"><LocateFixed className="w-6 h-6 text-white" /></button>
          </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full bg-zinc-900 z-0" />

      {isCreatingRequest && (
          <>
             <div className="absolute inset-0 z-[400] pointer-events-none flex items-center justify-center">
                 <div className="relative -mt-8">
                     <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center border-2 border-black shadow-2xl z-10 relative animate-bounce">
                         {getCategoryIcon(newReqCat)}
                     </div>
                     <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-1 h-8 bg-black"></div>
                     <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full w-4 h-1 bg-black/50 blur-[2px] rounded-full"></div>
                 </div>
             </div>
             <div className="absolute bottom-[80px] left-0 right-0 z-[2000] bg-black border-t border-zinc-800 p-6 animate-in slide-in-from-bottom-10">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-black uppercase text-white">Publicar Solicitud</h3>
                     <button onClick={() => onSetIsCreatingRequest(false)}><X className="w-6 h-6" /></button>
                 </div>
                 <div className="space-y-4 mb-4">
                     <div>
                         <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-2 block">Rubro</label>
                         <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                             {CATEGORIES.filter(c => c.id !== 'all').map(cat => (<button key={cat.id} onClick={() => setNewReqCat(cat.id)} className={`px-3 py-2 border text-xs font-bold uppercase whitespace-nowrap ${newReqCat === cat.id ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-500'}`}>{cat.name}</button>))}
                         </div>
                     </div>
                     <Input placeholder="Descripción (ej: Instalar aire acondicionado)" value={newReqDesc} onChange={e => setNewReqDesc(e.target.value)} />
                     <Input placeholder="Oferta sugerida ($)" type="number" icon={<span className="text-zinc-500 text-lg">$</span>} value={newReqOffer} onChange={e => setNewReqOffer(e.target.value)} />
                 </div>
                 <Button onClick={handleCreatePublicRequest} disabled={!newReqDesc}>PUBLICAR EN ESTA UBICACIÓN</Button>
             </div>
          </>
      )}

      {selectedProvider && role === UserRole.CLIENT && !isCreatingRequest && (
          <div className="absolute bottom-[80px] left-0 right-0 z-[600] p-4 animate-in slide-in-from-bottom-10 duration-300">
              <div className="bg-black border border-white p-6 shadow-[0_-5px_20px_rgba(0,0,0,0.8)] relative">
                  <button onClick={() => onSelectProvider(null)} className="absolute -top-3 right-4 bg-white text-black p-1 hover:scale-110 transition-transform"><X className="w-4 h-4" /></button>
                  {!isRequesting ? (
                      <>
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <div className="flex items-center gap-2 mb-1"><span className="text-[10px] bg-white text-black px-1 font-bold uppercase">{selectedProvider.categoryName}</span><span className={`text-[10px] font-bold uppercase ${selectedProvider.status === 'OPEN' ? 'text-green-500' : 'text-red-500'}`}>{selectedProvider.status === 'OPEN' ? '• Disponible' : '• Ocupado'}</span></div>
                                  <h3 className="text-xl font-black uppercase">{selectedProvider.name}</h3>
                                  <div className="flex items-center gap-2 mt-1"><Star className="w-3 h-3 fill-white text-white" /><span className="text-xs font-mono">{selectedProvider.rating} ({selectedProvider.reviewsCount})</span></div>
                              </div>
                              <button onClick={() => onViewClientProfile(selectedProvider.name)} className="text-[10px] font-bold uppercase text-zinc-400 hover:text-white flex items-center gap-1 border border-zinc-700 px-2 py-1 rounded-sm"><Eye className="w-3 h-3"/> Ver Tienda</button>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-4 border-y border-zinc-800 py-4">
                              <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-zinc-500" /><div><p className="text-[9px] text-zinc-500 uppercase">Base</p><p className="text-xs font-bold uppercase text-white truncate max-w-[100px]">{selectedProvider.address}</p></div></div>
                              <div className="flex items-center gap-3"><CircleDollarSign className="w-4 h-4 text-zinc-500" /><div><p className="text-[9px] text-zinc-500 uppercase">Tarifa Ref.</p><p className="text-xs font-bold uppercase text-white">{selectedProvider.priceBase}</p></div></div>
                          </div>
                          <Button onClick={() => onSetIsRequesting(true)} disabled={selectedProvider.status !== 'OPEN'}>PEDIR SERVICIO <ArrowRightCircle className="w-4 h-4" /></Button>
                      </>
                  ) : (
                      <div className="animate-in fade-in slide-in-from-right-10">
                          <button onClick={() => onSetIsRequesting(false)} className="flex items-center gap-1 text-[10px] font-bold uppercase text-zinc-500 mb-4 hover:text-white"><ArrowLeft className="w-3 h-3" /> Volver</button>
                          <div className="mb-4">
                              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-2 block">Describe tu problema</label>
                              <textarea value={requestDescription} onChange={(e) => onRequestDescriptionChange(e.target.value)} className="w-full h-24 bg-zinc-900 border border-zinc-700 p-3 text-white text-sm focus:border-white focus:outline-none placeholder:text-zinc-600 resize-none" placeholder="Ej: Tengo una gotera bajo la bacha de la cocina..." autoFocus />
                          </div>
                           <Button onClick={onSendRequest} disabled={!requestDescription}>CONFIRMAR SOLICITUD <Send className="w-4 h-4" /></Button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {selectedPublicRequest && (
          <div className="absolute bottom-[80px] left-0 right-0 z-[600] p-4 animate-in slide-in-from-bottom-10 duration-300">
              <div className="bg-black border-2 border-white p-6 shadow-[0_-5px_20px_rgba(0,0,0,0.8)] relative">
                  <button onClick={() => onSelectPublicRequest(null)} className="absolute -top-3 right-4 bg-zinc-800 text-white p-1 hover:scale-110 transition-transform"><X className="w-4 h-4" /></button>
                  <div className="mb-4">
                       <div className="flex justify-between items-start">
                           <div>
                               <div className="inline-block bg-white text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest mb-2">
                                  {selectedPublicRequest.ownerId === 'current_user' ? 'MI SOLICITUD' : 'SOLICITUD PÚBLICA'}
                               </div>
                               <h3 className="text-xl font-black uppercase text-white mb-1">{selectedPublicRequest.category.name}</h3>
                               <h4 className="text-sm font-bold text-zinc-300 mb-1">{selectedPublicRequest.clientId}</h4>
                           </div>
                           {role === UserRole.PROVIDER && (
                               <div className="flex flex-col items-end gap-2">
                                   <button onClick={() => onViewClientProfile(selectedPublicRequest.clientId)} className="text-[10px] underline text-zinc-400 hover:text-white">Ver Perfil</button>
                                   <button onClick={() => onStartChat(selectedPublicRequest.clientId, selectedPublicRequest.id)} className="bg-zinc-800 text-white px-3 py-1 text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-zinc-700">
                                       <MessageCircle className="w-3 h-3" /> Chat
                                   </button>
                               </div>
                           )}
                       </div>
                       <p className="text-zinc-400 text-sm italic mt-2">"{selectedPublicRequest.description}"</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 border-y border-zinc-800 py-4">
                      <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-white" /><div><p className="text-[9px] text-zinc-500 uppercase">Ubicación</p><p className="text-xs font-bold uppercase text-white truncate max-w-[120px]">{selectedPublicRequest.address}</p></div></div>
                      <div className="flex items-center gap-3"><CircleDollarSign className="w-4 h-4 text-white" /><div><p className="text-[9px] text-zinc-500 uppercase">Oferta</p><p className="text-xs font-bold uppercase text-white">{selectedPublicRequest.offerPrice}</p></div></div>
                  </div>

                  {role === UserRole.PROVIDER && (
                      <div className="flex gap-2">
                          {selectedPublicRequest.applicants.some(a => a.providerId === myProviderProfile.id) ? (
                              <Button disabled className="bg-zinc-800 text-zinc-500 border-zinc-800">YA TE HAS POSTULADO</Button>
                          ) : (
                              <>
                                <Button variant="secondary" onClick={() => onSelectPublicRequest(null)}>Ignorar</Button>
                                <Button className="bg-white text-black border-white hover:bg-zinc-200" onClick={() => onApplyToRequest(selectedPublicRequest)}>
                                   <Hand className="w-4 h-4" /> ENVIAR POSTULACIÓN
                                </Button>
                              </>
                          )}
                      </div>
                  )}

                  {role === UserRole.CLIENT && selectedPublicRequest.ownerId === 'current_user' && (
                      <div className="flex flex-col gap-3">
                          <div className="bg-zinc-900 border border-zinc-700 p-3">
                              <h5 className="text-[10px] font-bold uppercase text-zinc-500 mb-2 flex items-center gap-2"><User className="w-3 h-3"/> Postulantes ({selectedPublicRequest.applicants.length})</h5>
                              {selectedPublicRequest.applicants.length === 0 ? (
                                  <p className="text-xs text-zinc-600 italic">Aún no hay interesados.</p>
                              ) : (
                                  <div className="space-y-2">
                                      {selectedPublicRequest.applicants.map(app => (
                                          <div key={app.providerId} className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                              <div>
                                                  <div className="text-xs font-bold text-white">{app.providerName}</div>
                                                  <div className="text-[10px] text-zinc-400 flex items-center gap-1"><Star className="w-2 h-2 text-white fill-white"/> {app.rating}</div>
                                              </div>
                                              <Button className="w-auto h-7 py-0 px-3 text-[9px]" onClick={() => onAcceptApplicant(selectedPublicRequest.id, app)}>CONTRATAR</Button>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                          <Button variant="secondary" className="border-red-900 text-red-500 hover:bg-red-900/20" onClick={() => onDeleteRequest(selectedPublicRequest.id)}>
                              <Trash2 className="w-4 h-4" /> FINALIZAR / BORRAR
                          </Button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {selectedOrder && role === UserRole.PROVIDER && (
          <div className="absolute bottom-[80px] left-0 right-0 z-[600] p-4 animate-in slide-in-from-bottom-10 duration-300">
              <div className="bg-black border-2 border-green-500 p-6 shadow-[0_-5px_20px_rgba(0,0,0,0.8)] relative">
                  <button onClick={() => onSelectOrder(null)} className="absolute -top-3 right-4 bg-zinc-800 text-white p-1 hover:scale-110 transition-transform"><X className="w-4 h-4" /></button>
                  <div className="mb-4">
                       <div className="flex justify-between items-start">
                           <div className="inline-block bg-green-500 text-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest mb-2">{selectedOrder.status === 'PENDING' ? 'Nueva Solicitud' : 'Detalle'}</div>
                           <button onClick={() => onViewClientProfile(selectedOrder.clientId)} className="text-[10px] underline text-zinc-400 hover:text-white">Ver Perfil Cliente</button>
                       </div>
                       <h3 className="text-xl font-black uppercase text-white mb-1">{selectedOrder.clientId}</h3>
                       <p className="text-zinc-400 text-sm italic">"{selectedOrder.description}"</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 border-y border-zinc-800 py-4">
                      <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-green-500" /><div><p className="text-[9px] text-zinc-500 uppercase">Ubicación</p><p className="text-xs font-bold uppercase text-white truncate max-w-[120px]">{selectedOrder.location}</p></div></div>
                      <div className="flex items-center gap-3"><CircleDollarSign className="w-4 h-4 text-green-500" /><div><p className="text-[9px] text-zinc-500 uppercase">Oferta</p><p className="text-xs font-bold uppercase text-white">{selectedOrder.priceEstimate}</p></div></div>
                  </div>
                  {selectedOrder.status === 'PENDING' ? (
                      <div className="flex gap-2">
                          <Button variant="secondary" onClick={() => onRejectOrder(selectedOrder.id)}>Rechazar</Button>
                          <Button className="bg-green-500 text-black border-green-500 hover:bg-green-400" onClick={() => onAcceptOrder(selectedOrder)}>ACEPTAR <Check className="w-4 h-4" /></Button>
                      </div>
                  ) : (
                      <Button variant="outline" onClick={() => onAcceptOrder(selectedOrder)}>Ver Seguimiento</Button>
                  )}
              </div>
          </div>
      )}

      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} categories={CATEGORIES} currentCategory={filterCategory} onSelectCategory={(id) => onFilterChange(id)} />
    </div>
  );
};
