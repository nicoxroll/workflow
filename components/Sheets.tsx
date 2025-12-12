
import React from 'react';
import { X, User, Star, ArrowLeft, MapPin, CircleDollarSign, Image as ImageIcon } from 'lucide-react';
import { ProviderStore } from '../types';
import { Button, VerifiedBadge } from './UIComponents';

export const ClientProfileSheet: React.FC<{ clientName: string; onClose: () => void }> = ({ clientName, onClose }) => (
    <div className="fixed inset-0 z-[2100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in">
        <div onClick={onClose} className="absolute inset-0" />
        <div className="relative bg-black border border-white w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[85vh] overflow-y-auto no-scrollbar">
            <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-zinc-300"><X className="w-6 h-6" /></button>
            <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-white mb-3">
                    <User className="w-10 h-10 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-black uppercase text-white">{clientName}</h2>
                    <VerifiedBadge />
                </div>
                <div className="flex gap-4 mt-2">
                     <div className="text-center px-4 py-2 border border-zinc-800">
                         <div className="text-lg font-bold text-white flex items-center justify-center gap-1">4.8 <Star className="w-3 h-3 fill-white" /></div>
                         <div className="text-[8px] uppercase text-zinc-500 tracking-widest">Rating</div>
                     </div>
                </div>
                <div className="w-full mt-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Información</h3>
                    <div className="bg-zinc-900 p-4 border border-zinc-800">
                        <p className="text-sm text-zinc-300">Usuario verificado desde 2023.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const StorePreviewSheet: React.FC<{ provider: ProviderStore; onClose: () => void }> = ({ provider, onClose }) => (
    <div className="fixed inset-0 z-[2100] bg-black flex flex-col animate-in slide-in-from-bottom-10 overflow-y-auto no-scrollbar">
        <div className="relative h-64 w-full bg-zinc-800">
            {provider.heroImage ? (
                <img src={provider.heroImage} className="w-full h-full object-cover" alt="Hero" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800"><ImageIcon className="w-12 h-12 text-zinc-600" /></div>
            )}
            <button onClick={onClose} className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full hover:bg-black"><ArrowLeft className="w-6 h-6" /></button>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
                 <h1 className="text-3xl font-black uppercase text-white mb-1 shadow-black drop-shadow-lg">{provider.name}</h1>
                 <div className="flex items-center gap-2">
                     <VerifiedBadge />
                     <div className="flex items-center gap-1 bg-white text-black px-2 py-0.5 rounded text-[10px] font-bold">
                         <Star className="w-3 h-3 fill-black" /> {provider.rating}
                     </div>
                     <span className="text-xs text-zinc-300">({provider.reviewsCount} reseñas)</span>
                 </div>
            </div>
        </div>
        <div className="p-6">
             <div className="flex justify-between items-start mb-6">
                 <div>
                     <p className="text-zinc-400 text-sm leading-relaxed mb-4">{provider.description || "Sin descripción disponible."}</p>
                     <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1"><MapPin className="w-4 h-4" /> {provider.address}</div>
                     <div className="flex items-center gap-2 text-xs text-zinc-500"><CircleDollarSign className="w-4 h-4" /> Base: {provider.priceBase}</div>
                 </div>
                 <div className="text-center">
                     <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${provider.status === 'OPEN' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                     <span className="text-[8px] uppercase font-bold text-zinc-500">{provider.status === 'OPEN' ? 'Abierto' : 'Cerrado'}</span>
                 </div>
             </div>
             
             <h3 className="text-lg font-black uppercase text-white mb-4 border-b border-zinc-800 pb-2">Trabajos Realizados</h3>
             {provider.portfolioImages && provider.portfolioImages.length > 0 ? (
                 <div className="grid grid-cols-2 gap-2">
                     {provider.portfolioImages.map((img, idx) => (
                         <div key={idx} className="aspect-square bg-zinc-800 rounded-sm overflow-hidden">
                             <img src={img} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" alt={`Portfolio ${idx}`} />
                         </div>
                     ))}
                 </div>
             ) : (
                 <p className="text-zinc-600 italic text-sm">No hay imágenes en el portafolio.</p>
             )}
        </div>
        <div className="p-6 mt-auto border-t border-zinc-800 sticky bottom-0 bg-black">
             <Button className="w-full">CONTACTAR SERVICIO</Button>
        </div>
    </div>
);
