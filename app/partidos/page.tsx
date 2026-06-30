'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Shield,
  Search,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  X,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

/* ───── Types ───── */
interface Team {
  id: string;
  nombre: string;
  escudo_url: string | null;
}

interface Partido {
  id: string;
  equipo_local_id: string;
  equipo_visitante_id: string;
  fecha: string | null;
  resultado: string | null;
  created_at: string;
  // joined data
  equipo_local?: Team;
  equipo_visitante?: Team;
}

/* ───── Helpers ───── */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Sin fecha';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return '';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/* ════════════════════════════════════════════════════════════ */
export default function PartidosPage() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [localId, setLocalId] = useState('');
  const [visitanteId, setVisitanteId] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  /* ───── Load data ───── */
  const loadPartidos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('partidos')
        .select(`
          *,
          equipo_local:equipos!equipo_local_id ( id, nombre, escudo_url ),
          equipo_visitante:equipos!equipo_visitante_id ( id, nombre, escudo_url )
        `)
        .order('fecha', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setPartidos((data as Partido[]) || []);
    } catch (err) {
      console.error('Error cargando partidos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('equipos')
        .select('id, nombre, escudo_url')
        .order('nombre');
      if (error) throw error;
      setTeams(data || []);
    } catch (err) {
      console.error('Error cargando equipos:', err);
    }
  };

  useEffect(() => {
    loadPartidos();
    loadTeams();
  }, []);

  /* ───── Create ───── */
  const openAddForm = () => {
    setLocalId('');
    setVisitanteId('');
    setFecha('');
    setHora('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localId || !visitanteId) return;

    setIsSaving(true);
    try {
      // Combine date + time into ISO string
      let fechaFinal: string | null = null;
      if (fecha) {
        fechaFinal = hora ? `${fecha}T${hora}:00` : `${fecha}T00:00:00`;
      }

      const { error } = await supabase.from('partidos').insert([
        {
          equipo_local_id: localId,
          equipo_visitante_id: visitanteId,
          fecha: fechaFinal,
        },
      ]);
      if (error) throw error;
      setIsFormOpen(false);
      await loadPartidos();
    } catch (err) {
      console.error('Error creando partido:', err);
      alert('Error al crear el partido.');
    } finally {
      setIsSaving(false);
    }
  };

  /* ───── Delete ───── */
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este partido?')) return;
    try {
      // Delete dependent rows first
      await supabase.from('plan_partido').delete().eq('partido_id', id);
      await supabase.from('informes_rival').delete().eq('partido_id', id);
      const { error } = await supabase.from('partidos').delete().eq('id', id);
      if (error) throw error;
      setPartidos(partidos.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error eliminando partido:', err);
      alert('No se pudo eliminar el partido.');
    }
  };

  /* ───── Filter ───── */
  const filteredPartidos = partidos.filter((p) => {
    const q = search.toLowerCase();
    const localName = p.equipo_local?.nombre?.toLowerCase() || '';
    const awayName = p.equipo_visitante?.nombre?.toLowerCase() || '';
    return localName.includes(q) || awayName.includes(q);
  });

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div className="flex flex-col gap-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Competición
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Partidos ({partidos.length})
          </h1>
        </div>

        <button
          onClick={openAddForm}
          className="flex items-center justify-center gap-2 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold px-5 py-3 rounded-2xl shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-sm select-none"
        >
          <Plus className="w-4 h-4" />
          Crear Partido
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card-bg border border-card-border p-4 rounded-3xl shadow-xs transition-colors duration-300">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre de equipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-card-bg border border-card-border rounded-3xl h-52 animate-pulse flex flex-col justify-between p-6"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="w-20 h-4 rounded-md bg-slate-200 dark:bg-slate-800" />
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-4 w-2/3 rounded-md bg-slate-200 dark:bg-slate-800 mx-auto" />
              <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : filteredPartidos.length > 0 ? (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredPartidos.map((partido) => (
              <motion.div
                key={partido.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="bg-card-bg border border-card-border rounded-3xl overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 relative"
              >
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(partido.id)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-xs transition-colors duration-200 cursor-pointer shadow-xs opacity-0 group-hover:opacity-100"
                  title="Eliminar partido"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Matchup: Shields + Names */}
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-center gap-4">
                    {/* Local */}
                    <div className="flex flex-col items-center gap-2 w-28 shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-center p-2 group-hover:scale-105 transition-transform duration-300">
                        {partido.equipo_local?.escudo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={partido.equipo_local.escudo_url}
                            alt={partido.equipo_local.nombre}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <Shield className="w-7 h-7 text-brand-purple stroke-[1.5px]" />
                        )}
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 text-center line-clamp-1 uppercase tracking-wide">
                        {partido.equipo_local?.nombre || 'Local'}
                      </span>
                    </div>

                    {/* VS */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg font-black text-slate-300 dark:text-slate-700 tracking-widest select-none">
                        VS
                      </span>
                    </div>

                    {/* Visitante */}
                    <div className="flex flex-col items-center gap-2 w-28 shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-center p-2 group-hover:scale-105 transition-transform duration-300">
                        {partido.equipo_visitante?.escudo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={partido.equipo_visitante.escudo_url}
                            alt={partido.equipo_visitante.nombre}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <Shield className="w-7 h-7 text-brand-purple stroke-[1.5px]" />
                        )}
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 text-center line-clamp-1 uppercase tracking-wide">
                        {partido.equipo_visitante?.nombre || 'Visitante'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date / Time */}
                <div className="px-6 pb-3">
                  <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(partido.fecha)}
                    </span>
                    {formatTime(partido.fecha) && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatTime(partido.fecha)}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="px-6 pb-6 mt-auto">
                  <Link
                    href={`/partidos/${partido.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-brand-purple hover:bg-brand-purple-dark text-white font-bold py-3 rounded-2xl text-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
                  >
                    Ver Análisis / Plan
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-card-bg border border-card-border rounded-3xl text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900/60 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            No se encontraron partidos
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mt-1 px-4">
            {search
              ? 'Prueba a cambiar tu búsqueda.'
              : 'Crea tu primer partido pulsando el botón "Crear Partido".'}
          </p>
        </div>
      )}

      {/* ─── Create Match Slide-Over ─── */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-900 h-full shadow-2xl flex flex-col justify-between z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-900 bg-card-bg flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Crear Partido
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Selecciona los equipos y la fecha del encuentro.
                  </p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto p-6 space-y-6"
              >
                {/* Local Team */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Equipo Local
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={localId}
                      onChange={(e) => setLocalId(e.target.value)}
                      required
                      className="w-full bg-card-bg border border-card-border text-slate-900 dark:text-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 appearance-none cursor-pointer"
                    >
                      <option value="">Seleccionar equipo local…</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Equipo Visitante
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={visitanteId}
                      onChange={(e) => setVisitanteId(e.target.value)}
                      required
                      className="w-full bg-card-bg border border-card-border text-slate-900 dark:text-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 appearance-none cursor-pointer"
                    >
                      <option value="">Seleccionar equipo visitante…</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Fecha
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="w-full bg-card-bg border border-card-border text-slate-900 dark:text-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Hora
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="time"
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                        className="w-full bg-card-bg border border-card-border text-slate-900 dark:text-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {localId && visitanteId && (
                  <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-center gap-5">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5">
                        {teams.find((t) => t.id === localId)?.escudo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={
                              teams.find((t) => t.id === localId)!.escudo_url!
                            }
                            alt=""
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <Shield className="w-5 h-5 text-brand-purple" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                        {teams.find((t) => t.id === localId)?.nombre}
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-300 dark:text-slate-700">
                      VS
                    </span>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5">
                        {teams.find((t) => t.id === visitanteId)
                          ?.escudo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={
                              teams.find((t) => t.id === visitanteId)!
                                .escudo_url!
                            }
                            alt=""
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <Shield className="w-5 h-5 text-brand-purple" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                        {teams.find((t) => t.id === visitanteId)?.nombre}
                      </span>
                    </div>
                  </div>
                )}

                {/* Hidden submit */}
                <button type="submit" className="hidden" id="partido-submit" />
              </form>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-900 bg-card-bg flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer transition-colors text-center"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    document.getElementById('partido-submit')?.click()
                  }
                  className="flex-1 py-3 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold rounded-xl text-sm cursor-pointer disabled:cursor-not-allowed disabled:bg-brand-purple/40 transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    'Crear Partido'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
