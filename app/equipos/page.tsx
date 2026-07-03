'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Shield, 
  Search, 
  Edit2, 
  Trash2, 
  Upload, 
  Loader2, 
  X, 
  RefreshCw,
  Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Team {
  id: string;
  nombre: string;
  escudo_url: string | null;
  created_at?: string;
}

const MOCK_TEAMS: Omit<Team, 'id' | 'created_at'>[] = [
  { nombre: 'ARSENAL', escudo_url: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=200&h=200&fit=crop&q=80' },
  { nombre: 'ATHLETIC', escudo_url: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=200&h=200&fit=crop&q=80' },
  { nombre: 'CHELSEA', escudo_url: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=200&h=200&fit=crop&q=80' },
  { nombre: 'ESPANYOL', escudo_url: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=200&h=200&fit=crop&q=80' },
  { nombre: 'LIVERPOOL', escudo_url: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=200&h=200&fit=crop&q=80' },
  { nombre: 'MALLORCA', escudo_url: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=200&h=200&fit=crop&q=80' },
];

export default function EquiposPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // View Details Modal States
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Form states
  const [nombre, setNombre] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch teams from Supabase
  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipos')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error al cargar equipos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  // Seed default teams
  const handleSeedTeams = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('equipos')
        .insert(MOCK_TEAMS);

      if (error) throw error;
      await loadTeams();
    } catch (error) {
      console.error('Error al cargar equipos predeterminados:', error);
      alert('Error al inicializar equipos.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open form for adding
  const openAddForm = () => {
    setEditingTeam(null);
    setNombre('');
    setImageFile(null);
    setImagePreview(null);
    setIsFormOpen(true);
  };

  // Open form for editing
  const openEditForm = (team: Team) => {
    setEditingTeam(team);
    setNombre(team.nombre);
    setImageFile(null);
    setImagePreview(team.escudo_url);
    setIsFormOpen(true);
  };

  // Open details modal
  const openDetailsModal = (team: Team) => {
    setSelectedTeam(team);
    setIsDetailsOpen(true);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Supabase Bucket "FOTOS ESCUDOS"
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('FOTOS ESCUDOS')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('FOTOS ESCUDOS')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Save / Submit Team
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setIsSaving(true);
    try {
      let finalEscudoUrl = editingTeam?.escudo_url || null;

      // Upload if a new file was chosen
      if (imageFile) {
        finalEscudoUrl = await uploadImage(imageFile);
      }

      const teamData = {
        nombre: nombre.toUpperCase().trim(),
        escudo_url: finalEscudoUrl
      };

      if (editingTeam) {
        // Update
        const { error } = await supabase
          .from('equipos')
          .update(teamData)
          .eq('id', editingTeam.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('equipos')
          .insert([teamData]);

        if (error) throw error;
      }

      setIsFormOpen(false);
      await loadTeams();
    } catch (error: unknown) {
      console.error('Error al guardar equipo:', error);
      const err = error as { statusCode?: string; message?: string; __isStorageError?: boolean };
      const isStorageError = err.statusCode === '403' || err.message?.includes('policy') || err.message?.includes('RLS') || err.__isStorageError;
      if (isStorageError) {
        alert('Error al subir el escudo: Falta configurar la política de seguridad (RLS) para permitir subidas públicas en el bucket "FOTOS ESCUDOS" en Supabase.');
      } else {
        alert('Error al guardar el equipo en base de datos.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete team
  const handleDeleteTeam = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este equipo? Se eliminarán también todos los partidos e informes asociados a él.')) return;
    try {
      // 1. Find all matches where the team participates
      const { data: matches, error: matchesError } = await supabase
        .from('partidos')
        .select('id')
        .or(`equipo_local_id.eq.${id},equipo_visitante_id.eq.${id}`);

      if (matchesError) throw matchesError;

      if (matches && matches.length > 0) {
        const matchIds = matches.map(m => m.id);

        // 2. Delete all dependencies for these matches
        for (const matchId of matchIds) {
          await supabase.from('plan_partido').delete().eq('partido_id', matchId);
          await supabase.from('informes_rival').delete().eq('partido_id', matchId);
          await supabase.from('eventos_partido').delete().eq('partido_id', matchId);
          await supabase.from('alineaciones').delete().eq('partido_id', matchId);
          await supabase.from('abp').delete().eq('partido_id', matchId);
        }

        // 3. Delete matches themselves
        const { error: deleteMatchesError } = await supabase
          .from('partidos')
          .delete()
          .in('id', matchIds);

        if (deleteMatchesError) throw deleteMatchesError;
      }

      // 4. Delete the team
      const { error: deleteTeamError } = await supabase
        .from('equipos')
        .delete()
        .eq('id', id);

      if (deleteTeamError) throw deleteTeamError;
      setTeams(teams.filter(t => t.id !== id));
      
      // If deleted team was open in details, close it
      if (selectedTeam?.id === id) {
        setIsDetailsOpen(false);
      }
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      alert('No se pudo eliminar el equipo.');
    }
  };

  const filteredTeams = teams.filter(t => t.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Gestión
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Equipos
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Seed button if empty */}
          {teams.length === 0 && !isLoading && (
            <button
              onClick={handleSeedTeams}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-5 py-3 rounded-2xl shadow-sm transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Cargar Equipos Demo
            </button>
          )}

          {/* Open form button */}
          <button
            onClick={openAddForm}
            className="flex items-center justify-center gap-2 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold px-5 py-3 rounded-2xl shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-sm select-none"
          >
            <Plus className="w-4 h-4" />
            Dar de Alta Equipo
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card-bg border border-card-border p-4 rounded-3xl shadow-xs transition-colors duration-300">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar equipo por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple transition-all"
          />
        </div>
      </div>

      {/* Teams Grid / List */}
      {isLoading ? (
        /* Skeletons */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card-bg border border-card-border rounded-3xl overflow-hidden flex flex-col h-[360px] animate-pulse">
              <div className="h-56 bg-slate-200 dark:bg-slate-800" />
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md mx-auto mt-2" />
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredTeams.length > 0 ? (
        /* Actual Grid */
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredTeams.map((team) => (
              <motion.div 
                key={team.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="bg-card-bg border border-card-border rounded-3xl overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 relative"
              >
                {/* Shield Badge Container */}
                <div className="h-56 bg-slate-50 dark:bg-slate-900/40 overflow-hidden relative flex items-center justify-center p-6 border-b border-slate-100 dark:border-slate-800/40">
                  {team.escudo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={team.escudo_url} 
                      alt={team.nombre}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 bg-slate-50 dark:bg-slate-900">
                      <Shield className="w-20 h-20 stroke-[1.2px]" />
                      <span className="text-xs font-semibold text-slate-400 mt-2">Sin escudo</span>
                    </div>
                  )}
                </div>

                {/* Delete Button top-right */}
                <button
                  onClick={() => handleDeleteTeam(team.id)}
                  className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-xs transition-colors duration-200 cursor-pointer shadow-xs"
                  title="Eliminar equipo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Team Info details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="text-center py-2">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-brand-purple transition-colors line-clamp-1 uppercase tracking-wide">
                      {team.nombre}
                    </h2>
                  </div>

                  <div className="mt-5">
                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => openDetailsModal(team)}
                        className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200/40 dark:border-slate-800"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </button>
                      <button 
                        onClick={() => openEditForm(team)}
                        className="flex items-center justify-center gap-1.5 bg-brand-purple-light dark:bg-brand-purple/20 hover:bg-brand-purple/20 text-brand-purple dark:text-violet-300 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-card-bg border border-card-border rounded-3xl text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900/60 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            No se encontraron equipos
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mt-1 px-4">
            {search 
              ? 'Prueba a cambiar tu búsqueda.' 
              : 'Puedes dar de alta equipos individualmente o cargar los equipos de demostración predeterminados.'
            }
          </p>
          {!teams.length && (
            <button
              onClick={handleSeedTeams}
              className="mt-6 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold px-5 py-3 rounded-xl text-xs transition-all cursor-pointer"
            >
              Cargar equipos de ejemplo
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Sliding Modal (AnimatePresence) */}
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

            {/* Slide-over panel */}
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
                    {editingTeam ? 'Editar Equipo' : 'Añadir Equipo'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {editingTeam ? 'Modifica los datos del equipo seleccionado.' : 'Registra un nuevo equipo en Supabase.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Crest Upload Container */}
                <div className="flex flex-col items-center gap-3 bg-card-bg border border-card-border p-5 rounded-2xl">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider self-start">Escudo del Equipo</label>
                  
                  <div className="relative group w-32 h-32 rounded-3xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-3 shrink-0">
                    {imagePreview ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={imagePreview} 
                        alt="Preview Escudo" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Shield className="w-12 h-12 text-slate-400 stroke-[1.2px]" />
                    )}
                    
                    {/* Hover Upload Overlay */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200 cursor-pointer"
                    >
                      <Upload className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-bold">Subir Escudo</span>
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <p className="text-[10px] text-slate-400 font-semibold">Subida directa al bucket FOTOS ESCUDOS</p>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre del Equipo</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ej: REAL MADRID"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      className="w-full bg-card-bg border border-card-border text-slate-900 dark:text-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 uppercase"
                    />
                  </div>
                </div>

                {/* Hidden submit trigger button */}
                <button type="submit" className="hidden" id="modal-submit-btn" />
              </form>

              {/* Actions Footer */}
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
                  onClick={() => document.getElementById('modal-submit-btn')?.click()}
                  className="flex-1 py-3 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold rounded-xl text-sm cursor-pointer disabled:cursor-not-allowed disabled:bg-brand-purple/40 transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details Modal (AnimatePresence) */}
      <AnimatePresence>
        {isDetailsOpen && selectedTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full max-w-md bg-card-bg border border-card-border rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 tracking-wide">
                  Detalles del Club
                </h3>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col items-center gap-6">
                {/* Big Crest Badge */}
                <div className="w-36 h-36 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-center p-4 shadow-xs">
                  {selectedTeam.escudo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={selectedTeam.escudo_url} 
                      alt={selectedTeam.nombre}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Shield className="w-16 h-16 text-brand-purple stroke-[1.2px]" />
                  )}
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    {selectedTeam.nombre}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full mt-2 border border-emerald-200/55 dark:border-emerald-900/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Estado: Activo
                  </span>
                </div>

                {/* Simulated stats */}
                <div className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 mt-2 space-y-3">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-400">Entrenador:</span>
                    <span className="text-slate-700 dark:text-slate-300">Por definir</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-400">Partidos Jugados:</span>
                    <span className="text-slate-700 dark:text-slate-300">0</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-400">Goles a Favor:</span>
                    <span className="text-slate-700 dark:text-slate-300">0</span>
                  </div>
                  {selectedTeam.created_at && (
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-slate-400">Fecha Registro:</span>
                      <span className="text-slate-500 text-xs">
                        {new Date(selectedTeam.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-900 flex gap-2">
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-all cursor-pointer text-center"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    openEditForm(selectedTeam);
                  }}
                  className="flex-1 py-3 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold rounded-xl text-sm transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
