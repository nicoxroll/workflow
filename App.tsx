
import React, { useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { UserRole, ServiceCategory, ProviderStore, ServiceOrder, ChatSession, SavedAddress, PublicRequest, RequestApplicant } from './types';
import { AddressModal } from './components/UIComponents';
import { MapView } from './features/map/MapView';
import { OrdersView } from './features/orders/OrdersView';
import { TrackingView } from './features/orders/TrackingView';
import { ProfileView } from './features/profile/ProfileView';
import { ChatListView, ChatConversation } from './features/chat/ChatViews';
import { NavBar } from './components/NavBar';
import { ClientProfileSheet, StorePreviewSheet } from './components/Sheets';

// --- DATA CONSTANTS ---
const DEFAULT_CENTER = [-34.6037, -58.3816];
const LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ['places'];

const CATEGORIES: ServiceCategory[] = [
  { id: 'all', name: 'Todos', icon: 'grid' },
  { id: 'plomeria', name: 'Plomería', icon: 'wrench' },
  { id: 'electricidad', name: 'Electricidad', icon: 'zap' },
  { id: 'mudanza', name: 'Fletes', icon: 'truck' },
  { id: 'limpieza', name: 'Limpieza', icon: 'sparkles' },
];

const MOCK_PROVIDERS: ProviderStore[] = [
  {
    id: 'p1',
    name: 'Esteban "El Rayo" K.',
    categoryId: 'electricidad',
    categoryName: 'Electricidad',
    rating: 4.9,
    reviewsCount: 154,
    coordinates: { x: -34.6050, y: -58.3850 },
    range: 800, 
    address: 'Av. Corrientes 1200',
    status: 'OPEN',
    priceBase: 'Visita $15.000',
    heroImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop',
    description: 'Especialista en instalaciones domiciliarias e industriales. Urgencias 24hs. Matriculado con más de 10 años de experiencia en CABA.',
    portfolioImages: [
        'https://images.unsplash.com/photo-1558402529-d2638a7023e9?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    id: 'p2',
    name: 'Plomería Total S.A.',
    categoryId: 'plomeria',
    categoryName: 'Plomería',
    rating: 4.5,
    reviewsCount: 89,
    coordinates: { x: -34.6020, y: -58.3790 },
    range: 1200, 
    address: 'Florida 500',
    status: 'BUSY',
    priceBase: 'Visita $20.000',
    heroImage: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?q=80&w=2000&auto=format&fit=crop',
    description: 'Empresa líder en soluciones sanitarias. Destapaciones con máquina, filtraciones y reparaciones generales. Garantía escrita.',
    portfolioImages: []
  },
  {
    id: 'p3',
    name: 'Fletes Rapidos',
    categoryId: 'mudanza',
    categoryName: 'Fletes',
    rating: 4.8,
    reviewsCount: 32,
    coordinates: { x: -34.5990, y: -58.3890 },
    range: 3000, 
    address: 'Callao 200',
    status: 'OPEN',
    priceBase: 'Hora $25.000',
    description: 'Mudanzas pequeñas y medianas. Servicio puerta a puerta.',
    portfolioImages: []
  },
  {
    id: 'p4',
    name: 'Limpieza Profunda',
    categoryId: 'limpieza',
    categoryName: 'Limpieza',
    rating: 4.2,
    reviewsCount: 12,
    coordinates: { x: -34.6080, y: -58.3750 },
    range: 800, 
    address: 'San Telmo Central',
    status: 'OPEN',
    priceBase: 'Hora $12.000',
    description: 'Limpieza final de obra, consorcios y oficinas.',
    portfolioImages: []
  }
];

const MOCK_INCOMING_ORDERS: ServiceOrder[] = [
    {
        id: 'req_101',
        providerId: 'p1',
        providerName: 'Esteban "El Rayo" K.',
        clientId: 'Juan Pérez (Demo)',
        description: 'Tengo un corto en la cocina, urgente.',
        status: 'PENDING',
        location: 'Av. Córdoba 1500',
        clientCoordinates: { x: -34.5980, y: -58.3860 },
        priceEstimate: '$15.000',
        createdAt: Date.now()
    },
    {
        id: 'req_102',
        providerId: 'p1',
        providerName: 'Esteban "El Rayo" K.',
        clientId: 'Maria Gonzalez',
        description: 'Instalación de luminarias LED en local.',
        status: 'ACCEPTED',
        location: 'Talcahuano 800',
        clientCoordinates: { x: -34.6010, y: -58.3830 },
        priceEstimate: '$45.000',
        createdAt: Date.now() - 3600000
    }
];

const MOCK_PUBLIC_REQUESTS: PublicRequest[] = [
    {
        id: 'pub_1',
        ownerId: 'other_client',
        clientId: 'Ana García',
        category: CATEGORIES[1], // Plomeria
        description: 'Cambio de cuerito canilla baño',
        offerPrice: '$8.000',
        coordinates: { x: -34.6060, y: -58.3820 },
        address: 'Talcahuano 400',
        createdAt: Date.now(),
        status: 'OPEN',
        applicants: []
    }
];

const MOCK_CHATS: ChatSession[] = [
    { id: 'c1', orderId: 'req_101', participants: 'Juan Pérez (Demo)', lastMessage: 'Estoy llegando en 5 min.', lastTimestamp: Date.now(), unreadCount: 1 },
    { id: 'c2', orderId: 'old_1', participants: 'María G.', lastMessage: 'Gracias por el servicio!', lastTimestamp: Date.now() - 86400000, unreadCount: 0 }
];

const MOCK_ADDRESSES: SavedAddress[] = [];

const App = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    libraries: LIBRARIES
  });

  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [view, setView] = useState<string>('map');
  const [activeTab, setActiveTab] = useState('map');

  const [providers, setProviders] = useState<ProviderStore[]>(MOCK_PROVIDERS);
  const [orders, setOrders] = useState<ServiceOrder[]>(MOCK_INCOMING_ORDERS);
  const [publicRequests, setPublicRequests] = useState<PublicRequest[]>(MOCK_PUBLIC_REQUESTS);
  
  const [selectedProvider, setSelectedProvider] = useState<ProviderStore | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [selectedPublicRequest, setSelectedPublicRequest] = useState<PublicRequest | null>(null);
  
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestDescription, setRequestDescription] = useState('');
  
  const [trackingOrder, setTrackingOrder] = useState<ServiceOrder | null>(null);
  const [isTrackingMaximized, setIsTrackingMaximized] = useState(false);
  const [viewingClientProfile, setViewingClientProfile] = useState<string | null>(null);
  const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(MOCK_CHATS);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(MOCK_ADDRESSES);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("Mi Ubicación Actual");
  const [clientLocation, setClientLocation] = useState<{lat: number, lng: number}>({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number}>({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
  
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);

  // My Provider Profile (In real app, fetched from auth)
  const [myProviderProfile, setMyProviderProfile] = useState<ProviderStore>(MOCK_PROVIDERS[0]);
  const [viewingStore, setViewingStore] = useState<ProviderStore | null>(null);

  // --- Handlers ---

  const handleTabChange = (tab: string) => {
      setActiveTab(tab);
      setView(tab);
      if (tab !== 'map') setIsTrackingMaximized(false); 
  };

  const handleCentralClick = () => {
      if (trackingOrder) {
          setIsTrackingMaximized(true);
      } else {
          // New: Create request logic
          if (role === UserRole.CLIENT) {
             setView('map');
             setActiveTab('map');
             setIsCreatingRequest(true);
          } else {
             setView('map');
             setActiveTab('map');
          }
      }
  };

  const handleSelectAddress = (addr: SavedAddress) => {
      if (addr.id === 'current') {
          setCurrentAddress("Mi Ubicación Actual");
      } else {
          setClientLocation({ lat: addr.coordinates.x, lng: addr.coordinates.y });
          setCurrentAddress(addr.name);
      }
      setIsAddressModalOpen(false);
      // Ensure we go to map to see the change
      setView('map');
      setActiveTab('map');
  };

  const handleAddAddress = (name: string, address: string, coordinates?: {x: number, y: number}) => {
      // Logic for adding a new address
      // Use provided coordinates or mapCenter
      const baseLat = coordinates ? coordinates.x : (!isNaN(mapCenter.lat) ? mapCenter.lat : DEFAULT_CENTER[0]);
      const baseLng = coordinates ? coordinates.y : (!isNaN(mapCenter.lng) ? mapCenter.lng : DEFAULT_CENTER[1]);

      const newAddr: SavedAddress = {
          id: `addr_${Date.now()}`,
          name,
          address,
          coordinates: { 
              x: baseLat, 
              y: baseLng 
          }
      };
      setSavedAddresses(prev => [...prev, newAddr]);
      handleSelectAddress(newAddr);
  };

  const handleEditAddress = (id: string, name: string, address: string, coordinates?: {x: number, y: number}) => {
      setSavedAddresses(prev => prev.map(a => a.id === id ? { 
          ...a, 
          name, 
          address,
          coordinates: coordinates || a.coordinates 
      } : a));
      if (savedAddresses.find(a => a.id === id)?.name === currentAddress) {
          setCurrentAddress(name);
      }
  };

  const handleSendRequest = async () => {
    if (!selectedProvider) return;
    const orderId = `ord_${Date.now()}`;
    const newOrder: ServiceOrder = {
        id: orderId,
        providerId: selectedProvider.id,
        providerName: selectedProvider.name,
        clientId: 'Usuario Actual',
        description: requestDescription,
        status: 'PENDING',
        location: currentAddress,
        clientCoordinates: { x: clientLocation.lat, y: clientLocation.lng },
        priceEstimate: selectedProvider.priceBase,
        createdAt: Date.now()
    };
    
    // Auto-generate chat session
    const newChat: ChatSession = {
        id: `chat_${orderId}`,
        orderId: orderId,
        participants: selectedProvider.name,
        lastMessage: 'Solicitud enviada',
        lastTimestamp: Date.now(),
        unreadCount: 0
    };
    setChatSessions(prev => [newChat, ...prev]);

    setIsRequesting(false);
    setSelectedProvider(null);
    setRequestDescription('');
    alert("Solicitud enviada. Se ha generado un chat con el profesional.");
    setOrders(prev => [newOrder, ...prev]);
  };

  const handleAcceptOrder = (order: ServiceOrder) => {
    const hasActiveJob = orders.some(o => ['ACCEPTED', 'IN_PROGRESS'].includes(o.status));
    if (hasActiveJob) { alert("Ya tienes un trabajo en curso. Termínalo antes de aceptar otro."); return; }
    const updatedOrder = { ...order, status: 'ACCEPTED' as const };
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setTrackingOrder(updatedOrder);
    setIsTrackingMaximized(true); 
    setSelectedOrder(null);
  };

  const handleApplyToRequest = (req: PublicRequest) => {
     setPublicRequests(prev => prev.map(r => {
         if (r.id === req.id) {
             return {
                 ...r,
                 applicants: [...r.applicants, { providerId: myProviderProfile.id, providerName: myProviderProfile.name, rating: myProviderProfile.rating, status: 'PENDING' }]
             };
         }
         return r;
     }));
     alert("Postulación enviada. El cliente revisará tu perfil.");
     setSelectedPublicRequest(null);
  };

  const handleAcceptApplicant = (reqId: string, applicant: RequestApplicant) => {
      const request = publicRequests.find(r => r.id === reqId);
      if (!request) return;

      const orderId = `ord_pub_${reqId}`;
      const newOrder: ServiceOrder = {
          id: orderId,
          providerId: applicant.providerId,
          providerName: applicant.providerName,
          clientId: 'Usuario Actual (Yo)', // Client is Me
          description: request.description,
          status: 'ACCEPTED', // Goes directly to accepted
          location: request.address,
          clientCoordinates: request.coordinates,
          priceEstimate: request.offerPrice,
          createdAt: Date.now()
      };

      const newChat: ChatSession = {
        id: `chat_${orderId}`,
        orderId: orderId,
        participants: applicant.providerName,
        lastMessage: '¡He aceptado tu postulación!',
        lastTimestamp: Date.now(),
        unreadCount: 0
      };
      setChatSessions(prev => [newChat, ...prev]);

      setOrders(prev => [newOrder, ...prev]);
      setTrackingOrder(newOrder); // Start tracking
      setIsTrackingMaximized(true);
      setPublicRequests(prev => prev.filter(r => r.id !== reqId));
      setSelectedPublicRequest(null);
      alert("Has contratado al profesional. Se ha abierto un chat.");
  };

  const handleAddPublicRequest = (req: Partial<PublicRequest>) => {
      const newReq: PublicRequest = {
          id: `pub_${Date.now()}`,
          ownerId: 'current_user',
          clientId: 'Usuario Actual',
          category: req.category!,
          description: req.description || '',
          offerPrice: req.offerPrice || '$0',
          coordinates: req.coordinates || {x:0, y:0},
          address: req.address || '',
          createdAt: Date.now(),
          status: 'OPEN',
          applicants: []
      };
      setPublicRequests(prev => [newReq, ...prev]);
      // alert("Tu solicitud ha sido publicada en el mapa.");
  };

  const handleDeleteRequest = (reqId: string) => {
      setPublicRequests(prev => prev.filter(r => r.id !== reqId));
      setSelectedPublicRequest(null);
  };

  const handleRejectOrder = (orderId: string) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
      setSelectedOrder(null);
  };

  const handleStartChat = (participantName: string, orderId: string) => {
      const existing = chatSessions.find(c => c.orderId === orderId);
      const newChat: ChatSession = existing || {
          id: `new_chat_${Date.now()}`,
          orderId: orderId,
          participants: participantName,
          lastMessage: 'Hola, vi tu solicitud.',
          lastTimestamp: Date.now(),
          unreadCount: 0
      };
      if (!existing) setChatSessions(prev => [newChat, ...prev]);
      setActiveChatSession(newChat);
  };

  const handleCancelTracking = () => {
    if (!trackingOrder) return;
    setTrackingOrder(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
    setTimeout(() => { setTrackingOrder(null); setIsTrackingMaximized(false); }, 2000);
  };

  const toggleRole = (newRole: UserRole) => {
      setRole(newRole);
      setSelectedProvider(null);
      setSelectedOrder(null);
      setSelectedPublicRequest(null);
      setIsRequesting(false);
      setIsCreatingRequest(false);
      setTrackingOrder(null);
      setIsTrackingMaximized(false);
      setViewingClientProfile(null);
      if(newRole === UserRole.PROVIDER) setOrders(MOCK_INCOMING_ORDERS);
      else setOrders([]);
  };

  const handleSelectProviderFromList = (p: ProviderStore) => {
      setSelectedProvider(p);
      setView('map');
      setActiveTab('map');
  };

  const handleUpdateProfile = (updates: Partial<ProviderStore>) => {
      setMyProviderProfile(prev => ({ ...prev, ...updates }));
      setProviders(prev => prev.map(p => p.id === myProviderProfile.id ? { ...p, ...updates } : p));
  };

  const handleViewStore = (providerName: string) => {
      const provider = providers.find(p => p.name === providerName);
      if (provider) setViewingStore(provider);
  }

  // --- Render ---

  if (trackingOrder && isTrackingMaximized && trackingOrder.status !== 'CANCELLED') {
      return <TrackingView role={role} trackingOrder={trackingOrder} providers={providers} onMinimize={() => setIsTrackingMaximized(false)} onCancel={handleCancelTracking} isLoaded={isLoaded} />;
  }

  return (
    <div className="w-full h-screen bg-zinc-900 text-white font-sans overflow-hidden flex flex-col max-w-md mx-auto shadow-2xl border-x border-zinc-800">
       <div className="flex-1 relative overflow-hidden">
          {view === 'map' && (
              <MapView 
                isLoaded={isLoaded}
                role={role}
                providers={providers}
                orders={orders}
                publicRequests={publicRequests}
                selectedProvider={selectedProvider}
                selectedOrder={selectedOrder}
                selectedPublicRequest={selectedPublicRequest}
                myProviderProfile={myProviderProfile}
                filterCategory={filterCategory}
                isRequesting={isRequesting}
                requestDescription={requestDescription}
                onSelectProvider={setSelectedProvider}
                onSelectOrder={setSelectedOrder}
                onSelectPublicRequest={setSelectedPublicRequest}
                onRequestDescriptionChange={setRequestDescription}
                onSetIsRequesting={setIsRequesting}
                onSendRequest={handleSendRequest}
                onAcceptOrder={handleAcceptOrder}
                onRejectOrder={handleRejectOrder}
                onApplyToRequest={handleApplyToRequest}
                onAcceptApplicant={handleAcceptApplicant}
                onDeleteRequest={handleDeleteRequest}
                onFilterChange={setFilterCategory}
                onViewClientProfile={(name) => {
                    const provider = providers.find(p => p.name === name);
                    if (provider) {
                        handleViewStore(name);
                    } else {
                        setViewingClientProfile(name);
                    }
                }}
                onStartChat={handleStartChat}
                onAddPublicRequest={handleAddPublicRequest}
                onOpenAddressModal={() => setIsAddressModalOpen(true)}
                currentAddress={currentAddress}
                isCreatingRequest={isCreatingRequest}
                onSetIsCreatingRequest={setIsCreatingRequest}
                savedAddresses={savedAddresses}
                clientLocation={clientLocation}
                onUpdateLocation={setClientLocation}
                onMapCenterChange={(lat, lng) => setMapCenter({lat, lng})}
              />
          )}
          {view === 'orders' && (
              <OrdersView 
                role={role} 
                orders={orders} 
                onViewOrder={(o) => { setTrackingOrder(o); setIsTrackingMaximized(true); }} 
                onAcceptOrder={handleAcceptOrder} 
                onRejectOrder={handleRejectOrder} 
                onViewClientProfile={setViewingClientProfile}
                publicRequests={publicRequests}
                providers={providers}
                onSelectProvider={handleSelectProviderFromList}
              />
          )}
          {view === 'chats' && <ChatListView sessions={chatSessions} onSelect={setActiveChatSession} />}
          {view === 'profile' && (
              <ProfileView 
                role={role} 
                myProviderProfile={myProviderProfile} 
                onSetRole={toggleRole} 
                publicRequests={publicRequests}
                onDeleteRequest={handleDeleteRequest}
                onUpdateProfile={handleUpdateProfile}
                onViewMyStore={() => setViewingStore(myProviderProfile)}
              />
          )}
          
          {/* Global Modals & Sheets */}
          {viewingClientProfile && <ClientProfileSheet clientName={viewingClientProfile} onClose={() => setViewingClientProfile(null)} />}
          {viewingStore && <StorePreviewSheet provider={viewingStore} onClose={() => setViewingStore(null)} />}
          {activeChatSession && <ChatConversation session={activeChatSession} onClose={() => setActiveChatSession(null)} onViewProfile={() => {/* Todo: link to profile from chat */}} />}
          
          <AddressModal 
            isLoaded={isLoaded}
            isOpen={isAddressModalOpen} 
            onClose={() => setIsAddressModalOpen(false)} 
            addresses={savedAddresses} 
            onSelect={handleSelectAddress}
            onAdd={handleAddAddress}
            onEdit={handleEditAddress}
            currentAddressId={savedAddresses.find(a => a.name === currentAddress)?.id || (currentAddress === 'Mi Ubicación Actual' ? 'current' : undefined)}
          />
       </div>
       <NavBar activeTab={activeTab} onTabChange={handleTabChange} role={role} onCentralClick={handleCentralClick} hasActiveOrder={!!trackingOrder} />
    </div>
  );
};

export default App;
