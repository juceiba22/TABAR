import { useState, useEffect, useRef } from "react";
import { useRole, ROLE_LABELS, ROLE_HOME, DEMO_PROFILES } from "../roles/RoleContext";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useChat } from "../chat/ChatContext";
import ChatDrawer from "../chat/ChatDrawer";

const ROLE_PALETTE = {
  admin: { color: "#132a1e", dim: "rgba(19,42,30,0.08)", border: "rgba(19,42,30,0.25)" },
  industry: { color: "#1a4329", dim: "rgba(26,67,41,0.08)", border: "rgba(26,67,41,0.25)" },
  dealer: { color: "#775a00", dim: "rgba(119,90,0,0.08)", border: "rgba(119,90,0,0.25)" },
  producer: { color: "#132a1e", dim: "rgba(19,42,30,0.08)", border: "rgba(19,42,30,0.25)" },
};

const NAV_LINKS = {
  admin: [
    { path: "/admin", label: "Panel Principal", icon: "dashboard" },
    { path: "/admin/control", label: "Control del Sistema", icon: "tune" },
    { path: "/campaign", label: "Campaña Agrícola", icon: "calendar_month" },
    { path: "/market", label: "Mercado Tabacalero", icon: "storefront" }
  ],
  industry: [
    { path: "/industry", label: "Mi Dashboard", icon: "dashboard" },
    { path: "/industry/buy", label: "Orden de Compra", icon: "shopping_cart" },
    { path: "/industry/financing", label: "Solicitar Financiamiento", icon: "account_balance" },
    { path: "/warrants", label: "Warrants Digitales", icon: "token" },
    { path: "/market", label: "Mercado Tabacalero", icon: "storefront" }
  ],
  dealer: [
    { path: "/dealer", label: "Mi Dashboard", icon: "dashboard" },
    { path: "/dealer/trade", label: "Operar Tabaco", icon: "candlestick_chart" },
    { path: "/market", label: "Mercado Tabacalero", icon: "storefront" }
  ],
  producer: [
    { path: "/producer", label: "Mi Tabaco", icon: "psychiatry" },
    { path: "/producer/tokenizar", label: "Certificar Tabaco", icon: "verified" },
    { path: "/producer/asociaciones", label: "Mis Asociaciones", icon: "groups" },
    { path: "/warrants", label: "Warrants Digitales", icon: "token" },
    { path: "/market", label: "Mercado Tabacalero", icon: "storefront" }
  ],
};

