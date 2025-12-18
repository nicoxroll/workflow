
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, OverlayViewF, MarkerF } from '@react-google-maps/api';
import { ChevronDown, Star, User, Navigation, Clock, MapPin, ChevronUp, Info, ArrowRight, Compass } from 'lucide-react';
import { ProviderStore, ServiceOrder, UserRole } from '../../types';
import { Button } from '../../components/UIComponents';

// --- SVG HELPERS ---
const createSvgIcon = (svgString: string, color: string = 'white') => {
    const encoded = encodeURIComponent(svgString.replace('currentColor', color));
    return `data:image/svg+xml;charset=UTF-8,${encoded}`;
};

const PIN_PATH = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

// Pin for Destination (Centered Icon)
const createPinSvg = (innerIconPath: string, color: string = 'black', bgColor: string = 'white', iconColor: string = 'black') => {
    const icon = innerIconPath.replace(/currentColor/g, iconColor);
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
        <path d="${PIN_PATH}" fill="${bgColor}" stroke="${color}" stroke-width="1" filter="url(#shadow)"/>
        <g transform="translate(5, 2) scale(0.6)">
            ${icon}
        </g>
    </svg>`;
};

// Circle for Provider (Centered Icon)
const createCircleSvg = (innerIconPath: string, bgColor: string = 'black', iconColor: string = 'white') => {
    const icon = innerIconPath.replace(/currentColor/g, iconColor);
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24">
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
        <circle cx="12" cy="12" r="10" fill="${bgColor}" stroke="white" stroke-width="2" filter="url(#shadow)"/>
        <g transform="translate(5, 5) scale(0.6)">
            ${icon}
        </g>
    </svg>`;
};

const PATHS = {
    navigation: '<polygon points="3 11 22 2 13 21 11 13 3 11" fill="currentColor"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="currentColor"/><line x1="4" x2="4" y1="22" y2="15" stroke="currentColor" stroke-width="2"/>'
};

const ICONS = {
    provider: createCircleSvg(PATHS.navigation, 'black', 'white'),
    destination: createPinSvg(PATHS.flag, 'black', 'white', 'black')
};

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

