
import React, { useState, useEffect, useRef } from 'react';
import { 
  Wrench, Zap, Truck, Sparkles, MapPin, 
  User, List, Plus, Search, Map as MapIcon, 
  LogOut, Filter, Crosshair, Navigation, History,
  ArrowRight, Star, Briefcase
} from 'lucide-react';
import L from 'leaflet';
import { UserRole, ServiceRequest, ServiceCategory, ProviderProfile } from './types';
import { Button, Input, CategoryChip, RequestItem, Rating, VerifiedBadge, FilterModal } from './components/UIComponents';

// --- DATA CONSTANTS ---
const CATEGORIES: ServiceCategory[] = [
  { id: 'all', name: 'Todos', icon: 'grid' },
  { id: 'plomeria', name: 'Plomería', icon: 'wrench' },
  { id: 'electricidad', name: 'Electricidad', icon: 'zap' },
  { id: 'mudanza', name: 'Fletes', icon: 'truck' },
  { id: 'limpieza', name: 'Limpieza', icon: 'sparkles' },
];

// Buenos Aires Center
const MAP_CENTER = [-34.6037, -58.3816];

const MOCK_REQUESTS: ServiceRequest[] = [
  {
    id: '1',
    categoryId: 'plomeria',
    categoryName: 'Plomería',
    description: 'Fuga masiva cocina',
    location: 'Av. Libertador 2200',
    status: 'IN_PROGRESS',
    priceEstimate: '$25.000',
    createdAt: Date.now(),
    coordinates: { x: -34.6037, y: -58.3816 }, // Obelisco approx
    providerLocation: { x: -34.6050, y: -58.3850 }, 
    eta: '5 min'
  },
  {
    id: '2',
    categoryId: 'mudanza',
    categoryName: 'Fletes',
    description: 'Mudar sofá 3cpo',
    location: 'Palermo Hollywood',
    status: 'PENDING',
    priceEstimate: '$15.000',
    createdAt: Date.now() - 86400000,
    coordinates: { x: -34.5862, y: -58.4312 }
  },
  {
    id: '3',
    categoryId: 'electricidad',
    categoryName: 'Electricidad',
    description: 'Cortocircuito tablero',
    location: 'Belgrano R',
    status: 'COMPLETED',
    priceEstimate: '$40.000',
    createdAt: Date.now() - 172800000,
    coordinates: { x: -34.5733, y: -58.4611 }
  },
  {
    id: '4',
    categoryId: 'limpieza',
    categoryName: 'Limpieza',
    description: 'Limpieza post obra',
    location: 'Recoleta',
    status: 'PENDING',
    priceEstimate: '$30.000',
    createdAt: Date.now() - 10000000,
    coordinates: { x: -34.5895, y: -58.3974 }
  },
  {
    id: '5',
    categoryId: 'plomeria',
    categoryName: 'Plomería',
    description: 'Destapación inodoro',
    location: 'San Telmo',
    status: 'PENDING',
    priceEstimate: '$18.000',
    createdAt: Date.now() - 5000000,
    coordinates: { x: -34.6212, y: -58.3731 }
  },
  {
    id: '6',
    categoryId: 'electricidad',
    categoryName: 'Electricidad',
    description: 'Instalar luminarias LED',
    location: 'Puerto Madero',
    status: 'PENDING',
    priceEstimate: '$22.000',
    createdAt: Date.now() - 2000000,
    coordinates: { x: -34.6118, y: -58.3648 }
  }
];

const MOCK_PROFILE: ProviderProfile = {
  id: 'p1',
  name: 'Esteban "El Rayo" K.',
  role: 'Electricista Matriculado',
  rating: 4.8,
  reviewsCount: 124,
  verified: true,
  skills: ['Alta Tensión', 'Hogar', 'Urgencias 24hs']
};

