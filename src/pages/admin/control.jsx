import { useState, useEffect } from "react";
import { useRole } from "../../modules/roles/RoleContext";
import { useData } from "../../modules/roles/DataContext";

const C = { accent: "#E3B64F", dim: "rgba(227,182,79,0.10)" };

export default function AdminControl() {
  const { iniciarCampana, cerrarCampana, resetDemo, campana, balances, historial } = useData();
  const [tab, setTab] = useState("campana");
  const [fardosTotales, setFardosTotales] = useState("10000");
  const [duracionDias, setDuracionDias] = useState("180");
  const [campanaStatus, setCampanaStatus] = useState("");

  const handleIniciarCampana = async () => {
    try { 
      await iniciarCampana(parseInt(fardosTotales), parseInt(duracionDias)); 
      setCampanaStatus("Campaña iniciada con éxito"); 
    } catch { 
      setCampanaStatus("Error al iniciar"); 
    }
  };

  const handleCerrarCampana = async () => {
    try { 
      await cerrarCampana(); 
      setCampanaStatus("Campaña cerrada"); 
    } catch { 
      setCampanaStatus("Error al cerrar"); 
    }
  };

  const handleReset = async () => {
    try { 
      await resetDemo(); 
      setCampanaStatus("Sistema reseteado a cero"); 
    } catch { 
      setCampanaStatus("Error al resetear"); 
    }
  };

  const TABS = [
    { id: "campana", label: "Campaña" },
    { id: "estado", label: "Estado Global" },
    { id: "solicitudes", label: "Solicitudes de Acceso" },
    { id: "auditoria", label: "Auditoría" },
  ];

  // User management logic
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      // In a real app we would use Firestore collection query
      // For the MVP context, we'll assume the DataContext or a direct fetch handles it
      // But let's try to fetch directly from Firestore for accuracy
      const { collection, getDocs, query, where, updateDoc, doc } = await import("firebase/firestore");
      const { db } = await import("../../config/firebase");
      
      const q = query(collection(db, "users"), where("status", "==", "pending_approval"));
      const snapshot = await getDocs(q);
      const userList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const { updateDoc, doc } = await import("firebase/firestore");
      const { db } = await import("../../config/firebase");
      await updateDoc(doc(db, "users", userId), { status: "active" });
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  useEffect(() => { if (tab === "solicitudes") fetchUsers(); }, [tab]);

  return (
    <div>
      <div className="tabar-page-header">
        <div className="tabar-page-header-row">
          <div className="tabar-page-icon" style={{ background: C.dim, color: C.accent }}>▣</div>
          <h1>Control del Sistema</h1>
        </div>
        <p style={{ margin: 0, color: "#8B949E", fontSize: "13px" }}>Gestión del negocio fiduciario en tiempo real</p>
      </div>

      <div className="tabar-tabs">
        {TABS.map((t) => (
          <button key={t.id} className="tabar-tab" style={tab === t.id ? { borderColor: C.accent, color: C.accent } : {}} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "campana" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Gestión de campaña</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Fardos totales a financiar</label>
              <input type="number" value={fardosTotales} onChange={(e) => setFardosTotales(e.target.value)} className="tabar-input" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8B949E", marginBottom: "6px" }}>Duración (días)</label>
              <input type="number" value={duracionDias} onChange={(e) => setDuracionDias(e.target.value)} className="tabar-input" />
            </div>
            <div className="tabar-btn-row" style={{ marginTop: "10px" }}>
              <button onClick={handleIniciarCampana} className="tabar-btn tabar-btn-primary">Iniciar Nueva</button>
              <button onClick={handleCerrarCampana} className="tabar-btn tabar-btn-ghost" style={{ borderColor: "rgba(248,81,73,0.3)", color: "#F85149" }}>Cerrar Actual</button>
              <button onClick={handleReset} className="tabar-btn tabar-btn-secondary" style={{ marginLeft: "auto" }}>Reset Sistema</button>
            </div>
            {campanaStatus && <p style={{ fontSize: "12px", color: "#8B949E", marginTop: "10px" }}>{campanaStatus}</p>}
          </div>
        </div>
      )}

      {tab === "estado" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="tabar-card">
            <h3 className="tabar-card-title">Estado de campaña activa</h3>
            {campana ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <InfoRow label="Activa" value={campana.activa ? "Sí" : "No"} valueColor={campana.activa ? "#3FB950" : "#F85149"} />
                <InfoRow label="Fardos totales" value={campana.fardosTotales?.toLocaleString("es-AR") || "0"} />
                <InfoRow label="Fardos vendidos" value={campana.fardosVendidos?.toLocaleString("es-AR") || "0"} />
                <InfoRow label="Fardos disponibles" value={campana.fardosDisponibles?.toLocaleString("es-AR") || "0"} />
              </div>
            ) : <p style={{ color: "#484F58", fontSize: "13px" }}>No hay datos de campaña</p>}
          </div>
          <div className="tabar-card">
            <h3 className="tabar-card-title">Distribución Global (Posiciones)</h3>
            {balances ? (
              <div className="tabar-table-wrap">
                <table className="tabar-table">
                  <thead><tr><th>Sector</th><th>Balance (TABAR)</th></tr></thead>
                  <tbody>
                    <tr>
                      <td className="mono" style={{ textTransform: "capitalize" }}>Industria Exportadora</td>
                      <td style={{ fontFamily: "var(--tb-mono)", fontSize: "12px", color: balances.industry > 0 ? "#58A6FF" : "#484F58" }}>{(balances.industry || 0).toLocaleString("es-AR")}</td>
                    </tr>
                    <tr>
                      <td className="mono" style={{ textTransform: "capitalize" }}>Estado Nacional (FET)</td>
                      <td style={{ fontFamily: "var(--tb-mono)", fontSize: "12px", color: balances.state > 0 ? "#F0883E" : "#484F58" }}>{(balances.state || 0).toLocaleString("es-AR")}</td>
                    </tr>
                    <tr>
                      <td className="mono" style={{ textTransform: "capitalize" }}>Mercado Dealer</td>
                      <td style={{ fontFamily: "var(--tb-mono)", fontSize: "12px", color: balances.dealer > 0 ? "#BC8CFF" : "#484F58" }}>{(balances.dealer || 0).toLocaleString("es-AR")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : <p style={{ color: "#484F58", fontSize: "13px" }}>Sin datos de balances</p>}
          </div>
        </div>
      )}

      {tab === "solicitudes" && (
        <div className="tabar-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--tb-border)", paddingBottom: "10px" }}>
            <h3 style={{ margin: 0, fontSize: "13px", color: "var(--tb-text-2)", fontWeight: 500 }}>Pendientes de Aprobación</h3>
            <button onClick={fetchUsers} disabled={usersLoading} style={{ background: "none", border: "none", color: "var(--tb-accent)", fontSize: "11px", cursor: "pointer" }}>
              {usersLoading ? "Actualizando..." : "↻ Refrescar"}
            </button>
          </div>
          
          {users.length > 0 ? (
            <div className="tabar-table-wrap">
              <table className="tabar-table">
                <thead>
                  <tr>
                    <th>Entidad / Responsable</th>
                    <th>Tipo</th>
                    <th>Email</th>
                    <th style={{ textAlign: "right" }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "13px", color: "var(--tb-text)", fontWeight: 500 }}>{u.companyName}</span>
                          <span style={{ fontSize: "11px", color: "var(--tb-text-3)" }}>{u.displayName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="tabar-badge" style={{ 
                          background: "rgba(255,255,255,0.05)", 
                          color: "var(--tb-text-2)",
                          textTransform: "capitalize",
                          fontSize: "10px"
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td className="mono" style={{ fontSize: "11px" }}>{u.email}</td>
                      <td style={{ textAlign: "right" }}>
                        <button 
                          onClick={() => handleApprove(u.id)} 
                          className="tabar-btn tabar-btn-primary" 
                          style={{ padding: "4px 10px", fontSize: "11px", width: "auto" }}
                        >
                          Aprobar Acceso
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--tb-text-3)" }}>
              <p style={{ fontSize: "13px" }}>{usersLoading ? "Cargando solicitudes..." : "No hay solicitudes pendientes de aprobación."}</p>
            </div>
          )}
        </div>
      )}

      {tab === "auditoria" && (
        <div className="tabar-card">
          <h3 className="tabar-card-title">Registro de Auditoría</h3>
          {historial && historial.length > 0 ? (
            <div className="tabar-table-wrap">
              <table className="tabar-table">
                <thead><tr><th>Hora</th><th>Usuario</th><th>Evento</th></tr></thead>
                <tbody>
                  {historial.map(log => (
                    <tr key={log.id}>
                      <td className="mono" style={{ fontSize: "11px", color: "#8B949E" }}>{log.hora}</td>
                      <td style={{ fontSize: "12px" }}>{log.user}</td>
                      <td style={{ fontSize: "12px", color: log.tipo === 'success' ? '#3FB950' : log.tipo === 'warning' ? '#E3B64F' : '#F0F6FC' }}>{log.msg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p style={{ color: "#484F58", fontSize: "13px" }}>No hay registros recientes</p>}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", flexWrap: "wrap", gap: "4px" }}>
      <span style={{ fontSize: "12px", color: "#484F58" }}>{label}</span>
      <span style={{ fontSize: "12px", color: valueColor || "#8B949E", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
