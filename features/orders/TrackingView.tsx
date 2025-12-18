
import React, { useRef, useEffect, useState } from 'react';
import { ChevronDown, Star, User, Navigation, Clock } from 'lucide-react';
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

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        
        // @ts-ignore
        const L = window.L;
        if (!L || !L.Routing) return;

        const startCoords = [trackingOrder.clientCoordinates.x, trackingOrder.clientCoordinates.y];
        const provider = providers.find(p => p.id === trackingOrder.providerId);
        // Coordenadas del profesional (si no hay, simulamos una cercana)
        const endCoords = provider ? [provider.coordinates.x, provider.coordinates.y] : [startCoords[0] + 0.008, startCoords[1] + 0.008];

        // Inicializar Mapa
        const map = L.map(containerRef.current, {
          center: startCoords,
          zoom: 15,
          zoomControl: false, // DESACTIVADO
          attributionControl: false // DESACTIVADO
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
          show: false, // Ocultamos el panel de texto
          lineOptions: {
            styles: [{ color: '#3b82f6', opacity: 0.8, weight: 6 }]
          },
          createMarker: (i: number, waypoint: any) => {
            // Personalizar marcadores dentro del ruteo
            return L.marker(waypoint.latLng, {
              icon: i === 0 ? provIcon : clientIcon,
              zIndexOffset: 1000
            });
          }
        }).addTo(map);

        routingControlRef.current = routingControl;

        // Escuchar cuando se calcula la ruta para obtener el tiempo estimado real
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

            <div className="bg-black border-t border-zinc-800 p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                 <div className="flex justify-between items-center mb-8">
                     <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-700 shadow-inner overflow-hidden">
                             <User className="w-8 h-8 text-white" />
                         </div>
                         <div>
                             <h2 className="text-2xl font-black uppercase text-white tracking-tight leading-tight">{trackingOrder.providerName}</h2>
                             <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold">
                                 <Star className="w-4 h-4 text-white fill-white" /> 4.9 • MATRICULADO
                             </div>
                         </div>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] text-zinc-500 uppercase font-black">Total Estimado</div>
                        <div className="text-xl font-mono text-white font-black">{trackingOrder.priceEstimate}</div>
                     </div>
                 </div>
                 <div className="flex gap-4">
                     <Button variant="outline" className="flex-1 border-zinc-800 text-zinc-500 hover:border-red-500 hover:text-red-500" onClick={onCancel}>CANCELAR</Button>
                     <Button className="flex-[2] bg-white text-black font-black">ABRIR CHAT</Button>
                 </div>
            </div>
        </div>
    );
};
