
import React from 'react';
import { Loader2, MapPin, Star, ShieldCheck, X } from 'lucide-react';
import { ServiceCategory } from '../types';

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
}> = ({ title, status, price, location, onClick, date }) => {
  const isCompleted = status === 'COMPLETED';
  
  return (
    <div onClick={onClick} className={`group border-b border-zinc-900 py-5 hover:bg-zinc-900/50 cursor-pointer transition-colors px-4 ${isCompleted ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-bold text-white text-sm uppercase tracking-wide group-hover:underline decoration-1 underline-offset-4">{title}</h3>
        <span className={`text-[10px] font-mono border px-1 ${status === 'PENDING' ? 'border-zinc-600 text-zinc-400' : 'border-white text-white bg-white/10'}`}>
          {status === 'IN_PROGRESS' ? 'EN CAMINO' : status}
        </span>
      </div>
      
      <div className="flex justify-between items-end mt-2">
        <div className="flex items-center gap-2 text-zinc-500 text-xs">
          <MapPin className="w-3 h-3" />
          <span>{location}</span>
        </div>
        <div className="text-right">
          <span className="font-mono text-white text-xs block">{price || 'A convenir'}</span>
          {date && <span className="text-[9px] text-zinc-600 uppercase">{new Date(date).toLocaleDateString()}</span>}
        </div>
      </div>
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
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div onClick={onClose} className="absolute inset-0" />
      <div className="relative bg-black border-t sm:border border-white w-full max-w-md p-6 animate-in slide-in-from-bottom-10">
        
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
          <h3 className="text-xl font-black uppercase tracking-tighter">Filtros & Rubros</h3>
          <button onClick={onClose} className="hover:rotate-90 transition-transform"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="space-y-8 mb-8">
          
          {/* Categories Section moved here */}
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
