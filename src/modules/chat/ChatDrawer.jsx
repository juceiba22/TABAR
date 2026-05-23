import { useState, useEffect, useRef } from "react";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useRole } from "../roles/RoleContext";
import { useChat } from "./ChatContext";
import "./chat.css";

export default function ChatDrawer() {
  const { user } = useRole();
  const { isDrawerOpen, activeChatId, closeDrawer, clearActiveChat, openChat } = useChat();
  
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Cargar todos los chats del usuario
  useEffect(() => {
    if (!user?.uid) return;
    
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordenar por última actividad descendente (client-side para no depender de composite indexes)
      chatList.sort((a, b) => {
        const timeA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
        const timeB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
        return timeB - timeA;
      });
      setChats(chatList);
    });

    return () => unsubscribe();
  }, [user]);

  // Cargar mensajes del chat activo
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    
    const messagesRef = collection(db, "chats", activeChatId, "messages");
    const q = query(messagesRef, orderBy("creadoEn", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [activeChatId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !user?.uid) return;

    const text = newMessage.trim();
    setNewMessage(""); // Limpiar input rápido

    try {
      const messagesRef = collection(db, "chats", activeChatId, "messages");
      await addDoc(messagesRef, {
        senderId: user.uid,
        text,
        creadoEn: serverTimestamp()
      });

      const chatRef = doc(db, "chats", activeChatId);
      await updateDoc(chatRef, {
        lastMessage: text,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
    }
  };

  if (!isDrawerOpen) return null;

  const activeChat = chats.find(c => c.id === activeChatId);
  const otherParticipantId = activeChat?.participants?.find(p => p !== user?.uid);
  const otherParticipantName = otherParticipantId && activeChat?.participantsData 
    ? activeChat.participantsData[otherParticipantId]?.name 
    : "Usuario";

  return (
    <>
      {/* Overlay oscuro para cerrar al hacer click fuera */}
      <div className="chat-overlay" onClick={closeDrawer} />
      
      <div className="chat-drawer">
        <div className="chat-header">
          {activeChatId ? (
            <>
              <button className="chat-back-btn" onClick={clearActiveChat}>←</button>
              <div className="chat-header-info">
                <h3>{otherParticipantName}</h3>
                <span>{activeChat?.operationTitle || "Negociación"}</span>
              </div>
            </>
          ) : (
            <>
              <div className="chat-header-info">
                <h3>Mensajes Privados</h3>
                <span>Tus negociaciones activas</span>
              </div>
            </>
          )}
          <button className="chat-close-btn" onClick={closeDrawer}>✕</button>
        </div>

        <div className="chat-body">
          {activeChatId ? (
            <div className="chat-messages-container">
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">Escribe el primer mensaje para iniciar la negociación.</div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                      <div key={msg.id} className={`chat-bubble-wrapper ${isMe ? 'chat-mine' : 'chat-theirs'}`}>
                        <div className="chat-bubble">
                          {msg.text}
                          <div className="chat-time">
                            {msg.creadoEn?.toDate 
                              ? new Date(msg.creadoEn.toDate()).toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' })
                              : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  placeholder="Escribe un mensaje..."
                />
                <button type="submit" disabled={!newMessage.trim()}>Enviar</button>
              </form>
            </div>
          ) : (
            <div className="chat-list">
              {chats.length === 0 ? (
                <div className="chat-empty">No tienes conversaciones activas.</div>
              ) : (
                chats.map(chat => {
                  const otherId = chat.participants?.find(p => p !== user?.uid);
                  const otherName = chat.participantsData?.[otherId]?.name || "Usuario";
                  
                  return (
                    <div key={chat.id} className="chat-list-item" onClick={() => openChat(chat.id)}>
                      <div className="chat-avatar">
                        {otherName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="chat-preview">
                        <div className="chat-preview-header">
                          <span className="chat-name">{otherName}</span>
                          <span className="chat-date">
                            {chat.updatedAt?.toDate 
                              ? new Date(chat.updatedAt.toDate()).toLocaleDateString("es-AR", { day: '2-digit', month: 'short' })
                              : ""}
                          </span>
                        </div>
                        <div className="chat-op-title">{chat.operationTitle || "Negociación"}</div>
                        <div className="chat-last-msg">{chat.lastMessage || "Sin mensajes aún..."}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
