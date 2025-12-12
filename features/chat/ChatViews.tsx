
import React from 'react';
import { ArrowLeft, User, Send } from 'lucide-react';
import { ChatSession } from '../../types';

export const ChatConversation: React.FC<{ session: ChatSession; onClose: () => void; onViewProfile: (name: string) => void }> = ({ session, onClose, onViewProfile }) => (
    <div className="fixed inset-0 z-[2000] bg-black flex flex-col animate-in slide-in-from-right">
        <div className="border-b border-zinc-800 p-4 flex items-center justify-between bg-zinc-900">
             <div className="flex items-center gap-3">
                 <button onClick={onClose}><ArrowLeft className="w-5 h-5" /></button>
                 <div onClick={() => onViewProfile(session.participants)} className="cursor-pointer flex items-center gap-2 hover:opacity-80">
                    <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center border border-zinc-500">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">{session.participants}</h3>
                        <span className="text-[10px] text-zinc-400 block leading-none">Toca para ver perfil</span>
                    </div>
                 </div>
             </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {/* Mock messages */}
             <div className="flex justify-start"><div className="bg-zinc-800 text-white p-3 rounded-xl rounded-tl-none text-sm max-w-[80%]">Hola, ¿en qué puedo ayudarte con tu solicitud?</div></div>
             <div className="flex justify-end"><div className="bg-white text-black p-3 rounded-xl rounded-tr-none text-sm max-w-[80%]">{session.lastMessage}</div></div>
        </div>
        <div className="p-4 border-t border-zinc-800 flex gap-2 bg-black">
            <input type="text" placeholder="Escribe un mensaje..." className="flex-1 bg-zinc-900 border border-zinc-700 p-3 text-white rounded-full px-4 focus:border-white focus:outline-none" />
            <button className="bg-white text-black p-3 rounded-full hover:bg-zinc-200"><Send className="w-4 h-4" /></button>
        </div>
    </div>
);

export const ChatListView: React.FC<{ sessions: ChatSession[]; onSelect: (s: ChatSession) => void }> = ({ sessions, onSelect }) => (
    <div className="h-full bg-black flex flex-col pt-12 pb-32">
         <div className="px-6 mb-6"><h2 className="text-3xl font-black uppercase">Mensajes</h2></div>
         <div className="flex-1 overflow-y-auto">
             {sessions.length === 0 && <p className="text-zinc-500 text-center mt-10 px-4">No tienes chats activos.</p>}
             {sessions.map(chat => (
                 <div key={chat.id} onClick={() => onSelect(chat)} className="flex items-center gap-4 px-6 py-4 border-b border-zinc-900 hover:bg-zinc-900 cursor-pointer">
                     <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700"><User className="w-6 h-6 text-zinc-400" /></div>
                     <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-center mb-1">
                             <h3 className="font-bold text-white truncate">{chat.participants}</h3>
                             <span className="text-[10px] text-zinc-600">{new Date(chat.lastTimestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         </div>
                         <p className="text-sm text-zinc-500 truncate">{chat.lastMessage}</p>
                     </div>
                 </div>
             ))}
         </div>
    </div>
);
