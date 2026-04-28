import { createContext, useContext, useState } from "react";

const DemoContext = createContext(null);

const ESTADO_INICIAL = {
  campana: {
    activa: false,
    fardosTotales: 0,
    fardosVendidos: 0,
    fardosDisponibles: 0,
    diasTotales: 180,
    diasTranscurridos: 0,
    inicio: null,
    fin: null,
  },
  balances: {
    industry: 0,
    state: 0,
    dealer: 0,
  },
  historial: [],
};

export function DemoProvider({ children }) {
  const [campana, setCampana] = useState(ESTADO_INICIAL.campana);
  const [balances, setBalances] = useState(ESTADO_INICIAL.balances);
  const [historial, setHistorial] = useState(ESTADO_INICIAL.historial);

  const addHistorial = (msg, tipo = "info") => {
    const hora = new Date().toLocaleTimeString("es-AR");
    setHistorial((prev) => [{ msg, tipo, hora, id: Date.now() }, ...prev]);
  };

  const iniciarCampana = (fardosTotales, diasTotales = 180) => {
    const ahora = new Date();
    const fin = new Date(ahora.getTime() + diasTotales * 86400000);
    setCampana({
      activa: true,
      fardosTotales,
      fardosVendidos: 0,
      fardosDisponibles: fardosTotales,
      diasTotales,
      diasTranscurridos: 0,
      inicio: ahora,
      fin,
    });
    addHistorial(`✅ Campaña iniciada: ${fardosTotales.toLocaleString("es-AR")} TABAR por ${diasTotales} días`, "success");
  };

  const cerrarCampana = () => {
    setCampana((prev) => ({ ...prev, activa: false }));
    addHistorial("🔒 Campaña cerrada.", "warning");
  };

  const comprarIndustry = (cantidad) => {
    if (!campana.activa) return { ok: false, error: "No hay campaña activa." };
    if (cantidad > campana.fardosDisponibles) return { ok: false, error: `Solo hay ${campana.fardosDisponibles} TABAR disponibles.` };
    setCampana((prev) => ({
      ...prev,
      fardosVendidos: prev.fardosVendidos + cantidad,
      fardosDisponibles: prev.fardosDisponibles - cantidad,
    }));
    setBalances((prev) => ({ ...prev, industry: prev.industry + cantidad }));
    addHistorial(`✅ Industria compró ${cantidad.toLocaleString("es-AR")} TABAR`, "success");
    return { ok: true };
  };

  const invertirState = (cantidad) => {
    if (!campana.activa) return { ok: false, error: "No hay campaña activa." };
    if (cantidad > campana.fardosDisponibles) return { ok: false, error: `Solo hay ${campana.fardosDisponibles} TABAR disponibles.` };
    setCampana((prev) => ({
      ...prev,
      fardosVendidos: prev.fardosVendidos + cantidad,
      fardosDisponibles: prev.fardosDisponibles - cantidad,
    }));
    setBalances((prev) => ({ ...prev, state: prev.state + cantidad }));
    addHistorial(`✅ Estado Nacional invirtió ${cantidad.toLocaleString("es-AR")} TABAR vía FET`, "success");
    return { ok: true };
  };

  const operarDealer = (tipo, cantidad) => {
    if (!campana.activa) return { ok: false, error: "No hay campaña activa." };
    if (tipo === "buy") {
      if (cantidad > campana.fardosDisponibles) return { ok: false, error: `Solo hay ${campana.fardosDisponibles} TABAR disponibles.` };
      setCampana((prev) => ({
        ...prev,
        fardosVendidos: prev.fardosVendidos + cantidad,
        fardosDisponibles: prev.fardosDisponibles - cantidad,
      }));
      setBalances((prev) => ({ ...prev, dealer: prev.dealer + cantidad }));
      addHistorial(`✅ Dealer compró ${cantidad.toLocaleString("es-AR")} TABAR`, "success");
    } else {
      if (cantidad > balances.dealer) return { ok: false, error: `Solo tenés ${balances.dealer} TABAR para vender.` };
      setCampana((prev) => ({
        ...prev,
        fardosVendidos: prev.fardosVendidos - cantidad,
        fardosDisponibles: prev.fardosDisponibles + cantidad,
      }));
      setBalances((prev) => ({ ...prev, dealer: prev.dealer - cantidad }));
      addHistorial(`✅ Dealer vendió ${cantidad.toLocaleString("es-AR")} TABAR`, "success");
    }
    return { ok: true };
  };

  const resetDemo = () => {
    setCampana(ESTADO_INICIAL.campana);
    setBalances(ESTADO_INICIAL.balances);
    setHistorial([]);
  };

  return (
    <DemoContext.Provider value={{
      campana, balances, historial,
      iniciarCampana, cerrarCampana,
      comprarIndustry, invertirState, operarDealer,
      resetDemo,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}
