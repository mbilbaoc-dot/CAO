'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Eye, 
  Edit2, 
  RefreshCw,
  User,
  Upload,
  Calendar,
  Hash,
  X,
  Loader2,
  CalendarDays
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Player {
  id: string;
  nombre: string;
  dorsal: number | null;
  demarcacion: string | null; // Portero, Defensa, Centrocampista, Delantero
  fecha_nacimiento: string | null;
  foto_url: string | null;
  created_at?: string;
}

const DEMARCACIONES = ['Portero', 'Defensa', 'Centrocampista', 'Delantero'] as const;

const MOCK_ATHLETIC: Omit<Player, 'id' | 'created_at'>[] = [
  { nombre: 'Unai Simón', dorsal: 1, demarcacion: 'Portero', fecha_nacimiento: '1997-06-11', foto_url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Julen Agirrezabala', dorsal: 13, demarcacion: 'Portero', fecha_nacimiento: '2000-12-26', foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Alex Padilla', dorsal: 26, demarcacion: 'Portero', fecha_nacimiento: '2003-09-01', foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Dani Vivian', dorsal: 3, demarcacion: 'Defensa', fecha_nacimiento: '1999-07-05', foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Aitor Paredes', dorsal: 4, demarcacion: 'Defensa', fecha_nacimiento: '2000-04-29', foto_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Yeray Álvarez', dorsal: 5, demarcacion: 'Defensa', fecha_nacimiento: '1995-01-24', foto_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Yuri Berchiche', dorsal: 17, demarcacion: 'Defensa', fecha_nacimiento: '1990-02-10', foto_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Óscar de Marcos', dorsal: 18, demarcacion: 'Defensa', fecha_nacimiento: '1989-04-14', foto_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Adama Boiro', dorsal: 31, demarcacion: 'Defensa', fecha_nacimiento: '2002-06-22', foto_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Andoni Gorosabel', dorsal: 2, demarcacion: 'Defensa', fecha_nacimiento: '1996-08-04', foto_url: 'https://images.unsplash.com/photo-1542178243-fc20202b7082?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Oihan Sancet', dorsal: 8, demarcacion: 'Centrocampista', fecha_nacimiento: '2000-04-25', foto_url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Ruiz de Galarreta', dorsal: 16, demarcacion: 'Centrocampista', fecha_nacimiento: '1993-08-06', foto_url: 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Beñat Prados', dorsal: 24, demarcacion: 'Centrocampista', fecha_nacimiento: '2001-02-08', foto_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Mikel Vesga', dorsal: 6, demarcacion: 'Centrocampista', fecha_nacimiento: '1993-04-08', foto_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Nico Williams', dorsal: 11, demarcacion: 'Delantero', fecha_nacimiento: '2002-07-12', foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Iñaki Williams', dorsal: 9, demarcacion: 'Delantero', fecha_nacimiento: '1994-06-15', foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Gorka Guruzeta', dorsal: 12, demarcacion: 'Delantero', fecha_nacimiento: '1996-09-12', foto_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&q=80' },
  { nombre: 'Alex Berenguer', dorsal: 7, demarcacion: 'Delantero', fecha_nacimiento: '1995-07-04', foto_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=400&fit=crop&q=80' }
];

export default function PlantillaPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [filterPosition, setFilterPosition] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [dorsal, setDorsal] = useState<string>('');
  const [demarcacion, setDemarcacion] = useState<typeof DEMARCACIONES[number] | ''>('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch players from Supabase
  const loadPlayers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('jugadores')
        .select('*')
        .order('dorsal', { ascending: true });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error al cargar jugadores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  // Calculate age from birthdate
  const getAge = (birthDateStr: string | null): number => {
    if (!birthDateStr) return 0;
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Seed DB with Athletic players if empty
  const handleSeedAthletic = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('jugadores')
        .insert(MOCK_ATHLETIC);

      if (error) throw error;
      await loadPlayers();
    } catch (error) {
      console.error('Error al cargar plantilla:', error);
      alert('Error al cargar plantilla predeterminada.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete player
  const handleDeletePlayer = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este jugador?')) return;
    try {
      const { error } = await supabase
        .from('jugadores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPlayers(players.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error al eliminar jugador:', error);
      alert('No se pudo eliminar el jugador.');
    }
  };

  // Open Form for Add
  const openAddForm = () => {
    setEditingPlayer(null);
    setNombre('');
    setDorsal('');
    setDemarcacion('');
    setFechaNacimiento('');
    setImageFile(null);
    setImagePreview(null);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const openEditForm = (player: Player) => {
    setEditingPlayer(player);
    setNombre(player.nombre);
    setDorsal(player.dorsal?.toString() || '');
    setDemarcacion(player.demarcacion as any || '');
    setFechaNacimiento(player.fecha_nacimiento || '');
    setImageFile(null);
    setImagePreview(player.foto_url);
    setIsFormOpen(true);
  };

  // File selection change
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

  // Upload image to Supabase Bucket "FOTOS JUGADORES"
  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('FOTOS JUGADORES')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('FOTOS JUGADORES')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Form Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setIsSaving(true);
    try {
      let finalFotoUrl = editingPlayer?.foto_url || null;

      // Upload image if selected
      if (imageFile) {
        finalFotoUrl = await uploadImage(imageFile);
      }

      const playerData = {
        nombre,
        dorsal: dorsal ? parseInt(dorsal, 10) : null,
        demarcacion: demarcacion || null,
        fecha_nacimiento: fechaNacimiento || null,
        foto_url: finalFotoUrl
      };

      if (editingPlayer) {
        // Edit existing
        const { error } = await supabase
          .from('jugadores')
          .update(playerData)
          .eq('id', editingPlayer.id);

        if (error) throw error;
      } else {
        // Add new
        const { error } = await supabase
          .from('jugadores')
          .insert([playerData]);

        if (error) throw error;
      }

      setIsFormOpen(false);
      await loadPlayers();
    } catch (error: unknown) {
      console.error('Error al guardar jugador:', error);
      const err = error as { statusCode?: string; message?: string; __isStorageError?: boolean };
      const isStorageError = err.statusCode === '403' || err.message?.includes('policy') || err.message?.includes('RLS') || err.__isStorageError;
      if (isStorageError) {
        alert('Error al subir la imagen: Falta configurar la política de seguridad (RLS) para permitir subidas públicas en el bucket "FOTOS JUGADORES" en Supabase.');
      } else {
        alert('Error al guardar jugador en base de datos.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
    const matchesPosition = filterPosition ? p.demarcacion === filterPosition : true;
    return matchesSearch && matchesPosition;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Plantilla
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Jugadores
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Seeding helper button when list is empty */}
          {players.length === 0 && !isLoading && (
            <button
              onClick={handleSeedAthletic}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-5 py-3 rounded-2xl shadow-sm transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Cargar Ejemplo (Athletic)
            </button>
          )}

          {/* Add button */}
          <button
            onClick={openAddForm}
            className="flex items-center justify-center gap-2 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold px-5 py-3 rounded-2xl shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-sm select-none"
          >
            <Plus className="w-4 h-4" />
            Añadir Jugador
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card-bg border border-card-border p-4 rounded-3xl shadow-xs transition-colors duration-300">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple transition-all"
          />
        </div>

        {/* Position filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterPosition(null)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
              filterPosition === null 
                ? 'bg-brand-purple text-white shadow-sm' 
                : 'bg-slate-100 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/40'
            }`}
          >
            Todos
          </button>
          {DEMARCACIONES.map((pos) => {
            const isActive = filterPosition === pos;
            return (
              <button
                key={pos}
                onClick={() => setFilterPosition(pos)}
                className={`
                  px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none
                  ${isActive 
                    ? 'bg-brand-purple text-white shadow-sm' 
                    : 'bg-slate-100 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/40'
                  }
                `}
              >
                {pos}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card-bg border border-card-border rounded-3xl overflow-hidden flex flex-col h-[400px] animate-pulse">
              <div className="h-56 bg-slate-200 dark:bg-slate-800" />
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
                <div className="space-y-4">
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPlayers.length > 0 ? (
        /* Responsive Grid of players */
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredPlayers.map((player) => (
              <motion.div 
                key={player.id} 
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="bg-card-bg border border-card-border rounded-3xl overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 relative"
              >
                {/* Player Image */}
                <div className="h-56 bg-slate-100 dark:bg-slate-900/60 overflow-hidden relative">
                   {player.foto_url ? (
                     /* eslint-disable-next-line @next/next/no-img-element */
                     <img 
                       src={player.foto_url} 
                       alt={player.nombre}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                     />
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 bg-slate-50 dark:bg-slate-900">
                       <User className="w-20 h-20 stroke-[1.2px]" />
                       <span className="text-xs font-semibold text-slate-400 mt-2">Sin foto</span>
                     </div>
                   )}
                   
                   {/* Dorsal overlay */}
                   {player.dorsal !== null && (
                     <span className="absolute bottom-3 left-3 bg-slate-900/75 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg backdrop-blur-xs">
                       #{player.dorsal} {player.demarcacion}
                     </span>
                   )}
                </div>

                {/* Delete Button top-right */}
                <button
                  onClick={() => handleDeletePlayer(player.id)}
                  className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-xs transition-colors duration-200 cursor-pointer shadow-xs"
                  title="Eliminar jugador"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Player Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-purple transition-colors line-clamp-1">
                      {player.nombre}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                      <span>{player.demarcacion || 'Sin posición'}</span>
                      {player.fecha_nacimiento && (
                        <>
                          <span>•</span>
                          <span>Edad: {getAge(player.fecha_nacimiento)} años</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-5">
                    {/* Simulated Stats for layout completeness */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-xs font-semibold border-t border-slate-100 dark:border-slate-800 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Forma:</span>
                        <span className="text-emerald-500 font-bold">100%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Goles:</span>
                        <span className="text-slate-700 dark:text-slate-300">0</span>
                      </div>
                    </div>

                    {/* Actions buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => openEditForm(player)}
                        className="col-span-2 flex items-center justify-center gap-1.5 bg-brand-purple-light dark:bg-brand-purple/20 hover:bg-brand-purple/20 text-brand-purple dark:text-violet-300 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar Jugador
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 bg-card-bg border border-card-border rounded-3xl text-center transition-colors duration-300">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900/60 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            No se encontraron jugadores
          </h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mt-1 px-4">
            {search || filterPosition 
              ? 'Prueba a ajustar tus filtros o tu búsqueda para encontrar jugadores.' 
              : 'Puedes añadir jugadores individualmente o cargar la plantilla por defecto del Athletic Club.'
            }
          </p>
          {!players.length && (
            <button
              onClick={handleSeedAthletic}
              className="mt-6 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold px-5 py-3 rounded-xl text-xs transition-all cursor-pointer"
            >
              Cargar plantilla de ejemplo
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
              <div className="p-6 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between bg-card-bg">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {editingPlayer ? 'Editar Jugador' : 'Añadir Jugador'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {editingPlayer ? 'Modifica los datos del jugador seleccionado.' : 'Registra un nuevo jugador en la plantilla.'}
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
                {/* Photo Upload Container */}
                <div className="flex flex-col items-center gap-3 bg-card-bg border border-card-border p-5 rounded-2xl">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider self-start">Foto del jugador</label>
                  
                  <div className="relative group w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                    {imagePreview ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-slate-400" />
                    )}
                    
                    {/* Hover Upload Overlay */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200 cursor-pointer"
                    >
                      <Upload className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-bold">Subir foto</span>
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <p className="text-[10px] text-slate-400 font-semibold">Subida directa al bucket FOTOS JUGADORES</p>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ej: Nico Williams"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      className="w-full bg-card-bg border border-card-border text-slate-900 dark:text-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                    />
                  </div>
                </div>

                {/* Dorsal */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dorsal</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      placeholder="Ej: 10"
                      min="1"
                      max="99"
                      value={dorsal}
                      onChange={(e) => setDorsal(e.target.value)}
                      className="w-full bg-card-bg border border-card-border text-slate-900 dark:text-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
                    />
                  </div>
                </div>

                {/* Position Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Demarcación</label>
                  <select
                    value={demarcacion}
                    onChange={(e) => setDemarcacion(e.target.value as any)}
                    className="w-full bg-card-bg border border-card-border text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 cursor-pointer"
                  >
                    <option value="">Selecciona una demarcación</option>
                    {DEMARCACIONES.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                {/* Birth Date */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha de Nacimiento</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={fechaNacimiento}
                      onChange={(e) => setFechaNacimiento(e.target.value)}
                      className="w-full bg-card-bg border border-card-border text-slate-900 dark:text-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 cursor-pointer"
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
    </div>
  );
}
