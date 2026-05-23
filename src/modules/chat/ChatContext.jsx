import { createContext, useContext, useState, useCallback } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setActiveChatId(null);
  }, []);

  const openChat = useCallback((chatId) => {
    setActiveChatId(chatId);
    setIsDrawerOpen(true);
  }, []);

  const clearActiveChat = useCallback(() => {
    setActiveChatId(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isDrawerOpen,
        activeChatId,
        toggleDrawer,
        openDrawer,
        closeDrawer,
        openChat,
        clearActiveChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
}
