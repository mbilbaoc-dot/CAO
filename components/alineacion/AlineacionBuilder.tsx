'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Save, Loader2, CheckCircle, Users, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { FORMATIONS } from '@/lib/formations';
import FootballPitch from './FootballPitch';
import PlayerCard from './PlayerCard';

interface Player {
  id: string;
  nombre: string;
  dorsal: number | null;
  demarcacion: string | null;
  foto_url: string | null;
}

export default function AlineacionBuilder() {
  /* ── State ── */
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState<string | null>(null);
  const [formation, setFormation] = useState('4-3-3');
  const [assignments, setAssignments] = useState<Record<string, Player | null>>({});
  const [lineupName, setLineupName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /* ── Derived ── */
  const currentFormation = useMemo(
    () => FORMATIONS.find((f) => f.name === formation) || FORMATIONS[0],
    [formation]
  );

  const placedPlayerIds = useMemo(
    () => new Set(Object.values(assignments).filter(Boolean).map((p) => p!.id)),
    [assignments]
  );

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
      const matchPos = filterPos ? p.demarcacion === filterPos : true;
      return matchSearch && matchPos;
    });
  }, [players, search, filterPos]);

  /* ── Load players ── */
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('jugadores')
          .select('id, nombre, dorsal, demarcacion, foto_url')
          .order('dorsal', { ascending: true });

        if (error) throw error;
        setPlayers(data || []);
      } catch (err) {
        console.error('Error loading players:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  /* ── Reset assignments when formation changes ── */
  const handleFormationChange = (name: string) => {
    setFormation(name);
    setAssignments({});
  };

  /* ── Drag & Drop handlers ── */
  const handleDragStart = (e: React.DragEvent, player: Player) => {
    e.dataTransfer.setData('text/plain', player.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropPlayer = (slotId: string, playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    // If player is already in another slot, remove from there first
    const newAssignments = { ...assignments };
    for (const [key, val] of Object.entries(newAssignments)) {
      if (val && val.id === playerId) {
        newAssignments[key] = null;
      }
    }
    newAssignments[slotId] = player;
    setAssignments(newAssignments);
  };

  const handleRemovePlayer = (slotId: string) => {
    setAssignments((prev) => ({ ...prev, [slotId]: null }));
  };

  /* ── Save to Supabase ── */
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const jugadoresData = currentFormation.slots
        .filter((slot) => assignments[slot.id])
        .map((slot) => ({
          slot_id: slot.id,
          slot_label: slot.label,
          jugador_id: assignments[slot.id]!.id,
          jugador_nombre: assignments[slot.id]!.nombre,
          top: slot.top,
          left: slot.left,
        }));

      const payload = {
        nombre: lineupName.trim() || `Alineación ${formation}`,
        formacion: formation,
        jugadores: jugadoresData,
      };

      const { error } = await supabase.from('alineaciones').insert([payload]);

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving lineup:', err);
      alert('Error al guardar la alineación. Verifica que la tabla "alineaciones" exista en Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  const assignedCount = Object.values(assignments).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Alineación
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Constructor de Alineación
          </h1>
        </div>

        {/* Lineup name + save */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Nombre de la alineación..."
            value={lineupName}
            onChange={(e) => setLineupName(e.target.value)}
            className="bg-card-bg border border-card-border text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 w-56 transition-all"
          />
          <button
            onClick={handleSave}
            disabled={isSaving || assignedCount === 0}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer
              disabled:cursor-not-allowed disabled:opacity-40
              ${saveSuccess
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-brand-purple hover:bg-brand-purple-dark text-white shadow-md hover:-translate-y-0.5 active:translate-y-0'
              }
            `}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                ¡Guardado!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Alineación
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main Layout: Sidebar + Pitch ── */}
      <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
        {/* ── Sidebar: Player list ── */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col bg-card-bg border border-card-border rounded-3xl overflow-hidden transition-colors duration-300 order-2 lg:order-1">
          {/* Sidebar header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-brand-purple" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Jugadores Disponibles
              </h2>
              <span className="ml-auto text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full">
                {assignedCount}/11
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar jugador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/40 transition-all"
              />
            </div>

            {/* Position filter pills */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {[null, 'Portero', 'Defensa', 'Centrocampista', 'Delantero'].map((pos) => (
                <button
                  key={pos || 'all'}
                  onClick={() => setFilterPos(pos)}
                  className={`
                    px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer select-none
                    ${filterPos === pos
                      ? 'bg-brand-purple text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/40'
                    }
                  `}
                >
                  {pos || 'Todos'}
                </button>
              ))}
            </div>
          </div>

          {/* Player list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 max-h-[calc(100vh-400px)] lg:max-h-none">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredPlayers.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {filteredPlayers.map((player) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <PlayerCard
                      player={player}
                      isPlaced={placedPlayerIds.has(player.id)}
                      onDragStart={handleDragStart}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                  No se encontraron jugadores
                </p>
              </div>
            )}
          </div>

          {/* Drag hint */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
              <GripVertical className="w-3 h-3" />
              <span>Arrastra un jugador al campo para colocarlo</span>
            </div>
          </div>
        </div>

        {/* ── Football Pitch ── */}
        <div className="flex-1 order-1 lg:order-2 min-h-[500px] lg:min-h-0 relative">
          <FootballPitch
            formation={formation}
            slots={currentFormation.slots}
            assignments={assignments}
            onFormationChange={handleFormationChange}
            onDropPlayer={handleDropPlayer}
            onRemovePlayer={handleRemovePlayer}
          />
        </div>
      </div>
    </div>
  );
}
