import { useState, useEffect, useRef } from "react";
import { useRole, ROLE_LABELS, ROLE_HOME, DEMO_PROFILES } from "../roles/RoleContext";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useChat } from "../chat/ChatContext";
import ChatDrawer from "../chat/ChatDrawer";

const ROLE_PALETTE = {
  admin: { color: "#1a4329", dim: "rgba(26,67,41,0.08)", border: "rgba(26,67,41,0.25)" },
  industry: { color: "#2f6844", dim: "rgba(47,104,68,0.08)", border: "rgba(47,104,68,0.25)" },
  dealer: { color: "#8a5a2e", dim: "rgba(138,90,46,0.08)", border: "rgba(138,90,46,0.25)" },
  producer: { color: "#2f6844", dim: "rgba(47,104,68,0.08)", border: "rgba(47,104,68,0.25)" },
};

const NAV_LINKS = {
  admin: [
    { path: "/admin", label: "Panel Principal" },
    { path: "/admin/control", label: "Control del Sistema" },
    { path: "/campaign", label: "Campaña" },
    { path: "/market", label: "Mercado Tabacalero" }
  ],
  industry: [
    { path: "/industry", label: "Mi Dashboard" },
    { path: "/industry/buy", label: "Orden de Compra" },
    { path: "/industry/financing", label: "Solicitar Financiamiento" },
    { path: "/warrants", label: "Warrants Digitales" },
    { path: "/market", label: "Mercado Tabacalero" }
  ],
  dealer: [
    { path: "/dealer", label: "Mi Dashboard" },
    { path: "/dealer/trade", label: "Operar" },
    { path: "/market", label: "Mercado Tabacalero" }
  ],
  producer: [
    { path: "/producer", label: "Mi tabaco" },
    { path: "/producer/tokenizar", label: "Certificar Tabaco" },
    { path: "/producer/asociaciones", label: "Mis Asociaciones" },
    { path: "/warrants", label: "Warrants Digitales" },
    { path: "/market", label: "Mercado Tabacalero" }
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
      // Client-side sort by creadoEn desc
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
          <div className="tabar-logo">
            <div className="tabar-logo-mark">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" fill="#ffffff" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--tb-accent)", letterSpacing: "0.5px" }}>TABAR</div>
              <div style={{ fontSize: "10px", color: "var(--tb-text-2)", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600 }}>AgroTabaco Labs</div>
            </div>
          </div>
          <button className="tabar-hamburger" onClick={() => setNavOpen(!navOpen)}>
            {navOpen ? "✕" : "☰"}
          </button>
        </div>

        <div className={`tabar-nav-wrap ${navOpen ? "open" : ""}`}>
          <div className="tabar-role-badge" style={{
            borderColor: palette.border,
            color: palette.color,
            background: palette.dim,
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
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="tabar-sidebar-bottom">
            <NavLink to="/miPerfil" style={{
              background: "#ffffff",
              border: "1px solid var(--tb-border)",
              borderRadius: "8px",
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
              textDecoration: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = palette.color;
              e.currentTarget.style.boxShadow = `0 2px 8px ${palette.dim}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--tb-border)";
              e.currentTarget.style.boxShadow = "none";
            }}
            >
              {profile?.profilePicUrl ? (
                <img 
                  src={profile.profilePicUrl} 
                  alt="Avatar" 
                  style={{ 
                    width: "26px", 
                    height: "26px", 
                    borderRadius: "50%", 
                    objectFit: "cover", 
                    border: `1.5px solid ${palette.color}`,
                    flexShrink: 0
                  }} 
                />
              ) : (
                <div style={{ 
                  width: "26px", 
                  height: "26px", 
                  borderRadius: "50%", 
                  background: palette.dim, 
                  border: `1.5px solid ${palette.border}`, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: palette.color, 
                  fontSize: "11px", 
                  fontWeight: "bold",
                  fontFamily: "var(--tb-mono)",
                  flexShrink: 0
                }}>
                  {displayName.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                <span style={{ 
                  fontFamily: "var(--tb-font)", 
                  fontSize: "12px", 
                  fontWeight: 600,
                  color: "var(--tb-text)", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis", 
                  whiteSpace: "nowrap",
                  lineHeight: "1.2"
                }}>
                  {displayName}
                </span>
                <span style={{ fontSize: "10px", color: "var(--tb-text-2)", lineHeight: "1.1" }}>
                  Ver mi perfil
                </span>
              </div>
            </NavLink>
            <button onClick={handleLogout} style={{
              width: "100%", background: "#ffffff",
              border: "1px solid var(--tb-border)",
              color: "var(--tb-text-2)", padding: "7px",
              cursor: "pointer", fontFamily: "var(--tb-font)",
              fontSize: "12px", borderRadius: "6px", fontWeight: 500,
            }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <div className="tabar-main">
        {/* Banner de Acceso y Cambio de Rol Demo en Vivo */}
        <div className="tabar-demo-banner">
          <div className="tabar-demo-banner-title">
            <span>🔬 AgroTabaco Demo Hub</span>
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
          <div className="tabar-system-name" style={{ color: 'var(--tb-accent)', fontWeight: 600 }}>
            Mercado & Financiamiento Agroindustrial
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginLeft: "auto" }}>
            {/* Chat Center */}
            <button
              onClick={toggleDrawer}
              style={{
                background: "#f1f2ed",
                border: "1px solid var(--tb-border)",
                color: "var(--tb-accent)",
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px 10px",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                outline: "none"
              }}
              title="Asistente IA de Mercado"
            >
              💬 <span style={{ fontSize: '12px', fontWeight: 600, marginLeft: '4px' }}>Asistente</span>
            </button>

            {/* Notification Center */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: "#f1f2ed",
                  border: "1px solid var(--tb-border)",
                  color: unreadCount > 0 ? "var(--tb-accent)" : "var(--tb-text-2)",
                  fontSize: "16px",
                  cursor: "pointer",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                  outline: "none"
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-3px",
                    right: "-3px",
                    background: "#a13f2e",
                    color: "#FFFFFF",
                    fontSize: "9px",
                    fontWeight: "bold",
                    borderRadius: "50%",
                    minWidth: "15px",
                    height: "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2px",
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="tabar-notif-dropdown">
                  {/* Dropdown Header */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--tb-border)",
                    background: "#f7f7f2"
                  }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--tb-accent)" }}>Notificaciones</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--tb-accent)",
                          fontSize: "11px",
                          cursor: "pointer",
                          fontWeight: "600",
                          padding: "0"
                        }}
                      >
                        Limpiar todas
                      </button>
                    )}
                  </div>

                  {/* Dropdown List */}
                  <div style={{
                    overflowY: "auto",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column"
                  }}>
                    {notifications.length === 0 ? (
                      <div style={{
                        padding: "32px 16px",
                        textAlign: "center",
                        color: "var(--tb-text-2)",
                        fontSize: "13px"
                      }}>
                        No tienes notificaciones
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id)}
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #f1f2ed",
                            background: notif.read ? "#ffffff" : "rgba(26, 67, 41, 0.04)",
                            cursor: "pointer",
                            transition: "background 0.2s ease",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                            <span style={{
                              fontSize: "12px",
                              color: "var(--tb-text)",
                              fontWeight: notif.read ? "400" : "600",
                              lineHeight: "1.4",
                              flex: 1
                            }}>
                              {notif.message}
                            </span>
                            {!notif.read && (
                              <span style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "var(--tb-accent)",
                                marginTop: "5px",
                                flexShrink: 0
                              }} />
                            )}
                          </div>
                          <span style={{ fontSize: "10px", color: "var(--tb-text-3)" }}>
                            {notif.creadoEn?.toDate 
                              ? new Date(notif.creadoEn.toDate()).toLocaleDateString("es-AR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) 
                              : "Reciente"
                            }
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="tabar-connected-badge">
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--tb-green)", flexShrink: 0 }} />
              En línea (Demo)
            </div>
          </div>
        </header>
        <main className="tabar-content">
          {children || <Outlet />}
          <ChatDrawer />
        </main>
      </div>
    </div>
  );
}
