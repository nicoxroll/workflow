
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, MapPin, Star, ShieldCheck, X, Plus, Home, Briefcase, Check, ArrowLeft, Search, Edit2 } from 'lucide-react';
import { GoogleMap, MarkerF, Autocomplete } from '@react-google-maps/api';
import { ServiceCategory, SavedAddress } from '../types';

// --- BUTTON ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'google';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', className = '', isLoading, ...props 
}) => {
  const baseStyle = "w-full py-4 px-6 font-bold uppercase tracking-wider text-xs transition-all duration-150 active:translate-y-0.5 flex items-center justify-center gap-2 rounded-none border focus:outline-none";
  
  const variants = {
    primary: "bg-white text-black border-white hover:bg-zinc-200",
    secondary: "bg-zinc-900 text-white border-zinc-800 hover:border-white",
    outline: "bg-transparent text-white border-white hover:bg-white hover:text-black",
    ghost: "bg-transparent text-zinc-500 border-transparent hover:text-white",
    google: "bg-white text-black border-white hover:bg-zinc-100"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

// --- INPUT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, className = '', ...props }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">{label}</label>}
    <div className="relative group">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors">{icon}</div>}
      <input 
        className={`w-full bg-black border border-zinc-800 text-white p-4 font-mono text-sm placeholder:text-zinc-700 focus:outline-none focus:border-white transition-colors rounded-none ${icon ? 'pl-12' : ''} ${className}`}
        {...props}
      />
    </div>
  </div>
);

// --- MOCK AUTOCOMPLETE INPUT ---
// Simulates a Google Places Autocomplete behavior
const MOCK_LOCATIONS = [
  "Av. Corrientes 1234, CABA",
  "Av. Santa Fe 2000, CABA",
  "Av. Libertador 4500, Palermo",
  "Calle Florida 500, Microcentro",
  "Av. Cabildo 2000, Belgrano",
  "Gorriti 5000, Palermo Soho",
  "Av. 9 de Julio 1000, Obelisco",
  "Av. de Mayo 800, Monserrat",
  "Lavalle 300, Microcentro",
  "Reconquista 100, San Nicolás"
];

interface AutocompleteInputProps extends InputProps {
  onSelectSuggestion: (address: string) => void;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ onSelectSuggestion, value, onChange, ...props }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onChange) onChange(e);
    
    if (val.length > 2) {
      const filtered = MOCK_LOCATIONS.filter(l => l.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative z-50">
      <Input {...props} value={value} onChange={handleChange} autoComplete="off" />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-zinc-900 border border-zinc-700 mt-1 max-h-40 overflow-y-auto shadow-xl z-50">
          {suggestions.map((s, i) => (
            <div 
              key={i} 
              onClick={() => { onSelectSuggestion(s); setShowSuggestions(false); }}
              className="p-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer border-b border-zinc-800 last:border-0 flex items-center gap-2"
            >
              <MapPin className="w-3 h-3 text-zinc-500" />
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- CATEGORY CHIP (FILTER) ---
interface CategoryChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      px-4 py-3 text-[10px] uppercase font-bold border tracking-wider transition-all rounded-none whitespace-nowrap flex-1
      ${isActive 
        ? 'bg-white text-black border-white' 
        : 'bg-black text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-white'}
    `}
  >
    {label}
  </button>
);

// --- REQUEST LIST ITEM ---
export const RequestItem: React.FC<{
  title: string;
  status: string;
  price?: string;
  location?: string;
  onClick?: () => void;
  date?: number;
  children?: React.ReactNode;
}> = ({ title, status, price, location, onClick, date, children }) => {
  const isCompleted = status === 'COMPLETED';
  
  return (
    <div onClick={onClick} className={`group border-b border-zinc-900 py-5 hover:bg-zinc-900/50 cursor-pointer transition-colors px-4 ${isCompleted ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-bold text-white text-sm uppercase tracking-wide group-hover:underline decoration-1 underline-offset-4">{title}</h3>
        <span className={`text-[10px] font-mono border px-1 ${status === 'PENDING' ? 'border-green-500 text-green-500' : 'border-white text-white bg-white/10'}`}>
          {status === 'IN_PROGRESS' ? 'EN CAMINO' : status === 'PENDING' ? 'NUEVO' : status}
        </span>
      </div>
      
      <div className="flex justify-between items-end mt-2 mb-2">
        <div className="flex items-center gap-2 text-zinc-500 text-xs">
          <MapPin className="w-3 h-3" />
          <span>{location}</span>
        </div>
        <div className="text-right">
          <span className="font-mono text-white text-sm font-bold block">{price || 'A convenir'}</span>
          {date && <span className="text-[9px] text-zinc-600 uppercase">{new Date(date).toLocaleDateString()}</span>}
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
};

// --- RATING STARS ---
export const Rating: React.FC<{ value: number }> = ({ value }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star 
        key={star} 
        className={`w-3 h-3 ${star <= value ? 'fill-white text-white' : 'text-zinc-800'}`} 
      />
    ))}
  </div>
);

// --- VERIFIED BADGE ---
export const VerifiedBadge: React.FC = () => (
  <div className="flex items-center gap-1 border border-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white w-fit">
    <ShieldCheck className="w-3 h-3" />
    Verificado
  </div>
);

// --- FILTER MODAL ---
export const FilterModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  categories: ServiceCategory[];
  currentCategory: string;
  onSelectCategory: (id: string) => void;
}> = ({ isOpen, onClose, categories, currentCategory, onSelectCategory }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div onClick={onClose} className="absolute inset-0" />
      <div className="relative bg-black border-t sm:border border-white w-full max-w-md p-6 animate-in slide-in-from-bottom-10 shadow-2xl">
        
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
          <h3 className="text-xl font-black uppercase tracking-tighter">Filtros & Rubros</h3>
          <button onClick={onClose} className="hover:rotate-90 transition-transform"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="space-y-8 mb-8">
          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-3 block">Rubro / Categoría</label>
            <div className="flex flex-wrap gap-2">
               {categories.map(cat => (
                 <CategoryChip 
                    key={cat.id} 
                    label={cat.name} 
                    isActive={currentCategory === cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                 />
               ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-3 block">Rango de Precio</label>
            <div className="flex gap-4">
               <Input placeholder="MIN" type="number" className="text-center" />
               <Input placeholder="MAX" type="number" className="text-center" />
            </div>
          </div>
          
          <div>
             <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-3 block">Calificación Mínima</label>
             <div className="flex gap-2">
               {[1,2,3,4,5].map(n => (
                 <button key={n} className="flex-1 border border-zinc-800 py-3 hover:bg-white hover:text-black hover:border-white transition-colors font-mono text-xs">{n}+</button>
               ))}
             </div>
          </div>
        </div>

        <Button onClick={onClose}>Aplicar Filtros</Button>
      </div>
    </div>
  );
};

// --- ADDRESS MODAL ---
export const AddressModal: React.FC<{
  isLoaded?: boolean;
  isOpen: boolean;
  onClose: () => void;
  addresses: SavedAddress[];
  onSelect: (addr: SavedAddress) => void;
  onAdd: (name: string, address: string, coordinates?: {x: number, y: number}) => void;
  onEdit: (id: string, name: string, address: string, coordinates?: {x: number, y: number}) => void;
  currentAddressId?: string;
}> = ({ isLoaded, isOpen, onClose, addresses, onSelect, onAdd, onEdit, currentAddressId }) => {
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [addr, setAddr] = useState('');
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setView('list');
      setName('');
      setAddr('');
      setCoordinates(null);
      setEditId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartEdit = (e: React.MouseEvent, address: SavedAddress) => {
    e.stopPropagation();
    setEditId(address.id);
    setName(address.name);
    setAddr(address.address);
    setCoordinates({ lat: address.coordinates.x, lng: address.coordinates.y });
    setView('edit');
  };

  const handleStartAdd = () => {
    setName('');
    setAddr('');
    setCoordinates(null);
    setView('add');
  };

  const handleSubmit = () => {
    if (name && addr) {
      const coords = coordinates ? { x: coordinates.lat, y: coordinates.lng } : undefined;
      if (view === 'add') {
        onAdd(name, addr, coords);
      } else if (view === 'edit' && editId) {
        onEdit(editId, name, addr, coords);
      }
      setView('list');
    }
  };

  const onPlaceChanged = () => {
      if (autocompleteRef.current) {
          const place = autocompleteRef.current.getPlace();
          if (place.geometry && place.geometry.location) {
              const loc = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
              setCoordinates(loc);
              setAddr(place.formatted_address || place.name || '');
              mapRef.current?.panTo(loc);
              mapRef.current?.setZoom(17);
          }
      }
  };

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
          const newLoc = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          setCoordinates(newLoc);
      }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div onClick={onClose} className="absolute inset-0" />
      <div className="relative bg-black border-t sm:border border-white w-full max-w-md p-6 animate-in slide-in-from-bottom-10 shadow-2xl max-h-[85vh] overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
          <h3 className="text-xl font-black uppercase tracking-tighter">Mis Direcciones</h3>
          <button onClick={onClose} className="hover:rotate-90 transition-transform"><X className="w-6 h-6" /></button>
        </div>

        {view === 'list' ? (
          <>
            <div className="space-y-2 mb-6">
              <div 
                onClick={() => onSelect({ id: 'current', name: 'Mi Ubicación Actual', address: 'GPS', coordinates: {x:0, y:0} })} // Coordinates handled in parent
                className={`p-4 border cursor-pointer transition-colors flex items-center justify-between group ${currentAddressId === 'current' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-white border-zinc-800 hover:border-zinc-600'}`}
              >
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center"><MapPin className="w-4 h-4" /></div>
                    <div>
                      <div className="font-bold uppercase text-xs tracking-wider">Mi Ubicación Actual</div>
                      <div className="text-xs opacity-80">Usar GPS</div>
                    </div>
                 </div>
                 {currentAddressId === 'current' && <div className="bg-black text-white rounded-full p-1"><Check size={12} /></div>}
              </div>

              {addresses.map(a => {
                const isSelected = currentAddressId === a.id;
                const icon = a.name.toLowerCase().includes('casa') ? <Home className="w-5 h-5" /> : 
                             a.name.toLowerCase().includes('trabajo') || a.name.toLowerCase().includes('oficina') ? <Briefcase className="w-5 h-5" /> : <MapPin className="w-5 h-5" />;
                return (
                  <div 
                    key={a.id} 
                    onClick={() => onSelect(a)}
                    className={`p-4 border cursor-pointer transition-colors flex items-center justify-between group ${isSelected ? 'bg-white text-black border-white' : 'bg-zinc-900 text-white border-zinc-800 hover:border-zinc-600'}`}
                  >
                    <div className="flex items-center gap-3">
                       {icon}
                       <div>
                         <div className="font-bold uppercase text-xs tracking-wider">{a.name}</div>
                         <div className="text-xs opacity-80 truncate max-w-[200px]">{a.address}</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isSelected && <div className="bg-black text-white rounded-full p-1"><Check size={12} /></div>}
                        <button 
                          onClick={(e) => handleStartEdit(e, a)}
                          className={`p-2 rounded-full hover:bg-zinc-700 ${isSelected ? 'text-black hover:text-white' : 'text-zinc-500 hover:text-white'}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <Button variant="outline" onClick={handleStartAdd}>
               <Plus className="w-4 h-4" /> Agregar Nueva Dirección
            </Button>
          </>
        ) : (
           <div className="animate-in slide-in-from-right">
              <button onClick={() => setView('list')} className="text-xs text-zinc-500 hover:text-white mb-4 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Volver a lista
              </button>
              <h4 className="font-bold text-white mb-4">{view === 'add' ? 'Nueva Dirección' : 'Editar Dirección'}</h4>
              <div className="space-y-4 mb-6">
                <Input 
                  label="Nombre (Ej: Casa, Novia, Gym)" 
                  placeholder="Nombre corto..." 
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                
                {isLoaded ? (
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">Dirección</label>
                        <Autocomplete
                            onLoad={ref => autocompleteRef.current = ref}
                            onPlaceChanged={onPlaceChanged}
                        >
                            <input 
                                className="w-full bg-black border border-zinc-800 text-white p-4 font-mono text-sm placeholder:text-zinc-700 focus:outline-none focus:border-white transition-colors rounded-none pl-12"
                                placeholder="Buscar dirección en Google Maps..."
                                value={addr}
                                onChange={e => setAddr(e.target.value)}
                            />
                        </Autocomplete>
                        
                        <div className="h-48 w-full border border-zinc-800 mt-2 relative">
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={coordinates || { lat: -34.6037, lng: -58.3816 }}
                                zoom={coordinates ? 17 : 12}
                                onLoad={map => mapRef.current = map}
                                options={{
                                    disableDefaultUI: true,
                                    styles: [
                                        { elementType: "geometry", stylers: [{ color: "#212121" }] },
                                        { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
                                        { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
                                        { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
                                    ]
                                }}
                            >
                                {coordinates && (
                                    <MarkerF 
                                        position={coordinates} 
                                        draggable={true}
                                        onDragEnd={onMarkerDragEnd}
                                    />
                                )}
                            </GoogleMap>
                            <div className="absolute bottom-2 left-2 bg-black/80 text-white text-[9px] px-2 py-1 rounded">
                                Arrastra el marcador para ajustar
                            </div>
                        </div>
                    </div>
                ) : (
                    <Input 
                        label="Dirección" 
                        placeholder="Cargando Google Maps..." 
                        disabled 
                    />
                )}
              </div>
              <Button onClick={handleSubmit} disabled={!name || !addr}>
                {view === 'add' ? 'Guardar Dirección' : 'Actualizar Dirección'}
              </Button>
           </div>
        )}
      </div>
    </div>
  );
};

// --- NOTIFICATION MODAL ---
export const NotificationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  message: string;
}> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div onClick={onClose} className="absolute inset-0" />
      <div className="relative bg-black border border-white w-full max-w-sm p-6 animate-in slide-in-from-bottom-10 shadow-2xl">
        <div className="text-center">
          <p className="text-white text-sm mb-6">{message}</p>
          <Button onClick={onClose}>Aceptar</Button>
        </div>
      </div>
    </div>
  );
};