// --- APP COMPONENT ---
export default function App() {
  const [role, setRole] = useState<UserRole>(UserRole.GUEST);
  const [authStep, setAuthStep] = useState<'login' | 'role_select' | 'done'>('login');
  
  const [view, setView] = useState<string>('map'); 
  const [activeTab, setActiveTab] = useState('map');
  const [requests, setRequests] = useState<ServiceRequest[]>(MOCK_REQUESTS);
  const [filterCategory, setFilterCategory] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Create Request State
  const [formDesc, setFormDesc] = useState('');
  const [formCat, setFormCat] = useState('plomeria');

  // Tracking State
  const [trackingReq, setTrackingReq] = useState<ServiceRequest | null>(null);

  // --- LOGIC ---

  const handleLogin = () => {
    // Simulate API delay
    setTimeout(() => {
      setAuthStep('role_select');
    }, 1000);
  };

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setAuthStep('done');
    setView('map');
  };

  const handleCreateRequest = () => {
    const newReq: ServiceRequest = {
      id: Date.now().toString(),
      categoryId: formCat,
      categoryName: CATEGORIES.find(c => c.id === formCat)?.name || 'Varios',
      description: formDesc,
      location: 'Ubicación Actual',
      status: 'PENDING',
      createdAt: Date.now(),
      coordinates: { x: -34.6037 + (Math.random() * 0.01), y: -58.3816 + (Math.random() * 0.01) } 
    };
    setRequests([newReq, ...requests]);
    setView('map');
    setFormDesc('');
  };

  const filteredRequests = filterCategory === 'all' 
    ? requests 
    : requests.filter(r => r.categoryId === filterCategory);

  // --- VIEWS ---

  const AuthScreen = () => (
    <div className="flex flex-col h-screen bg-black text-white p-8 relative overflow-hidden">
      {/* Abstract Grid Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="flex-1 flex flex-col justify-center z-10">
        <div className="w-16 h-16 border-2 border-white flex items-center justify-center mb-6 animate-pulse">
          <Crosshair className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-6xl font-black uppercase tracking-tighter leading-none mb-4">
          Servi<br/>Ya_Arg
        </h1>
        <p className="text-zinc-400 font-mono text-sm max-w-[200px] mb-12">
          ACCESO SEGURO AL MERCADO DE SERVICIOS v2.0
        </p>

        {authStep === 'login' && (
          <div className="space-y-4">
             <Button variant="google" onClick={handleLogin}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continuar con Google
             </Button>
             <div className="text-center text-[10px] text-zinc-600 mt-4 uppercase">
               Al continuar aceptas los Términos de Servicio Protocolo 99
             </div>
          </div>
        )}

        {authStep === 'role_select' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <p className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Selecciona tu perfil</p>
            <Button onClick={() => handleRoleSelect(UserRole.CLIENT)} variant="primary">
              BUSCO SERVICIO
            </Button>
            <Button onClick={() => handleRoleSelect(UserRole.PROVIDER)} variant="outline">
              SOY PROFESIONAL
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const TrackingView = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [eta, setEta] = useState(4);
    const [currentStreet, setCurrentStreet] = useState("Av. Corrientes");
    
    useEffect(() => {
        if (!mapContainerRef.current) return;
        
        let animationFrameId: number;
        let resizeTimeout: any;

        // --- 1. Init Map ---
        const map = L.map(mapContainerRef.current, {
            center: [-34.6045, -58.3835], // Initial Center
            zoom: 16,
            zoomControl: false,
            attributionControl: false
        });

        // Use setTimeout to force invalidation after mount
        resizeTimeout = setTimeout(() => map.invalidateSize(), 100);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
             subdomains: 'abcd',
             maxZoom: 20
        }).addTo(map);

        // --- 2. Define Route (Provider -> Client) ---
        const routePoints: L.LatLngExpression[] = [
            [-34.6050, -58.3850],
            [-34.6045, -58.3850],
            [-34.6045, -58.3840],
            [-34.6040, -58.3840],
            [-34.6040, -58.3820],
            [-34.6037, -58.3816]
        ];

        // Draw Polyline (Route)
        L.polyline(routePoints, { 
            color: 'white', 
            weight: 3, 
            opacity: 0.8, 
            dashArray: '8, 8' 
        }).addTo(map);

        // --- 3. Markers ---
        
        // Destination Marker (Client)
        const destIcon = L.divIcon({
            html: '<div class="w-4 h-4 bg-white border-2 border-black rotate-45 shadow-[0_0_15px_white]"></div>',
            className: 'bg-transparent',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
        L.marker(routePoints[routePoints.length - 1], { icon: destIcon }).addTo(map);

        // Provider Marker
        const providerIcon = L.divIcon({
            html: `
              <div class="flex flex-col items-center">
                 <div class="bg-black text-white text-[8px] font-bold px-1 border border-white mb-1 whitespace-nowrap shadow-lg">EN CAMINO</div>
                 <div class="w-8 h-8 bg-white text-black flex items-center justify-center border-2 border-black rounded-sm shadow-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                 </div>
              </div>`,
            className: 'bg-transparent',
            iconSize: [60, 60],
            iconAnchor: [30, 50]
        });
        const providerMarker = L.marker(routePoints[0], { icon: providerIcon, zIndexOffset: 1000 }).addTo(map);

        // --- 4. Animation Logic ---
        let startTime: number | null = null;
        const duration = 12000; // 12 seconds simulation

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            
            // Calculate position along path
            const totalPoints = routePoints.length - 1;
            const floatIndex = progress * totalPoints;
            const index = Math.floor(floatIndex);
            const nextIndex = Math.min(index + 1, totalPoints);
            const segmentProgress = floatIndex - index;

            const p1 = routePoints[index] as [number, number];
            const p2 = routePoints[nextIndex] as [number, number];
            
            const currentLat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
            const currentLng = p1[1] + (p2[1] - p1[1]) * segmentProgress;

            // FIX: Check if map is still valid before updating
            if (map) {
                providerMarker.setLatLng([currentLat, currentLng]);
                map.panTo([currentLat, currentLng], { animate: false }); // Follow marker
            }

            // Mock Data Updates
            if (progress < 0.3) setCurrentStreet("Av. Corrientes");
            else if (progress < 0.6) setCurrentStreet("Carlos Pellegrini");
            else setCurrentStreet("Llegando a destino...");

            setEta(Math.ceil(4 * (1 - progress)));

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearTimeout(resizeTimeout);
            map.remove();
        };

    }, []);

    return (
      <div className="h-screen bg-black flex flex-col relative overflow-hidden">
        {/* Header Overlay */}
        <div className="absolute top-0 w-full z-[1000] p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pointer-events-none">
           <button onClick={() => setView('list')} className="pointer-events-auto bg-black border border-white p-2 hover:bg-white hover:text-black transition-colors">
             <Navigation className="w-5 h-5" />
           </button>

           <div className="bg-black border border-white px-4 py-2 flex flex-col items-end">
             <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Ubicación Actual</span>
             <span className="text-sm font-bold text-white uppercase">{currentStreet}</span>
           </div>
        </div>

        {/* Real Leaflet Map */}
        <div ref={mapContainerRef} className="flex-1 w-full bg-zinc-900 z-0" />

        {/* Bottom Info Card */}
        <div className="bg-black border-t border-white p-6 pb-24 z-20">
           <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-black uppercase text-white mb-1 animate-pulse">En Camino</h2>
                <p className="text-zinc-500 text-xs">Tu profesional llegará pronto.</p>
              </div>
              <div className="bg-white text-black px-3 py-1 font-mono font-bold text-xl border border-zinc-500">
                {eta} <span className="text-[10px] align-top">MIN</span>
              </div>
           </div>
           
           <div className="flex items-center gap-4 border border-zinc-800 p-4 mb-4 bg-zinc-900/30">
              <div className="w-12 h-12 bg-zinc-800 flex items-center justify-center border border-zinc-700">
                <User className="text-zinc-400 w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase text-white tracking-wider">{MOCK_PROFILE.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex text-white"><Star className="w-3 h-3 fill-white" /></div>
                  <span className="text-xs font-mono">{MOCK_PROFILE.rating}</span>
                  <span className="text-[9px] text-zinc-500 uppercase ml-2">• {MOCK_PROFILE.role}</span>
                </div>
              </div>
           </div>

           <div className="flex gap-2">
              <Button variant="primary" className="flex-1">Contactar</Button>
              <Button variant="outline" className="w-1/3">Cancelar</Button>
           </div>
        </div>
      </div>
    );
  };

  const MapView = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    // Initial Map Setup
    useEffect(() => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: MAP_CENTER as L.LatLngExpression,
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Fix for "Half Black" map render issue
      // Invalidate size after a short delay to ensure container is fully rendered
      const resizeTimeout = setTimeout(() => {
        map.invalidateSize();
      }, 200);

      // Free Dark Mode Tiles (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      mapInstanceRef.current = map;

      return () => {
        clearTimeout(resizeTimeout);
        map.remove();
        mapInstanceRef.current = null;
      }
    }, []);

    // Update Markers when requests or filter changes
    useEffect(() => {
      if (!mapInstanceRef.current) return;
      const map = mapInstanceRef.current;

      // Clear existing markers (brute force for prototype)
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      // Add Markers
      filteredRequests.filter(r => r.status !== 'COMPLETED').forEach(req => {
        // Create custom icon
        const iconHtml = `
          <div class="relative flex flex-col items-center justify-center group">
             <div class="w-8 h-8 bg-black border border-white flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-transform group-hover:scale-110">
               ${req.status === 'IN_PROGRESS' 
                 ? '<div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>' 
                 : '<div class="w-3 h-3 border border-white rotate-45"></div>'}
             </div>
          </div>
        `;
        
        const customIcon = L.divIcon({
          html: iconHtml,
          className: '', // remove default styles
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([req.coordinates.x, req.coordinates.y] as L.LatLngExpression, { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div class="text-center font-sans">
              <div class="font-bold text-xs mb-1 uppercase">${req.categoryName}</div>
              <div class="text-zinc-400 text-[9px] mb-1">${req.priceEstimate}</div>
              <div class="text-[8px] bg-zinc-900 px-1 py-0.5 border border-zinc-700 inline-block">${req.status === 'PENDING' ? 'DISPONIBLE' : 'EN CURSO'}</div>
            </div>
          `);
        
        marker.on('click', () => {
           if (req.status === 'IN_PROGRESS') {
             setTrackingReq(req);
             setView('tracking');
           } else {
             setView('request-detail');
           }
        });
      });

    }, [filteredRequests, role]);

    const activeCatName = CATEGORIES.find(c => c.id === filterCategory)?.name || 'Todos';

    return (
      <div className="relative h-screen bg-black overflow-hidden flex flex-col">
        {/* Clean Filter Bar */}
        <div className="absolute top-4 left-4 right-4 z-[500] flex justify-between items-start pointer-events-none">
           <button 
             onClick={() => setIsFilterOpen(true)}
             className="pointer-events-auto bg-black border border-white px-4 py-2 flex items-center gap-2 shadow-lg hover:bg-white hover:text-black transition-colors"
           >
             <Filter className="w-4 h-4" />
             <span className="text-xs font-bold uppercase tracking-widest">{activeCatName}</span>
           </button>
           
           <div className="pointer-events-auto w-10 h-10 bg-black border border-white flex items-center justify-center hover:bg-zinc-900 active:bg-zinc-800 cursor-pointer transition-colors">
              <Crosshair className="w-5 h-5 text-white" onClick={() => {
                mapInstanceRef.current?.setView(MAP_CENTER as L.LatLngExpression, 14);
                mapInstanceRef.current?.invalidateSize();
              }} />
           </div>
        </div>

        {/* Real Leaflet Map */}
        <div ref={mapContainerRef} className="w-full h-full bg-zinc-900 z-0" />

        {/* Floating Action Button for Client */}
        {role === UserRole.CLIENT && (
          <div className="absolute bottom-24 right-6 z-[500]">
            <button 
              onClick={() => setView('create')}
              className="w-14 h-14 bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)] border border-transparent hover:border-black"
            >
              <Plus strokeWidth={3} />
            </button>
          </div>
        )}
        
        <FilterModal 
          isOpen={isFilterOpen} 
          onClose={() => setIsFilterOpen(false)} 
          categories={CATEGORIES}
          currentCategory={filterCategory}
          onSelectCategory={(id) => setFilterCategory(id)}
        />
      </div>
    );
  };

  const CreateRequestView = () => (
    <div className="h-screen bg-black flex flex-col pt-12 pb-24 overflow-y-auto">
      <div className="px-6 mb-8">
        <h2 className="text-3xl font-black uppercase mb-1">Nueva<br/>Solicitud</h2>
        <div className="h-1 w-12 bg-white"></div>
      </div>

      <div className="flex-1 px-6 space-y-8">
        <div>
          <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-2 block">Categoría</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
              <button
                key={cat.id}
                onClick={() => setFormCat(cat.id)}
                className={`p-4 border text-left text-xs font-bold uppercase transition-all ${formCat === cat.id ? 'bg-white text-black border-white' : 'bg-black text-zinc-500 border-zinc-800 hover:border-zinc-500'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <Input 
          label="Descripción del problema" 
          placeholder="DESCRIBÍ EL PROBLEMA..." 
          value={formDesc}
          onChange={(e) => setFormDesc(e.target.value)}
        />
        
        <div className="p-4 border border-zinc-800 bg-zinc-900/20">
          <div className="flex items-center gap-2 text-white mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-mono">UBICACIÓN ACTUAL DETECTADA</span>
          </div>
          <div className="w-full h-24 bg-zinc-900 relative opacity-50 border border-zinc-800 flex items-center justify-center">
             <span className="text-[10px] font-mono text-zinc-500">MAPA PREVIEW</span>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-zinc-900 bg-black mt-auto">
        <Button onClick={handleCreateRequest} disabled={!formDesc}>
          PUBLICAR EN RED
        </Button>
        <button onClick={() => setView('map')} className="w-full text-center mt-4 text-xs text-zinc-500 hover:text-white uppercase tracking-wider">
          Cancelar
        </button>
      </div>
    </div>
  );

  const ListView = () => {
    const activeRequests = filteredRequests.filter(r => r.status !== 'COMPLETED');
    const historyRequests = filteredRequests.filter(r => r.status === 'COMPLETED');

    return (
      <div className="h-screen bg-black flex flex-col pt-12 pb-24">
        <div className="px-6 mb-6">
           <h2 className="text-3xl font-black uppercase">Actividad</h2>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {activeRequests.length > 0 && (
            <div className="mb-8">
              <div className="px-6 mb-2 flex items-center gap-2 text-white">
                 <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                 <h3 className="text-xs font-bold uppercase tracking-widest">En Curso</h3>
              </div>
              {activeRequests.map(req => (
                <RequestItem 
                  key={req.id}
                  title={req.categoryName}
                  status={req.status}
                  location={req.location}
                  price={req.priceEstimate}
                  onClick={() => {
                     if (req.status === 'IN_PROGRESS') {
                       setTrackingReq(req);
                       setView('tracking');
                     } else {
                       setView('request-detail');
                     }
                  }}
                />
              ))}
            </div>
          )}

          <div>
             <div className="px-6 mb-2 flex items-center gap-2 text-zinc-500">
                 <History className="w-3 h-3" />
                 <h3 className="text-xs font-bold uppercase tracking-widest">Historial</h3>
             </div>
             {historyRequests.map(req => (
                <RequestItem 
                  key={req.id}
                  title={req.categoryName}
                  status={req.status}
                  location={req.location}
                  price={req.priceEstimate}
                  date={req.createdAt}
                  onClick={() => setView('request-detail')}
                />
             ))}
             {historyRequests.length === 0 && (
                <div className="px-6 text-zinc-600 text-xs font-mono py-4">No hay historial disponible.</div>
             )}
          </div>
        </div>
      </div>
    );
  };

  const ProfileView = () => (
    <div className="h-screen bg-black pt-12 px-6 flex flex-col pb-24 overflow-y-auto">
      {/* Role Switcher */}
      <div className="flex border border-zinc-800 mb-8 p-1 bg-zinc-900/50">
        <button 
          onClick={() => setRole(UserRole.CLIENT)}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${role === UserRole.CLIENT ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
        >
          Modo Cliente
        </button>
        <button 
          onClick={() => setRole(UserRole.PROVIDER)}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${role === UserRole.PROVIDER ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
        >
          Modo Profesional
        </button>
      </div>

      <div className="mb-8 text-center flex flex-col items-center animate-in slide-in-from-bottom-5 duration-500">
        <div className="w-24 h-24 bg-zinc-900 border border-zinc-700 mb-4 flex items-center justify-center relative">
           <User className="w-10 h-10 text-zinc-500" />
           {role === UserRole.PROVIDER && (
             <div className="absolute -bottom-2 bg-white text-black text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest">
                Nivel 4
             </div>
           )}
        </div>
        <h2 className="text-2xl font-black uppercase text-white mb-1">{MOCK_PROFILE.name}</h2>
        {role === UserRole.PROVIDER ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <VerifiedBadge />
              <span className="text-xs text-zinc-500 font-mono">{MOCK_PROFILE.role}</span>
            </div>
            <Rating value={MOCK_PROFILE.rating} />
          </>
        ) : (
          <div className="text-zinc-500 text-xs font-mono">Usuario Frecuente</div>
        )}
      </div>

      <div className="space-y-6 flex-1">
        
        {role === UserRole.PROVIDER && (
          <>
            <div>
              <h3 className="text-[10px] uppercase font-bold text-zinc-600 mb-2 tracking-widest border-b border-zinc-900 pb-1">Habilidades</h3>
              <div className="flex flex-wrap gap-2">
                {MOCK_PROFILE.skills.map(skill => (
                  <span key={skill} className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-mono">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] uppercase font-bold text-zinc-600 mb-2 tracking-widest border-b border-zinc-900 pb-1">Estadísticas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-zinc-800">
                  <p className="text-2xl font-black text-white">98%</p>
                  <p className="text-[9px] text-zinc-500 uppercase">Tasa de Éxito</p>
                </div>
                <div className="p-3 border border-zinc-800">
                  <p className="text-2xl font-black text-white">124</p>
                  <p className="text-[9px] text-zinc-500 uppercase">Trabajos</p>
                </div>
              </div>
            </div>
          </>
        )}

        {role === UserRole.CLIENT && (
          <div>
              <h3 className="text-[10px] uppercase font-bold text-zinc-600 mb-2 tracking-widest border-b border-zinc-900 pb-1">Mis Direcciones</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 border border-zinc-800 text-sm">
                   <MapPin className="w-4 h-4 text-zinc-500" />
                   <span>Casa (Av. Libertador 2200)</span>
                </div>
                <div className="flex items-center gap-3 p-3 border border-zinc-800 text-sm">
                   <Briefcase className="w-4 h-4 text-zinc-500" />
                   <span>Oficina (Microcentro)</span>
                </div>
              </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Button variant="outline" onClick={() => { setRole(UserRole.GUEST); setAuthStep('login'); setView('map'); }}>
          <LogOut className="w-4 h-4" /> CERRAR SESIÓN
        </Button>
      </div>
    </div>
  );

  // --- NAVIGATION BAR ---
  const NavBar = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-900 z-[1000] flex">
      <button 
        onClick={() => { setActiveTab('map'); setView('map'); }}
        className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 border-r border-zinc-900 hover:bg-zinc-900/30 transition-colors ${activeTab === 'map' ? 'text-white' : 'text-zinc-600'}`}
      >
        <MapIcon className="w-5 h-5" />
        <span className="text-[8px] uppercase tracking-widest font-bold">Mapa</span>
      </button>

      <button 
        onClick={() => { setActiveTab('activity'); setView('list'); }}
        className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 border-r border-zinc-900 hover:bg-zinc-900/30 transition-colors ${activeTab === 'activity' ? 'text-white' : 'text-zinc-600'}`}
      >
        <List className="w-5 h-5" />
        <span className="text-[8px] uppercase tracking-widest font-bold">Actividad</span>
      </button>

      <button 
        onClick={() => { setActiveTab('profile'); setView('profile'); }}
        className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 hover:bg-zinc-900/30 transition-colors ${activeTab === 'profile' ? 'text-white' : 'text-zinc-600'}`}
      >
        <User className="w-5 h-5" />
        <span className="text-[8px] uppercase tracking-widest font-bold">Perfil</span>
      </button>
    </div>
  );

  // --- RENDER ---
  if (authStep !== 'done') return <AuthScreen />;

  return (
    <div className="bg-black min-h-screen text-white max-w-md mx-auto relative shadow-[0_0_50px_rgba(255,255,255,0.1)] overflow-hidden font-sans border-x border-zinc-900">
      
      {view === 'map' && <MapView />}
      {view === 'create' && <CreateRequestView />}
      {view === 'profile' && <ProfileView />}
      {view === 'list' && <ListView />}
      {view === 'tracking' && <TrackingView />}

      {view === 'request-detail' && (
         <div className="h-screen bg-black pt-12 px-6 pb-24">
            <button onClick={() => setView('map')} className="text-zinc-500 mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-white"><Navigation className="w-3 h-3"/> Volver al mapa</button>
            <div className="border border-white p-6 relative bg-zinc-950">
               <div className="absolute top-0 right-0 bg-white text-black px-2 py-1 text-[10px] font-bold uppercase">Pendiente</div>
               <h2 className="text-2xl font-black uppercase mb-2">Plomería</h2>
               <p className="text-zinc-400 mb-6">Fuga masiva en cocina, requiere atención urgente.</p>
               
               <div className="space-y-4 mb-8">
                 <div className="flex justify-between border-b border-zinc-900 pb-2">
                    <span className="text-xs uppercase text-zinc-600 font-bold">Ubicación</span>
                    <span className="text-xs text-white">Av. Libertador 2200</span>
                 </div>
                 <div className="flex justify-between border-b border-zinc-900 pb-2">
                    <span className="text-xs uppercase text-zinc-600 font-bold">Estimado</span>
                    <span className="text-xs text-white font-mono">$25.000</span>
                 </div>
               </div>

               {role === UserRole.PROVIDER && (
                 <Button onClick={() => {
                   // Simulate accepting and going to tracking
                   setTrackingReq({ ...MOCK_REQUESTS[0], status: 'IN_PROGRESS' });
                   setView('tracking');
                 }}>Aplicar al Trabajo</Button>
               )}
            </div>
         </div>
      )}

      <NavBar />
    </div>
  );
}
