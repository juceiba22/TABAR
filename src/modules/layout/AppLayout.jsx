import { useState, useEffect, useRef } from "react";
import { useRole, ROLE_LABELS } from "../roles/RoleContext";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../../config/firebase";

const ROLE_PALETTE = {
  admin: { color: "#E3B64F", dim: "rgba(227,182,79,0.10)", border: "rgba(227,182,79,0.25)" },
  industry: { color: "#58A6FF", dim: "rgba(88,166,255,0.10)", border: "rgba(88,166,255,0.25)" },
  state: { color: "#F0883E", dim: "rgba(240,136,62,0.10)", border: "rgba(240,136,62,0.25)" },
  dealer: { color: "#BC8CFF", dim: "rgba(188,140,255,0.10)", border: "rgba(188,140,255,0.25)" },
  producer: { color: "#3FB950", dim: "rgba(63,185,80,0.10)", border: "rgba(63,185,80,0.25)" },
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
    { path: "/market", label: "Mercado Tabacalero" }
  ],
  state: [
    { path: "/state", label: "Mi Dashboard" },
    { path: "/state/invest", label: "Cargar POAs" },
    { path: "/state/returns", label: "FET" },
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
    { path: "/market", label: "Mercado Tabacalero" }
  ],
};

export default function AppLayout({ children }) {
  const { role, user, profile, logout } = useRole();
  const navigate = useNavigate();
  const links = NAV_LINKS[role] || [];
  const palette = ROLE_PALETTE[role] || ROLE_PALETTE.admin;
  const [navOpen, setNavOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); };
  const handleNavClick = () => setNavOpen(false);

  const displayName = profile?.displayName || user?.email || "Usuario";

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
                <path d="M9 1L16 5.5V12.5L9 17L2 12.5V5.5L9 1Z" fill="#080C10" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--tb-text)", letterSpacing: "1px" }}>TABAR</div>
              <div style={{ fontSize: "10px", color: "var(--tb-text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>AgroTabaco Labs</div>
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
              const isEnd = ["/admin", "/industry", "/state", "/dealer", "/producer"].includes(link.path);
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
              background: "var(--tb-surface-2)",
              border: "1px solid var(--tb-border)",
              borderRadius: "6px",
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
              e.currentTarget.style.boxShadow = `0 0 10px ${palette.dim}`;
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
                    width: "24px", 
                    height: "24px", 
                    borderRadius: "50%", 
                    objectFit: "cover", 
                    border: `1.5px solid ${palette.color}`,
                    flexShrink: 0
                  }} 
                />
              ) : (
                <div style={{ 
                  width: "24px", 
                  height: "24px", 
                  borderRadius: "50%", 
                  background: palette.dim, 
                  border: `1.5px solid ${palette.border}`, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: palette.color, 
                  fontSize: "10px", 
                  fontWeight: "bold",
                  fontFamily: "var(--tb-mono)",
                  flexShrink: 0
                }}>
                  {displayName.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                <span style={{ 
                  fontFamily: "var(--tb-mono)", 
                  fontSize: "11px", 
                  color: "var(--tb-text-2)", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis", 
                  whiteSpace: "nowrap",
                  lineHeight: "1.2"
                }}>
                  {displayName}
                </span>
                <span style={{ fontSize: "9px", color: "var(--tb-text-3)", lineHeight: "1" }}>
                  Ver mi perfil
                </span>
              </div>
            </NavLink>
            <button onClick={handleLogout} style={{
              width: "100%", background: "transparent",
              border: "1px solid var(--tb-border)",
              color: "var(--tb-text-3)", padding: "7px",
              cursor: "pointer", fontFamily: "var(--tb-font)",
              fontSize: "12px", borderRadius: "6px",
            }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <div className="tabar-main">
        <header className="tabar-header">
          <div className="tabar-system-name">Financiamiento Agroindustrial</div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* Notification Center */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: unreadCount > 0 ? "#E3B64F" : "#8B949E",
                  fontSize: "18px",
                  cursor: "pointer",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px",
                  borderRadius: "50%",
                  transition: "all 0.2s ease",
                  outline: "none"
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-2px",
                    right: "-2px",
                    background: "#FF453A",
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
                    boxShadow: "0 0 8px #FF453A"
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: "0",
                  width: "320px",
                  maxHeight: "400px",
                  background: "rgba(22, 27, 34, 0.9)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid #30363D",
                  borderRadius: "12px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                  zIndex: 999,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden"
                }}>
                  {/* Dropdown Header */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom: "1px solid #30363D",
                    background: "rgba(255, 255, 255, 0.02)"
                  }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#F0F6FC" }}>Notificaciones</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#E3B64F",
                          fontSize: "11px",
                          cursor: "pointer",
                          fontWeight: "500",
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
                        color: "#8B949E",
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
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                            background: notif.read ? "transparent" : "rgba(227, 182, 79, 0.03)",
                            cursor: "pointer",
                            transition: "background 0.2s ease",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px"
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = notif.read ? "rgba(255,255,255,0.02)" : "rgba(227, 182, 79, 0.05)"; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = notif.read ? "transparent" : "rgba(227, 182, 79, 0.03)"; }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                            <span style={{
                              fontSize: "12px",
                              color: notif.read ? "#8B949E" : "#F0F6FC",
                              fontWeight: notif.read ? "400" : "500",
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
                                background: "#E3B64F",
                                marginTop: "5px",
                                flexShrink: 0
                              }} />
                            )}
                          </div>
                          <span style={{ fontSize: "10px", color: "#8B949E" }}>
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
              Conectado
            </div>
          </div>
        </header>
        <main className="tabar-content">{children || <Outlet />}</main>
      </div>
    </div>
  );
}
