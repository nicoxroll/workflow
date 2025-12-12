
import React from 'react';
import { Eye, LogOut, Trash2, User } from 'lucide-react';
import { ProviderStore, PublicRequest, UserRole } from '../../types';
import { Button, Input } from '../../components/UIComponents';

export const ProfileView: React.FC<{
  role: UserRole;
  myProviderProfile: ProviderStore;
  onSetRole: (role: UserRole) => void;
  publicRequests: PublicRequest[];
  onDeleteRequest: (id: string) => void;
  onUpdateProfile: (updates: Partial<ProviderStore>) => void;
  onViewMyStore: () => void;
}> = ({ role, myProviderProfile, onSetRole, publicRequests, onDeleteRequest, onUpdateProfile, onViewMyStore }) => {
    return (
        <div className="h-full bg-black pt-12 pb-32 flex flex-col overflow-y-auto">
            <div className="px-6 mb-8 flex items-center justify-between">
                <div>
                     <h2 className="text-3xl font-black uppercase mb-1">{role === UserRole.CLIENT ? 'Mi Perfil' : 'Mi Negocio'}</h2>
                     <p className="text-zinc-500 text-sm">Gestiona tu cuenta y preferencias</p>
                </div>
                <div className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center border-4 border-zinc-800 shadow-xl">
                    <User className="w-6 h-6" />
                </div>
            </div>

            <div className="px-6 space-y-8">
                {/* Role Switcher */}
                <div className="bg-zinc-900 p-1 flex rounded-lg">
                    <button onClick={() => onSetRole(UserRole.CLIENT)} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${role === UserRole.CLIENT ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Modo Cliente</button>
                    <button onClick={() => onSetRole(UserRole.PROVIDER)} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${role === UserRole.PROVIDER ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Modo Profesional</button>
                </div>

                {role === UserRole.PROVIDER ? (
                    <div className="space-y-6">
                        <div className="bg-zinc-900 border border-zinc-800 p-4">
                             <div className="flex justify-between items-center mb-4">
                                 <h3 className="text-xs font-bold uppercase text-white">Estado de Disponibilidad</h3>
                                 <div className={`w-3 h-3 rounded-full ${myProviderProfile.status === 'OPEN' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={() => onUpdateProfile({ status: 'OPEN' })} className={`flex-1 py-2 text-[10px] uppercase font-bold border ${myProviderProfile.status === 'OPEN' ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-zinc-700 text-zinc-500'}`}>Disponible</button>
                                 <button onClick={() => onUpdateProfile({ status: 'BUSY' })} className={`flex-1 py-2 text-[10px] uppercase font-bold border ${myProviderProfile.status === 'BUSY' ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-zinc-700 text-zinc-500'}`}>Ocupado</button>
                             </div>
                        </div>

                        <div className="space-y-4">
                             <Input label="Nombre de Tienda/Profesional" value={myProviderProfile.name} onChange={(e) => onUpdateProfile({ name: e.target.value })} />
                             <Input label="Tarifa Base (Texto)" value={myProviderProfile.priceBase} onChange={(e) => onUpdateProfile({ priceBase: e.target.value })} />
                             <div>
                                 <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1 block">Descripción</label>
                                 <textarea className="w-full bg-black border border-zinc-800 text-white p-3 text-sm h-24 focus:border-white focus:outline-none" value={myProviderProfile.description} onChange={(e) => onUpdateProfile({ description: e.target.value })} />
                             </div>
                        </div>
                        
                        <Button variant="outline" onClick={onViewMyStore}><Eye className="w-4 h-4"/> Ver mi Perfil Público</Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-zinc-900 border border-zinc-800 p-6 text-center">
                             <h3 className="text-lg font-bold text-white mb-2">Historial de Servicios</h3>
                             <p className="text-zinc-500 text-sm">Aún no tienes servicios finalizados.</p>
                        </div>
                        <div className="space-y-2">
                             <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Mis Solicitudes Públicas</h3>
                             {publicRequests.filter(r => r.ownerId === 'current_user').map(req => (
                                 <div key={req.id} className="flex justify-between items-center bg-zinc-900 p-4 border border-zinc-800">
                                     <span className="text-sm font-bold text-white uppercase">{req.category.name}</span>
                                     <button onClick={() => onDeleteRequest(req.id)} className="text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                 </div>
                             ))}
                             {publicRequests.filter(r => r.ownerId === 'current_user').length === 0 && <p className="text-zinc-600 text-xs italic">No hay solicitudes activas.</p>}
                        </div>
                    </div>
                )}
                
                <div className="pt-6 border-t border-zinc-800">
                    <button className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs uppercase font-bold tracking-widest">
                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};