export const TrackingView: React.FC<{
  isLoaded: boolean;
  role: UserRole;
  trackingOrder: ServiceOrder;
  providers: ProviderStore[];
  onMinimize: () => void;
  onCancel: () => void;
}> = ({ isLoaded, role, trackingOrder, providers, onMinimize, onCancel }) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const loadError = !isLoaded && !window.google ? { message: "Waiting for Google Maps..." } : null;

    const mapRef = useRef<google.maps.Map | null>(null);
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
    const [eta, setEta] = useState<string>('Calculando...');
    const [showDetails, setShowDetails] = useState(false);
    const [nextStep, setNextStep] = useState<string>('');
    const [steps, setSteps] = useState<google.maps.DirectionsStep[]>([]);
    const [isNavInfoVisible, setIsNavInfoVisible] = useState(true);
    const [isNavigationMode, setIsNavigationMode] = useState(false);
    
    // Mock Provider Location Animation
    const [providerLocation, setProviderLocation] = useState<{lat: number, lng: number} | null>(null);

    const provider = providers.find(p => p.id === trackingOrder.providerId);
    const clientCoords = { lat: trackingOrder.clientCoordinates.x, lng: trackingOrder.clientCoordinates.y };
    const providerStartCoords = provider ? { lat: provider.coordinates.x, lng: provider.coordinates.y } : { lat: clientCoords.lat + 0.008, lng: clientCoords.lng + 0.008 };

    // Simulate Provider Movement
    useEffect(() => {
        setProviderLocation(providerStartCoords);
        
        const interval = setInterval(() => {
            setProviderLocation(prev => {
                if (!prev) return providerStartCoords;
                // Move slightly towards client
                const latDiff = clientCoords.lat - prev.lat;
                const lngDiff = clientCoords.lng - prev.lng;
                
                // Stop if close enough
                if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) return prev;

                return {
                    lat: prev.lat + latDiff * 0.05,
                    lng: prev.lng + lngDiff * 0.05
                };
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // Calculate & Update Route Dynamically
    useEffect(() => {
        if (!isLoaded || !window.google || !providerLocation) return;

        const updateRoute = () => {
            const directionsService = new google.maps.DirectionsService();
            directionsService.route({
                origin: providerLocation, // Always route from current provider location
                destination: clientCoords,
                travelMode: google.maps.TravelMode.DRIVING,
            }, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    setDirectionsResponse(result);
                    const leg = result.routes[0].legs[0];
                    if (leg && leg.duration) {
                        setEta(leg.duration.text || '15 min');
                    }
                    if (leg && leg.steps && leg.steps.length > 0) {
                        // Strip HTML tags from instructions
                        const instruction = leg.steps[0].instructions.replace(/<[^>]*>?/gm, '');
                        setNextStep(instruction);
                        setSteps(leg.steps);
                    }
                }
            });
        };

        // Initial calculation
        updateRoute();

        // Update every 10 seconds to reflect "rerouting" if off-path
        const interval = setInterval(updateRoute, 10000);
        return () => clearInterval(interval);
    }, [isLoaded, trackingOrder, providerLocation]); // Re-run when location changes (debounced by interval in real app, here we rely on effect re-triggering or interval)

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    // Navigation Mode (Provider View)
    const mapOptions = useMemo(() => {
        if (role === UserRole.PROVIDER && isNavigationMode) {
            return {
                styles: DARK_MAP_STYLES,
                disableDefaultUI: true,
                zoomControl: false,
                tilt: 45, // 3D effect
                heading: 0, // Ideally this would follow the bearing
                mapTypeId: 'roadmap'
            };
        }
        return {
            styles: DARK_MAP_STYLES,
            disableDefaultUI: true,
            zoomControl: false,
            tilt: 0,
            heading: 0,
        };
    }, [role, isNavigationMode]);

    // Camera Follow Logic
    useEffect(() => {
        if (isNavigationMode && providerLocation && mapRef.current) {
            mapRef.current.panTo(providerLocation);
            mapRef.current.setZoom(18);
        }
    }, [isNavigationMode, providerLocation]);

    const [isPanelOpen, setIsPanelOpen] = useState(true);

    // Auto-minimize panel when entering navigation mode
    useEffect(() => {
        if (isNavigationMode) {
            setIsPanelOpen(false);
        }
    }, [isNavigationMode]);

    if (loadError) {
        return <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-white">Error al cargar mapa</div>;
    }

    if (!isLoaded) {
        return <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-white">Cargando Ruta...</div>;
    }

    return (
        <div className="absolute inset-0 z-[2500] bg-zinc-900 flex flex-col animate-in slide-in-from-bottom-20 duration-500">
            <div className="flex-1 relative">
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%', backgroundColor: '#212121' }}
                    defaultCenter={providerStartCoords}
                    zoom={15}
                    options={mapOptions}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                >
                    {directionsResponse && (
                        <DirectionsRenderer 
                            directions={directionsResponse} 
                            options={{
                                suppressMarkers: true, // We use custom markers
                                polylineOptions: {
                                    strokeColor: '#2563eb', // Darker, more visible blue
                                    strokeOpacity: 1.0,
                                    strokeWeight: 8
                                }
                            }}
                        />
                    )}
                    
                    {/* Client Marker (Destination) */}
                    <MarkerF
                        position={clientCoords}
                        icon={{
                            url: createSvgIcon(ICONS.destination),
                            scaledSize: new google.maps.Size(40, 40),
                            anchor: new google.maps.Point(20, 40)
                        }}
                        zIndex={100}
                    />

                    {/* Provider Marker (Moving) */}
                    {providerLocation && (
                        <MarkerF
                            position={providerLocation}
                            icon={{
                                url: createSvgIcon(ICONS.provider),
                                scaledSize: new google.maps.Size(44, 44),
                                anchor: new google.maps.Point(22, 22)
                            }}
                            zIndex={200}
                        />
                    )}
                </GoogleMap>
                
                <div className="leaflet-vignette pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.6)] z-[1000]" />
                
                <button onClick={onMinimize} className="absolute top-4 left-4 z-[2600] bg-black/80 backdrop-blur text-white p-3 rounded-full hover:bg-white hover:text-black transition-all shadow-xl">
                    <ChevronDown className="w-6 h-6" />
                </button>
                
                {/* Navigation Mode Toggle */}
                {role === UserRole.PROVIDER && (
                    <button 
                        onClick={() => setIsNavigationMode(!isNavigationMode)} 
                        className={`absolute top-4 right-4 z-[2600] p-3 rounded-full transition-all shadow-xl flex items-center gap-2 ${isNavigationMode ? 'bg-blue-600 text-white' : 'bg-black/80 backdrop-blur text-white hover:bg-white hover:text-black'}`}
                    >
                        <Compass className={`w-6 h-6 ${isNavigationMode ? 'animate-spin-slow' : ''}`} />
                    </button>
                )}

                {isNavInfoVisible && (
                    <div className="absolute top-16 right-4 z-[2600] bg-blue-600 text-white px-4 py-2 rounded-full font-black text-sm shadow-lg flex items-center gap-2 animate-in slide-in-from-right">
                        <Clock className="w-4 h-4" /> {eta}
                    </div>
                )}

                {role === UserRole.PROVIDER && isNavigationMode && (
                    <>
                        <div className="absolute top-28 right-4 z-[2600] bg-green-600 text-white px-4 py-2 rounded-full font-black text-xs shadow-lg flex items-center gap-2 animate-pulse">
                            <Navigation className="w-3 h-3" /> MODO NAVEGACIÓN
                        </div>
                        {nextStep && (
                            <div className="absolute top-4 left-20 right-20 z-[2600] animate-in slide-in-from-top-4">
                                <div className="bg-black/90 border border-white/20 backdrop-blur p-3 rounded-xl shadow-2xl flex items-center gap-3">
                                    <div className="bg-white text-black p-2 rounded-full">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">PRÓXIMA MANIOBRA</div>
                                        <div className="text-sm font-black text-white leading-tight line-clamp-2">{nextStep}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2600] pointer-events-none">
                    <div className="bg-black/90 px-6 py-2 border border-white/20 backdrop-blur text-[10px] font-black uppercase tracking-widest text-white shadow-2xl rounded-full">
                        {trackingOrder.status === 'ACCEPTED' ? 'Profesional en camino' : 'Trabajo iniciado'}
                    </div>
                </div>
            </div>

            {/* Bottom Sheet UI */}
            <div 
                className={`absolute bottom-0 left-0 right-0 bg-black border-t border-zinc-800 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-in-out z-[2700] ${isPanelOpen ? 'translate-y-0' : 'translate-y-[calc(100%-30px)]'}`}
            >
                {/* Handle / Toggle */}
                <div 
                    className="h-[30px] flex items-center justify-center cursor-pointer hover:bg-zinc-900 transition-colors"
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                >
                    <div className="w-12 h-1.5 bg-zinc-700 rounded-full"></div>
                </div>

                {/* Content */}
                <div className="px-8 pb-8 pt-2">
                    {/* Header Info */}
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
                        <div className="text-right">
                             <div className="text-2xl font-black text-white">{eta}</div>
                             <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tiempo Estimado</div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Costo</div>
                            <div className="text-lg font-mono text-white font-black">{trackingOrder.priceEstimate}</div>
                        </div>
                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Distancia</div>
                            <div className="text-lg font-mono text-white font-black">{directionsResponse?.routes[0]?.legs[0]?.distance?.text || '--'}</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1 border-zinc-800 text-zinc-500 hover:border-red-500 hover:text-red-500 h-12" onClick={onCancel}>CANCELAR</Button>
                        <Button className="flex-[2] bg-white text-black font-black h-12 hover:bg-zinc-200">CONTACTAR</Button>
                    </div>
                    
                    {/* Extra Details Toggle */}
                    <div className="mt-6 pt-4 border-t border-zinc-900 text-center">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
                            className="text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2 w-full"
                        >
                            {showDetails ? 'Ocultar Detalles' : 'Ver Detalles del Viaje'}
                            {showDetails ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                        </button>
                    </div>

                    {/* Expandable Route Details */}
                    {showDetails && (
                        <div className="mt-4 space-y-4 animate-in slide-in-from-bottom-4">
                             <div className="flex items-start gap-3">
                                <div className="mt-1"><div className="w-2 h-2 rounded-full bg-zinc-500"></div></div>
                                <div>
                                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Origen</div>
                                    <div className="text-xs text-zinc-300 font-medium">{provider?.address || 'Ubicación del profesional'}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div></div>
                                <div>
                                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Destino</div>
                                    <div className="text-xs text-zinc-100 font-bold">{trackingOrder.location}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