export default function AppLayout({ children }) {
  const { role, user, profile, logout, setDemoRole } = useRole();
  const navigate = useNavigate();
  const links = NAV_LINKS[role] || [];
  const palette = ROLE_PALETTE[role] || ROLE_PALETTE.admin;
  const [navOpen, setNavOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); };
  const handleNavClick = () => setNavOpen(false);

  const displayName = profile?.displayName || user?.email || "Usuario";

  const { toggleDrawer } = useChat();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      items.sort((a, b) => {
        const timeA = a.creadoEn?.toDate ? a.creadoEn.toDate().getTime() : 0;
        const timeB = b.creadoEn?.toDate ? b.creadoEn.toDate().getTime() : 0;
        return timeB - timeA;
      });
      setNotifications(items);
    }, (err) => {
      console.error("Error fetching notifications:", err);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef]);

  const handleMarkAsRead = async (notifId) => {
    try {
      const ref = doc(db, "notifications", notifId);
      await updateDoc(ref, { read: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        const ref = doc(db, "notifications", n.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="tabar-shell">
      <aside className="tabar-sidebar">
        <div className="tabar-sidebar-top">
          <NavLink to="/" className="tabar-logo" style={{ textDecoration: "none" }}>
            <div className="tabar-logo-mark">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" fill="#ffffff" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "var(--tb-serif)", fontSize: "16px", fontWeight: 700, color: "var(--tb-accent)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>TABAR Protocol</div>
              <div style={{ fontSize: "10px", color: "var(--tb-text-2)", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700 }}>AgroTabaco Labs</div>
            </div>
          </NavLink>
          <button className="tabar-hamburger" onClick={() => setNavOpen(!navOpen)}>
            {navOpen ? "✕" : "☰"}
          </button>
        </div>

        <div className={`tabar-nav-wrap${navOpen ? " open" : ""}`}>
          <div className="tabar-role-badge" style={{
            color: palette.color,
            borderColor: palette.border,
            background: palette.dim,
            fontFamily: "var(--tb-mono)"
          }}>
            {ROLE_LABELS[role] || "Sin rol"}
          </div>

          <nav className="tabar-nav">
            {links.map((link) => {
              const isEnd = ["/admin", "/industry", "/dealer", "/producer"].includes(link.path);
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={isEnd}
                  onClick={handleNavClick}
                  className={({ isActive }) => `tabar-nav-link${isActive ? " active" : ""}`}
                  style={({ isActive }) => ({
                    background: isActive ? palette.dim : undefined,
                    color: isActive ? palette.color : undefined,
                    borderColor: isActive ? palette.border : undefined,
                  })}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{link.icon || "arrow_forward"}</span>
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="tabar-sidebar-bottom">
            <NavLink
              to="/miPerfil"
              onClick={handleNavClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                color: "var(--tb-text)",
                padding: "8px 10px",
                borderRadius: "6px",
                background: "var(--tb-surface-2)",
                border: "1px solid var(--tb-border)",
                marginBottom: "8px",
              }}
            >
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: palette.color, color: "#ffffff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 700, flexShrink: 0,
              }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden", flex: 1 }}>
                <span style={{ display: "block", fontSize: "12px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName}
                </span>
                <span style={{ fontSize: "10px", color: "var(--tb-text-2)", lineHeight: "1.1" }}>
                  Ver mi perfil
                </span>
              </div>
            </NavLink>
            <button onClick={handleLogout} className="tabar-btn tabar-btn-ghost tabar-btn-full" style={{ padding: "7px", fontSize: "12px" }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <div className="tabar-main">
        {/* Top Bar Entorno Demo */}
        <div className="tabar-telemetry-ribbon">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span><span className="tabar-telemetry-pulse" />ENTORNO DEMO:</span>
            <span style={{ color: "#c1c8c0" }}>TABAR Protocol · Plataforma en Fase de Demostración & Simulación</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#ffdeac" }}>
            <span>VERSIÓN DEMO v1.2</span>
          </div>
        </div>

        {/* Banner de Acceso y Cambio de Rol Demo en Vivo */}
        <div className="tabar-demo-banner">
          <div className="tabar-demo-banner-title">
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--tb-secondary)" }}>swap_horiz</span>
            <span>AgroTabaco Demo Hub</span>
            <span style={{ opacity: 0.8, fontSize: '11px', fontWeight: 400 }}>| Explorar roles:</span>
          </div>
          <div className="tabar-demo-banner-roles">
            {[
              { id: "producer", label: "🌿 Productor" },
              { id: "industry", label: "🏢 Acopiador" },
              { id: "dealer", label: "💼 Dealer" },
              { id: "admin", label: "🔑 Admin" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setDemoRole(r.id);
                  navigate(ROLE_HOME[r.id] || "/");
                }}
                className={`tabar-demo-role-btn${role === r.id ? " active" : ""}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <header className="tabar-header">
          <div className="tabar-system-name" style={{ color: 'var(--tb-accent)', fontFamily: 'var(--tb-serif)', fontWeight: 600, fontSize: '15px' }}>
            Mercado & Financiamiento Agroindustrial
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>
            {/* Chat Assistant */}
            <button
              onClick={toggleDrawer}
              style={{
                background: "var(--tb-surface-2)",
                border: "1px solid var(--tb-border)",
                color: "var(--tb-accent)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px 12px",
                borderRadius: "6px",
                transition: "all 0.2s ease",
                gap: "6px",
                fontFamily: "var(--tb-font)",
                fontSize: "12px",
                fontWeight: 600
              }}
              title="Asistente IA de Mercado"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>forum</span>
              <span>Asistente IA</span>
            </button>

            {/* Notification Center */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: "var(--tb-surface-2)",
                  border: "1px solid var(--tb-border)",
                  color: unreadCount > 0 ? "var(--tb-accent)" : "var(--tb-text-2)",
                  cursor: "pointer",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                }}
                title="Centro de Notificaciones"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>notifications</span>
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "var(--tb-secondary)",
                    color: "#132a1e",
                    fontSize: "10px",
                    fontWeight: 700,
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="tabar-notif-dropdown">
                  <div style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--tb-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--tb-surface-2)"
                  }}>
                    <span style={{ fontFamily: "var(--tb-serif)", fontSize: "14px", fontWeight: 700, color: "var(--tb-accent)" }}>
                      Notificaciones
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--tb-accent)",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0
                        }}
                      >
                        Marcar todas leídas
                      </button>
                    )}
                  </div>

                  <div style={{ flex: 1, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "30px 16px", textAlign: "center", color: "var(--tb-text-2)", fontSize: "12px" }}>
                        <div style={{ fontSize: "24px", marginBottom: "8px" }}>📭</div>
                        No tienes notificaciones pendientes
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const dateStr = n.creadoEn?.toDate 
                          ? n.creadoEn.toDate().toLocaleDateString("es-AR", { hour: "2-digit", minute: "2-digit" }) 
                          : "";
                        return (
                          <div
                            key={n.id}
                            onClick={() => handleMarkAsRead(n.id)}
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid var(--tb-border)",
                              background: n.read ? "#ffffff" : "var(--tb-surface-tint)",
                              cursor: "pointer",
                              transition: "background 0.15s ease"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--tb-accent)" }}>
                                {n.titulo || "Aviso del Sistema"}
                              </span>
                              <span style={{ fontSize: "10px", color: "var(--tb-text-3)", fontFamily: "var(--tb-mono)" }}>
                                {dateStr}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: "12px", color: "var(--tb-text-2)", lineHeight: "1.4" }}>
                              {n.mensaje}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="tabar-content">
          <Outlet />
          {children}
        </main>
      </div>

      <ChatDrawer />
    </div>
  );
}
