
import React, { useRef, useEffect } from 'react';
import { ChevronDown, Star, User } from 'lucide-react';
import L from 'leaflet';
import { ProviderStore, ServiceOrder, UserRole } from '../../types';
import { Button } from '../../components/UIComponents';

export const TrackingView: React.FC<{
  role: UserRole;
  trackingOrder: ServiceOrder;
  providers: ProviderStore[];
  onMinimize: () => void;
  onCancel: () => void;
}> = ({ role, trackingOrder, providers, onMinimize, onCancel }) => {
    // Simplified map for tracking
    const mapRef = useRef<HTMLDivElement>(null);
    const mapObj = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || mapObj.current) return;
        const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
        mapObj.current = map;
    }, []);

    useEffect(() => {
        if (!mapObj.current) return;
        const map = mapObj.current;
        const start = trackingOrder.clientCoordinates;
        // Find provider coordinates
        const provider = providers.find(p => p.id === trackingOrder.providerId);
        const end = provider ? provider.coordinates : { x: start.x + 0.01, y: start.y + 0.01 }; // Mock if not found

        // Fit bounds
        const bounds = L.latLngBounds([start.x, start.y], [end.x, end.y]);
        map.fitBounds(bounds, { padding: [50, 50] });

        // Add markers
        L.marker([start.x, start.y], { icon: L.divIcon({ html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>`}) }).addTo(map);
        L.marker([end.x, end.y], { icon: L.divIcon({ html: `<div class="w-8 h-8 bg-black text-white border border-white flex items-center justify-center rounded-sm"><svg ...>...</svg></div>`}) }).addTo(map);

        // Simple line
        L.polyline([[start.x, start.y], [end.x, end.y]], { color: 'white', weight: 2, dashArray: '5, 10' }).addTo(map);
    }, [trackingOrder, providers]);

    return (
        <div className="absolute inset-0 z-[1000] bg-zinc-900 flex flex-col">
            <div className="flex-1 relative">
                <div ref={mapRef} className="w-full h-full opacity-50" />
                <button onClick={onMinimize} className="absolute top-4 left-4 z-[1100] bg-black text-white p-2 rounded-full"><ChevronDown /></button>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/80 px-4 py-2 rounded-full border border-white/20 backdrop-blur text-xs font-bold uppercase animate-pulse">
                        {trackingOrder.status === 'ACCEPTED' ? 'Proveedor en camino' : 'Trabajo en curso'}
                    </div>
                </div>
            </div>
            <div className="bg-black border-t border-zinc-800 p-6">
                 <div className="flex justify-between items-center mb-6">
                     <div>
                         <h2 className="text-2xl font-black uppercase text-white">{trackingOrder.providerName}</h2>
                         <div className="flex items-center gap-2 text-zinc-500 text-sm">
                             <Star className="w-4 h-4 text-white fill-white" /> 4.9 • Plomería
                         </div>
                     </div>
                     <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-600">
                         <User className="w-6 h-6 text-white" />
                     </div>
                 </div>
                 <div className="flex gap-4">
                     <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
                     <Button className="flex-1">Llamar / Chat</Button>
                 </div>
            </div>
        </div>
    );
};
