
import React, { useRef, useEffect, useState } from 'react';
import { ChevronDown, Star, User, Navigation, Clock, MapPin, ChevronUp, Info } from 'lucide-react';
import { ProviderStore, ServiceOrder, UserRole } from '../../types';
import { Button } from '../../components/UIComponents';

export const TrackingView: React.FC<{
  role: UserRole;
  trackingOrder: ServiceOrder;
  providers: ProviderStore[];
  onMinimize: () => void;
  onCancel: () => void;
}> = ({ role, trackingOrder, providers, onMinimize, onCancel }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const routingControlRef = useRef<any>(null);
    const [eta, setEta] = useState<string>('Calculando...');
    const [showDetails, setShowDetails] = useState(false);

    const provider = providers.find(p => p.id === trackingOrder.providerId);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        
        // @ts-ignore
        const L = window.L;
        if (!L || !L.Routing) return;

        const startCoords = [trackingOrder.clientCoordinates.x, trackingOrder.clientCoordinates.y];
        const endCoords = provider ? [provider.coordinates.x, provider.coordinates.y] : [startCoords[0] + 0.008, startCoords[1] + 0.008];

        // Inicializar Mapa
        const map = L.map(containerRef.current, {
          center: startCoords,
          zoom: 15,
          zoomControl: false,
          attributionControl: false
        });

        // Capa Oscura Premium
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 20
        }).addTo(map);

        mapRef.current = map;

        // Definir Iconos Personalizados
        const clientIcon = L.divIcon({
          className: 'w-6 h-6 bg-blue-500 rounded-full border-2 border-white nav-pulse',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const provIcon = L.divIcon({
          html: `<div class="w-10 h-10 bg-black text-white border-2 border-white flex items-center justify-center rounded-sm shadow-xl overflow-hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>`,
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        // Configurar Ruteo Real (Leaflet Routing Machine)
        const routingControl = L.Routing.control({
          waypoints: [
            L.latLng(endCoords[0], endCoords[1]), // Profesional
            L.latLng(startCoords[0], startCoords[1]) // Cliente
          ],
          routeWhileDragging: false,
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: true,
          show: false, 
          lineOptions: {
            styles: [{ color: '#3b82f6', opacity: 0.8, weight: 6 }]
          },
          createMarker: (i: number, waypoint: any) => {
            return L.marker(waypoint.latLng, {
              icon: i === 0 ? provIcon : clientIcon,
              zIndexOffset: 1000
            });
          }
        }).addTo(map);

        routingControlRef.current = routingControl;

        routingControl.on('routesfound', (e: any) => {
          const routes = e.routes;
          const summary = routes[0].summary;
          const minutes = Math.round(summary.totalTime / 60);
          setEta(`${minutes} min`);
        });

        return () => {
          if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
          }
        };
    }, [trackingOrder, providers]);

    return (
        <div className="absolute inset-0 z-[2500] bg-zinc-900 flex flex-col animate-in slide-in-from-bottom-20 duration-500">
            <div className="flex-1 relative">
                <div ref={containerRef} className="w-full h-full" />
                <div className="leaflet-vignette" />
                
                <button onClick={onMinimize} className="absolute top-4 left-4 z-[2600] bg-black/80 backdrop-blur text-white p-3 rounded-full hover:bg-white hover:text-black transition-all shadow-xl">
                    <ChevronDown className="w-6 h-6" />
                </button>
                
                <div className="absolute top-4 right-4 z-[2600] bg-blue-600 text-white px-4 py-2 rounded-full font-black text-sm shadow-lg flex items-center gap-2">
                    <Clock className="w-4 h-4" /> {eta}
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2600] pointer-events-none">
                    <div className="bg-black/90 px-6 py-2 border border-white/20 backdrop-blur text-[10px] font-black uppercase tracking-widest text-white shadow-2xl rounded-full">
                        {trackingOrder.status === 'ACCEPTED' ? 'Profesional en camino' : 'Trabajo iniciado'}
                    </div>
                </div>
            </div>

            {/* Bottom Sheet UI */}
            <div className="bg-black border-t border-zinc-800 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden">
                {/* Expandable Details Section */}
                <div className={`transition-all duration-500 ease-in-out ${showDetails ? 'max-h-60 opacity-100 border-b border-zinc-900' : 'max-h-0 opacity-0'}`}>
                    <div className="p-6 space-y-4 bg-zinc-950">
                        <div className="flex items-start gap-3">
                            <div className="mt-1"><div className="w-2 h-2 rounded-full bg-zinc-500"></div></div>
                            <div>
                                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Punto de Partida</div>
                                <div className="text-xs text-zinc-300 font-medium">{provider?.address || 'Ubicación del profesional'}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div></div>
                            <div>
                                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Destino (Tu domicilio)</div>
                                <div className="text-xs text-zinc-100 font-bold">{trackingOrder.location}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-700 shadow-inner overflow-hidden">
                                <User className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase text-white tracking-tight leading-tight">{trackingOrder.providerName}</h2>
                                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold">
                                    <Star className="w-3 h-3 text-white fill-white" /> 4.9 • MATRICULADO
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <button 
                                onClick={() => setShowDetails(!showDetails)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase transition-all ${showDetails ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500'}`}
                            >
                                {showDetails ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                {showDetails ? 'Ocultar' : 'Direcciones'}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-8 bg-zinc-900/50 p-4 border border-zinc-800/50 rounded-sm">
                        <div>
                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Costo del Servicio</div>
                            <div className="text-lg font-mono text-white font-black">{trackingOrder.priceEstimate}</div>
                        </div>
                        <div className="h-8 w-px bg-zinc-800"></div>
                        <div className="text-right">
                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Tiempo Estimado</div>
                            <div className="text-lg font-mono text-blue-400 font-black">{eta}</div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1 border-zinc-800 text-zinc-500 hover:border-red-500 hover:text-red-500" onClick={onCancel}>CANCELAR</Button>
                        <Button className="flex-[2] bg-white text-black font-black">ABRIR CHAT</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
