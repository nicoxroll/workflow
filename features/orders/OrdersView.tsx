
import React from 'react';
import { Star, Trash2, User } from 'lucide-react';
import { ProviderStore, PublicRequest, ServiceOrder, UserRole } from '../../types';
import { RequestItem } from '../../components/UIComponents';

export const OrdersView: React.FC<{
  role: UserRole;
  orders: ServiceOrder[];
  onViewOrder: (o: ServiceOrder) => void;
  onAcceptOrder: (o: ServiceOrder) => void;
  onRejectOrder: (id: string) => void;
  onViewClientProfile: (name: string) => void;
  publicRequests: PublicRequest[];
  providers: ProviderStore[];
  onSelectProvider: (p: ProviderStore) => void;
}> = ({ role, orders, onViewOrder, onAcceptOrder, onRejectOrder, onViewClientProfile, publicRequests, providers, onSelectProvider }) => {
    return (
        <div className="h-full bg-black pt-12 pb-32 flex flex-col">
            <div className="px-6 mb-6">
                <h2 className="text-3xl font-black uppercase mb-1">{role === UserRole.PROVIDER ? 'Mis Pedidos' : 'Explorar'}</h2>
                <p className="text-zinc-500 text-sm">{role === UserRole.PROVIDER ? 'Solicitudes entrantes y activas' : 'Proveedores y Servicios'}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 space-y-4">
                {role === UserRole.PROVIDER && (
                    <>
                        {orders.length === 0 && <div className="text-zinc-600 text-center py-10 italic">No hay pedidos pendientes.</div>}
                        {orders.map(order => (
                             <RequestItem 
                                key={order.id} 
                                title={order.clientId} 
                                status={order.status} 
                                price={order.priceEstimate} 
                                location={order.location} 
                                onClick={() => onViewOrder(order)}
                                date={order.createdAt}
                             />
                        ))}
                    </>
                )}
                {role === UserRole.CLIENT && (
                    <>
                        <div className="mb-6">
                            <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-widest mb-3 px-2">Mis Solicitudes Activas</h3>
                            {publicRequests.filter(r => r.ownerId === 'current_user').length === 0 ? 
                                <div className="text-zinc-600 text-sm px-2">No tienes búsquedas activas.</div> :
                                publicRequests.filter(r => r.ownerId === 'current_user').map(req => (
                                    <div key={req.id} className="bg-zinc-900 p-4 border border-zinc-800 mb-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-white text-sm uppercase">{req.category.name}</span>
                                            <span className="text-[10px] bg-blue-900 text-blue-200 px-2 py-0.5 rounded-full">{req.applicants.length} Postulantes</span>
                                        </div>
                                        <div className="text-xs text-zinc-500">{req.offerPrice} • {req.description}</div>
                                    </div>
                                ))
                            }
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-widest mb-3 px-2">Profesionales Destacados</h3>
                            {providers.map(prov => (
                                <div key={prov.id} onClick={() => onSelectProvider(prov)} className="flex items-center gap-4 p-4 border-b border-zinc-900 hover:bg-zinc-900 cursor-pointer">
                                    <div className="w-12 h-12 bg-zinc-800 rounded-sm overflow-hidden">
                                        {prov.heroImage ? <img src={prov.heroImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="text-zinc-600"/></div>}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm uppercase">{prov.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <span>{prov.categoryName}</span> • <span className="flex items-center gap-0.5 text-white"><Star className="w-2 h-2 fill-white"/> {prov.rating}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
