'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Users, GripVertical, Calendar, Trash2, LayoutGrid, Plus } from 'lucide-react';
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
  equipo_local?: Team;
  equipo_visitante?: Team;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Sin fecha';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export default function AlineacionBuilder() {
  /* ── State ── */
  const [players, setPlayers] = useState<Player[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [savedAlignments, setSavedAlignments] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState<string | null>(null);
  
  const [selectedMatchId, setSelectedMatchId] = useState<string>('libre');
  const [formation, setFormation] = useState('4-3-3');
  const [assignments, setAssignments] = useState<Record<string, Player | null>>({});
  const [lineupName, setLineupName] = useState('');
  const [activeAlignmentId, setActiveAlignmentId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'jugadores' | 'guardadas'>('jugadores');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

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

  const selectedMatch = useMemo(
    () => partidos.find((p) => p.id === selectedMatchId) || null,
    [partidos, selectedMatchId]
  );

  /* ── Load matches ── */
  const loadPartidos = async () => {
    try {
      const { data, error } = await supabase
        .from('partidos')
        .select(`
          id,
          equipo_local_id,
          equipo_visitante_id,
          fecha,
          resultado,
          equipo_local:equipos!equipo_local_id ( id, nombre, escudo_url ),
          equipo_visitante:equipos!equipo_visitante_id ( id, nombre, escudo_url )
        `)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setPartidos((data as any) || []);
    } catch (err) {
      console.error('Error loading partidos:', err);
    }
  };

  /* ── Load saved alignments ── */
  const loadSavedAlignments = async () => {
    try {
      const { data, error } = await supabase
        .from('alineaciones')
        .select(`
          id,
          partido_id,
          sistema,
          posiciones_jugadores,
          created_at,
          partido:partidos (
            id,
            fecha,
            equipo_local:equipos!equipo_local_id ( nombre, escudo_url ),
            equipo_visitante:equipos!equipo_visitante_id ( nombre, escudo_url )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedAlignments(data || []);
    } catch (err) {
      console.error('Error loading saved alignments:', err);
    }
  };

  /* ── Load players & other initial data ── */
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

        await Promise.all([loadPartidos(), loadSavedAlignments()]);
      } catch (err) {
        console.error('Error loading players:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  /* ── Load alignment when selected match changes ── */
  const loadAlignmentForMatch = async (matchId: string) => {
    if (matchId === 'libre') {
      setActiveAlignmentId(null);
      setAssignments({});
      setLineupName('');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('alineaciones')
        .select('*')
        .eq('partido_id', matchId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setActiveAlignmentId(data.id);
        setFormation(data.sistema || '4-3-3');
        const pj = data.posiciones_jugadores as any;
        setAssignments(pj?.assignments || {});
        setLineupName(pj?.nombre_alineacion || '');
      } else {
        setActiveAlignmentId(null);
        setAssignments({});
        setLineupName('');
      }
    } catch (err) {
      console.error('Error loading alignment for match:', err);
    }
  };

  useEffect(() => {
    loadAlignmentForMatch(selectedMatchId);
    setSelectedPlayerId(null); // Clear active selection on match change
  }, [selectedMatchId]);

  /* ── Reset assignments when formation changes ── */
  const handleFormationChange = (name: string) => {
    setFormation(name);
    setAssignments({});
  };

  /* ── Drag & Drop & Click-to-Place handlers ── */
  const handleDragStart = (e: React.DragEvent, player: Player) => {
    setSelectedPlayerId(null); // Clear selection if user decides to drag
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

  const handlePlayerCardClick = (player: Player) => {
    if (placedPlayerIds.has(player.id)) return;
    
    // Toggle card selection
    if (selectedPlayerId === player.id) {
      setSelectedPlayerId(null);
    } else {
      setSelectedPlayerId(player.id);
    }
  };

  const handleSlotClick = (slotId: string) => {
    if (selectedPlayerId) {
      handleDropPlayer(slotId, selectedPlayerId);
      setSelectedPlayerId(null);
    } else if (assignments[slotId]) {
      handleRemovePlayer(slotId);
    }
  };

  const handleSelectSaved = (al: any) => {
    setActiveAlignmentId(al.id);
    setFormation(al.sistema || '4-3-3');
    const pj = al.posiciones_jugadores as any;
    setAssignments(pj?.assignments || {});
    setLineupName(pj?.nombre_alineacion || '');
    if (al.partido_id) {
      setSelectedMatchId(al.partido_id);
    } else {
      setSelectedMatchId('libre');
    }
    setActiveTab('jugadores'); // Switch back to see active players
  };

  const handleDeleteSaved = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que quieres eliminar esta alineación?')) return;
    
    try {
      const { error } = await supabase
        .from('alineaciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      if (activeAlignmentId === id) {
        setActiveAlignmentId(null);
        setAssignments({});
        setLineupName('');
      }
      
      await loadSavedAlignments();
    } catch (err) {
      console.error('Error deleting alignment:', err);
      alert('Error al eliminar la alineación.');
    }
  };

  /* ── Save to Supabase ── */
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const defaultName = selectedMatch
        ? `${selectedMatch.equipo_local?.nombre || 'Local'} vs ${selectedMatch.equipo_visitante?.nombre || 'Visitante'}`
        : `Alineación ${formation}`;
      const label = lineupName.trim() || defaultName;

      const payload = {
        partido_id: selectedMatchId === 'libre' ? null : selectedMatchId,
        sistema: formation,
        posiciones_jugadores: {
          nombre_alineacion: label,
          assignments: assignments,
        },
      };

      let resultError;
      if (activeAlignmentId) {
        const { error } = await supabase
          .from('alineaciones')
          .update(payload)
          .eq('id', activeAlignmentId);
        resultError = error;
      } else {
        const { data, error } = await supabase
          .from('alineaciones')
          .insert([payload])
          .select();
        resultError = error;
        if (data && data[0]) {
          setActiveAlignmentId(data[0].id);
        }
      }

      if (resultError) throw resultError;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      await loadSavedAlignments();
    } catch (err) {
      console.error('Error saving lineup:', err);
      alert('Error al guardar la alineación en Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  const assignedCount = Object.values(assignments).filter(Boolean).length;
  const canSave = assignedCount > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Planificación
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Módulo de Alineación
          </h1>
        </div>

        {/* Configurations Header Panel */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Match selector dropdown */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wide">
              Vincular a Enfrentamiento
            </span>
            <div className="relative inline-flex items-center">
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="
                  appearance-none bg-card-bg border border-card-border text-slate-900 dark:text-slate-100 
                  rounded-xl pl-4 pr-10 py-2.5 text-xs md:text-sm font-bold focus:outline-none focus:ring-2 
                  focus:ring-brand-purple/40 w-60 transition-all cursor-pointer shadow-xs
                "
              >
                <option value="libre">Alineación Libre (General)</option>
                {partidos.map((match) => {
                  const local = match.equipo_local?.nombre || 'Local';
                  const visitor = match.equipo_visitante?.nombre || 'Visitante';
                  return (
                    <option key={match.id} value={match.id}>
                      {local} vs {visitor} ({formatDate(match.fecha)})
                    </option>
                  );
                })}
              </select>
              <Calendar className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Lineup Name Input */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wide">
              Nombre de la Alineación
            </span>
            <input
              type="text"
              placeholder={
                selectedMatch
                  ? `${selectedMatch.equipo_local?.nombre} vs ${selectedMatch.equipo_visitante?.nombre}`
                  : "Introduce un nombre..."
              }
              value={lineupName}
              onChange={(e) => setLineupName(e.target.value)}
              className="
                bg-card-bg border border-card-border text-slate-900 dark:text-slate-100 
                rounded-xl px-4 py-2.5 text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 
                focus:ring-brand-purple/40 w-52 md:w-56 transition-all shadow-xs
              "
            />
          </div>
        </div>
      </div>

      {/* ── Main Layout: Sidebar + Pitch ── */}
      <div className="flex flex-col lg:flex-row gap-6 min-h-[580px]">
        {/* ── Sidebar: Player list / Saved lineups ── */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col bg-card-bg border border-card-border rounded-3xl overflow-hidden transition-colors duration-300 order-2 lg:order-1 shadow-xs">
          
          {/* Tab switcher */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10">
            <button
              onClick={() => setActiveTab('jugadores')}
              className={`flex-1 py-3.5 text-xs font-extrabold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                activeTab === 'jugadores'
                  ? 'border-brand-purple text-slate-950 dark:text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
              }`}
            >
              Jugadores
            </button>
            <button
              onClick={() => setActiveTab('guardadas')}
              className={`flex-1 py-3.5 text-xs font-extrabold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                activeTab === 'guardadas'
                  ? 'border-brand-purple text-slate-950 dark:text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
              }`}
            >
              Guardadas
            </button>
          </div>

          {/* TAB 1: JUGADORES */}
          {activeTab === 'jugadores' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/5">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-brand-purple" />
                  <h2 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Convocados
                  </h2>
                  <span className="ml-auto text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-2.5 py-0.5 rounded-full">
                    {assignedCount}/11
                  </span>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar jugador..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-9.5 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/40 transition-all shadow-inner"
                  />
                </div>

                {/* Position filters */}
                <div className="flex flex-wrap gap-1.5 mt-3.5">
                  {[null, 'Portero', 'Defensa', 'Centrocampista', 'Delantero'].map((pos) => (
                    <button
                      key={pos || 'all'}
                      onClick={() => setFilterPos(pos)}
                      className={`
                        px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all duration-200 cursor-pointer select-none
                        ${filterPos === pos
                          ? 'bg-brand-purple text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-450 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }
                      `}
                    >
                      {pos || 'Todos'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 max-h-[420px] lg:max-h-none">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/40 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredPlayers.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {filteredPlayers.map((player) => (
                      <motion.div
                        key={player.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        <PlayerCard
                          player={player}
                          isPlaced={placedPlayerIds.has(player.id)}
                          isSelected={selectedPlayerId === player.id}
                          onClick={() => handlePlayerCardClick(player)}
                          onDragStart={handleDragStart}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Users className="w-8 h-8 text-slate-350 dark:text-slate-700 mb-2.5 animate-pulse-slow" />
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                      Ningún jugador coincide
                    </p>
                  </div>
                )}
              </div>

              {/* Action hint banner */}
              <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-3.5 h-3.5 text-violet-400" />
                  <span>Escritorio: Arrastra un jugador al campo.</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-violet-400" />
                  <span>Móvil: Selecciona un jugador y toca un slot vacío.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALINEACIONES GUARDADAS */}
          {activeTab === 'guardadas' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[420px] lg:max-h-none">
              {savedAlignments.length > 0 ? (
                savedAlignments.map((al) => {
                  const label = al.posiciones_jugadores?.nombre_alineacion || `Alineación ${al.sistema}`;
                  const isMatch = !!al.partido_id;
                  const matchName = isMatch && al.partido
                    ? `${al.partido.equipo_local?.nombre || 'Local'} vs ${al.partido.equipo_visitante?.nombre || 'Visitante'}`
                    : null;
                  
                  return (
                    <div
                      key={al.id}
                      onClick={() => handleSelectSaved(al)}
                      className={`
                        group flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden
                        ${activeAlignmentId === al.id
                          ? 'border-brand-purple bg-brand-purple/5 ring-1 ring-brand-purple/20'
                          : 'border-slate-150 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/10 hover:border-violet-500/30 dark:hover:border-violet-400/30 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                        }
                      `}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate leading-tight group-hover:text-slate-950 dark:group-hover:text-white">
                          {label}
                        </p>
                        {isMatch && matchName && (
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                            Partido: {matchName}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-350">
                            Táctica: {al.sistema}
                          </span>
                          <span className={`
                            text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded border
                            ${isMatch 
                              ? 'bg-rose-50 dark:bg-rose-955/20 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
                              : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400'
                            }
                          `}>
                            {isMatch ? 'Enfrentamiento' : 'Libre'}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => handleDeleteSaved(e, al.id)}
                        className="
                          opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-450 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 
                          transition-all cursor-pointer shrink-0 z-20 self-center
                        "
                        title="Eliminar alineación"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <LayoutGrid className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2.5 animate-pulse-slow" />
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    Sin registros guardados
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Football Pitch ── */}
        <div className="flex-1 order-1 lg:order-2 relative min-h-[520px] lg:min-h-0">
          <FootballPitch
            formation={formation}
            slots={currentFormation.slots}
            assignments={assignments}
            onFormationChange={handleFormationChange}
            onDropPlayer={handleDropPlayer}
            onRemovePlayer={handleRemovePlayer}
            onClickSlot={handleSlotClick}
            // Save buttons
            onSave={handleSave}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
            canSave={canSave}
          />
        </div>
      </div>
    </div>
  );
}
