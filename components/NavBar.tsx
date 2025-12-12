
import React from 'react';
import { Map as MapIcon, List, MessageCircle, User, Navigation, Plus, Zap } from 'lucide-react';
import { UserRole } from '../types';

interface NavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  role: UserRole;
  onCentralClick: () => void;
  hasActiveOrder: boolean;
}

export const NavBar: React.FC<NavBarProps> = ({ activeTab, onTabChange, role, onCentralClick, hasActiveOrder }) => {
  return (
    <div className="bg-black border-t border-zinc-800 h-[80px] px-6 flex items-center justify-between relative z-[1000]">
      <button onClick={() => onTabChange('map')} className={`flex flex-col items-center gap-1 ${activeTab === 'map' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
        <MapIcon className="w-6 h-6" />
        <span className="text-[9px] font-bold uppercase tracking-widest">Mapa</span>
      </button>

      <button onClick={() => onTabChange('orders')} className={`flex flex-col items-center gap-1 ${activeTab === 'orders' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
        <List className="w-6 h-6" />
        <span className="text-[9px] font-bold uppercase tracking-widest">{role === UserRole.PROVIDER ? 'Pedidos' : 'Servicios'}</span>
      </button>

      <div className="relative -top-6">
        <button 
          onClick={onCentralClick}
          className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-transform active:scale-95 ${hasActiveOrder ? 'bg-green-500 text-black animate-pulse' : 'bg-white text-black'}`}
        >
          {hasActiveOrder ? <Navigation className="w-8 h-8" /> : role === UserRole.CLIENT ? <Plus className="w-8 h-8" /> : <Zap className="w-8 h-8 fill-black" />}
        </button>
      </div>

      <button onClick={() => onTabChange('chats')} className={`flex flex-col items-center gap-1 ${activeTab === 'chats' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
        <MessageCircle className="w-6 h-6" />
        <span className="text-[9px] font-bold uppercase tracking-widest">Chat</span>
      </button>

      <button onClick={() => onTabChange('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
        <User className="w-6 h-6" />
        <span className="text-[9px] font-bold uppercase tracking-widest">Perfil</span>
      </button>
    </div>
  );
};
