import { createContext, useContext, useState, useEffect } from "react";

const RequestContext = createContext(null);

export function RequestProvider({ children }) {
  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem("tabar_requests");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("tabar_requests", JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem("tabar_requests");
      if (saved) setRequests(JSON.parse(saved));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const addRequest = (from_role, to_role, type, payload) => {
    const newReq = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      from_role,
      to_role,
      type,
      status: "pending",
      payload,
      created_at: new Date().toISOString()
    };
    setRequests(prev => [...prev, newReq]);
    return newReq;
  };

  const updateRequestStatus = (id, status) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  return (
    <RequestContext.Provider value={{ requests, addRequest, updateRequestStatus }}>
      {children}
    </RequestContext.Provider>
  );
}

export function useRequests() {
  const ctx = useContext(RequestContext);
  if (!ctx) throw new Error("useRequests must be used inside RequestProvider");
  return ctx;
}
