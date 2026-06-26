/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from 'react';
import {
  suscribirseAFlechas,
  agregarFlecha,
  moverFlecha,
  eliminarFlecha,
  limpiarFlechas,
  suscribirseAAnotaciones,
  agregarAnotacion,
  moverAnotacion,
  editarAnotacion,
  eliminarAnotacion,
  limpiarAnotaciones,
} from '../services/tacticaService';

const MAX_PILA_UNDO = 20;

export const TacticaContext = createContext();

export function TacticaProvider({ children }) {
  const [flechas, setFlechas] = useState([]);
  const [anotaciones, setAnotaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pila, setPila] = useState([]);

  useEffect(() => {
    const unsubscribe = suscribirseAFlechas(
      (lista) => {
        setFlechas(lista);
        setCargando(false);
      },
      (mensaje) => {
        setError(mensaje);
        setCargando(false);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = suscribirseAAnotaciones(
      (lista) => setAnotaciones(lista),
      (mensaje) => setError(mensaje)
    );
    return unsubscribe;
  }, []);

  function pushUndo(entrada) {
    setPila((prev) => [...prev.slice(-MAX_PILA_UNDO + 1), entrada]);
  }

  async function agregar(coords) {
    try {
      const ref = await agregarFlecha(coords);
      pushUndo({ tipo: 'flecha-crear', id: ref.id });
    } catch (err) {
      setError(err.message);
    }
  }

  async function mover(id, coords) {
    const actual = flechas.find((f) => f.id === id);
    setFlechas((prev) => prev.map((f) => (f.id === id ? { ...f, ...coords } : f)));
    if (actual) pushUndo({ tipo: 'flecha-mover', id, antes: { x1: actual.x1, y1: actual.y1, x2: actual.x2, y2: actual.y2 } });
    try {
      await moverFlecha(id, coords);
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminar(id) {
    const actual = flechas.find((f) => f.id === id);
    try {
      await eliminarFlecha(id);
      if (actual) {
        pushUndo({ tipo: 'flecha-eliminar', flecha: { x1: actual.x1, y1: actual.y1, x2: actual.x2, y2: actual.y2, tipo: actual.tipo } });
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function agregarTexto(anotacion) {
    try {
      const ref = await agregarAnotacion(anotacion);
      pushUndo({ tipo: 'texto-crear', id: ref.id });
    } catch (err) {
      setError(err.message);
    }
  }

  async function moverTexto(id, coords) {
    const actual = anotaciones.find((a) => a.id === id);
    setAnotaciones((prev) => prev.map((a) => (a.id === id ? { ...a, ...coords } : a)));
    if (actual) pushUndo({ tipo: 'texto-mover', id, antes: { x: actual.x, y: actual.y } });
    try {
      await moverAnotacion(id, coords);
    } catch (err) {
      setError(err.message);
    }
  }

  async function editarTexto(id, texto) {
    const actual = anotaciones.find((a) => a.id === id);
    try {
      await editarAnotacion(id, texto);
      if (actual) pushUndo({ tipo: 'texto-editar', id, textoAntes: actual.texto });
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminarTexto(id) {
    const actual = anotaciones.find((a) => a.id === id);
    try {
      await eliminarAnotacion(id);
      if (actual) pushUndo({ tipo: 'texto-eliminar', anotacion: { x: actual.x, y: actual.y, texto: actual.texto } });
    } catch (err) {
      setError(err.message);
    }
  }

  async function limpiar() {
    const flechasAntes = flechas.map(({ x1, y1, x2, y2, tipo }) => ({ x1, y1, x2, y2, tipo }));
    const anotacionesAntes = anotaciones.map(({ x, y, texto }) => ({ x, y, texto }));
    try {
      await Promise.all([
        limpiarFlechas(flechas.map((f) => f.id)),
        limpiarAnotaciones(anotaciones.map((a) => a.id)),
      ]);
      if (flechasAntes.length > 0 || anotacionesAntes.length > 0) {
        pushUndo({ tipo: 'limpiar', flechas: flechasAntes, anotaciones: anotacionesAntes });
      }
    } catch (err) {
      setError(err.message);
    }
  }

  const deshacer = useCallback(async () => {
    if (pila.length === 0) return;
    const entrada = pila[pila.length - 1];
    setPila((prev) => prev.slice(0, -1));
    try {
      switch (entrada.tipo) {
        case 'flecha-crear':
          await eliminarFlecha(entrada.id);
          break;
        case 'flecha-mover':
          setFlechas((prev) => prev.map((f) => (f.id === entrada.id ? { ...f, ...entrada.antes } : f)));
          await moverFlecha(entrada.id, entrada.antes);
          break;
        case 'flecha-eliminar':
          await agregarFlecha(entrada.flecha);
          break;
        case 'texto-crear':
          await eliminarAnotacion(entrada.id);
          break;
        case 'texto-mover':
          setAnotaciones((prev) => prev.map((a) => (a.id === entrada.id ? { ...a, ...entrada.antes } : a)));
          await moverAnotacion(entrada.id, entrada.antes);
          break;
        case 'texto-editar':
          await editarAnotacion(entrada.id, entrada.textoAntes);
          break;
        case 'texto-eliminar':
          await agregarAnotacion(entrada.anotacion);
          break;
        case 'limpiar':
          await Promise.all([
            ...entrada.flechas.map((f) => agregarFlecha(f)),
            ...entrada.anotaciones.map((a) => agregarAnotacion(a)),
          ]);
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err.message);
    }
  }, [pila]);

  // Ctrl+Z / Cmd+Z deshace el último cambio en la pizarra (flechas y
  // anotaciones), salvo que el foco esté en un campo de texto (chat, nombre
  // de pizarra, etc.) para no pisar el undo nativo de ese campo.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key.toLowerCase() !== 'z' || !(e.ctrlKey || e.metaKey) || e.shiftKey) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      e.preventDefault();
      deshacer();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deshacer]);

  return (
    <TacticaContext.Provider
      value={{
        flechas,
        anotaciones,
        cargando,
        error,
        agregar,
        mover,
        eliminar,
        agregarTexto,
        moverTexto,
        editarTexto,
        eliminarTexto,
        limpiar,
        deshacer,
        puedeDeshacer: pila.length > 0,
      }}
    >
      {children}
    </TacticaContext.Provider>
  );
}
