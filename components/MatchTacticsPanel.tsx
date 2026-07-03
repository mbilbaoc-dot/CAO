'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Calendar, 
  MapPin, 
  Play, 
  Save, 
  EyeOff, 
  Sparkles, 
  ChevronRight, 
  Upload, 
  FileText, 
  Video, 
  Activity, 
  TrendingUp, 
  CheckCircle,
  HelpCircle,
  Clock,
  Plus,
  Compass,
  Loader2,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MatchTacticsPanelProps {
  initialTab?: 'informe' | 'alineacion' | 'plan' | 'abp' | 'eventos';
}

interface EventLog {
  id: string;
  type: 'GOL' | 'OCASIÓN' | 'DUELO' | 'NOTA';
  time: string;
  videoTime: string;
  detail: string;
}

export default function MatchTacticsPanel({ initialTab = 'informe' }: MatchTacticsPanelProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Matches state
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  // Tactical tags state (Informe rival)
  const [tacticalTags, setTacticalTags] = useState({
    salida: 'EN CORTO',
    presion: 'ALTA',
    bloque: 'MEDIO',
    defensa: 'MEDIA',
    transOfensiva: 'POSESIÓN',
    transDefensiva: 'REPLIEGUE'
  });

  // Formations state (Alineación)
  const [myFormation, setMyFormation] = useState('4-3-3');
  const [rivalFormation, setRivalFormation] = useState('4-4-2');
  const [showRival, setShowRival] = useState(true);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  // ABP State
  const [abpType, setAbpType] = useState<'favor' | 'contra'>('favor');
  const [abpRecords, setAbpRecords] = useState<any[]>([]);
  const [isLoadingAbp, setIsLoadingAbp] = useState(false);
  const [localDesc, setLocalDesc] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({});

  // Event logger state
  const [youtubeInput, setYoutubeInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=s71L_0L-XGg');
  const [eventLogs, setEventLogs] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [youtubePlayerReady, setYoutubePlayerReady] = useState(false);

  const playerRef = useRef<any>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Helper formatting functions
  const formatDateString = (dateStr: string | null): string => {
    if (!dateStr) return 'Sin fecha';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const extractSecondsFromUrl = (url: string): number => {
    if (!url) return 0;
    const match = url.match(/[?&]t=(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const formatVideoTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const mStr = String(m).padStart(2, '0');
    const sStr = String(s).padStart(2, '0');
    if (h > 0) {
      return `${h}:${mStr}:${sStr}`;
    }
    return `${mStr}:${sStr}`;
  };

  // Load matches initial
  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingMatches(true);
      try {
        const { data, error } = await supabase
          .from('partidos')
          .select(`
            *,
            equipo_local:equipos!equipo_local_id(*),
            equipo_visitante:equipos!equipo_visitante_id(*)
          `)
          .order('fecha', { ascending: false });

        if (error) throw error;
        setMatches(data || []);
        if (data && data.length > 0) {
          const defaultMatch = data[0];
          setSelectedMatchId(defaultMatch.id);
          setSelectedMatch(defaultMatch);
        }
      } catch (e) {
        console.error('Error fetching matches:', e);
      } finally {
        setIsLoadingMatches(false);
      }
    }
    loadInitialData();
  }, []);

  // Load ABP and Event logs when match changes
  useEffect(() => {
    if (!selectedMatchId) return;

    // Load ABP records
    async function loadAbp() {
      setIsLoadingAbp(true);
      try {
        const { data, error } = await supabase
          .from('abp')
          .select('*')
          .eq('partido_id', selectedMatchId);

        if (error) throw error;
        setAbpRecords(data || []);
      } catch (e) {
        console.error('Error fetching ABP:', e);
      } finally {
        setIsLoadingAbp(false);
      }
    }

    // Load Event logs
    async function loadEvents() {
      setIsLoadingEvents(true);
      try {
        const { data, error } = await supabase
          .from('eventos_partido')
          .select('*')
          .eq('partido_id', selectedMatchId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setEventLogs(data || []);

        if (data && data.length > 0) {
          const firstWithUrl = data.find(e => e.youtube_url);
          if (firstWithUrl) {
            const baseVideoUrl = firstWithUrl.youtube_url.split('&')[0];
            setVideoUrl(baseVideoUrl);
            setYoutubeInput(baseVideoUrl);
          }
        } else {
          // Fallback to informes_rival
          const { data: infoData } = await supabase
            .from('informes_rival')
            .select('youtube_video_url')
            .eq('partido_id', selectedMatchId)
            .maybeSingle();
          
          if (infoData && infoData.youtube_video_url) {
            setVideoUrl(infoData.youtube_video_url);
            setYoutubeInput(infoData.youtube_video_url);
          } else {
            // Default fallback video
            setVideoUrl('https://www.youtube.com/watch?v=s71L_0L-XGg');
            setYoutubeInput('https://www.youtube.com/watch?v=s71L_0L-XGg');
          }
        }
      } catch (e) {
        console.error('Error fetching events:', e);
      } finally {
        setIsLoadingEvents(false);
      }
    }

    loadAbp();
    loadEvents();
  }, [selectedMatchId]);

  // Sync local descriptions when abpRecords or abpType changes
  useEffect(() => {
    const newLocalDesc: Record<string, string> = {};
    [1, 2, 3, 4].forEach(num => {
      const record = abpRecords.find(r => r.tipo === abpType && r.numero_jugada === num);
      newLocalDesc[`${abpType}_${num}`] = record?.descripcion || '';
    });
    setLocalDesc(newLocalDesc);
  }, [abpRecords, abpType]);

  // YouTube Player setup
  useEffect(() => {
    let player: any = null;
    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) return;

    const initPlayer = () => {
      const container = document.getElementById('youtube-player-container');
      if (!container) return;
      container.innerHTML = '<div id="youtube-player-iframe" class="w-full h-full"></div>';

      try {
        player = new (window as any).YT.Player('youtube-player-iframe', {
          videoId: videoId,
          playerVars: {
            playsinline: 1,
            rel: 0,
            autoplay: 0,
          },
          events: {
            onReady: () => {
              playerRef.current = player;
              setYoutubePlayerReady(true);
            },
          },
        });
      } catch (e) {
        console.error('Error YT Player:', e);
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      const prevCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };

      if (!document.getElementById('youtube-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    }

    return () => {
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy();
        } catch (e) {
          console.error(e);
        }
      }
      playerRef.current = null;
      setYoutubePlayerReady(false);
    };
  }, [videoUrl]);

  // Load appropriate initial tab
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleMatchChange = (matchId: string) => {
    setSelectedMatchId(matchId);
    const match = matches.find(m => m.id === matchId);
    setSelectedMatch(match || null);
  };

  // ABP handlers
  const handleDescChange = (num: number, val: string) => {
    setLocalDesc(prev => ({
      ...prev,
      [`${abpType}_${num}`]: val
    }));
  };

  const saveAbpPlay = async (num: number, text: string) => {
    if (!selectedMatchId) return;
    const key = `${abpType}_${num}`;
    setSavingStatus(prev => ({ ...prev, [key]: 'saving' }));
    try {
      const existing = abpRecords.find(r => r.tipo === abpType && r.numero_jugada === num);
      
      const payload = {
        partido_id: selectedMatchId,
        tipo: abpType,
        numero_jugada: num,
        descripcion: text,
        imagen_url: existing?.imagen_url || null
      };

      if (existing?.id) {
        const { data, error } = await supabase
          .from('abp')
          .update(payload)
          .eq('id', existing.id)
          .select();
        
        if (error) throw error;
        if (data && data[0]) {
          setAbpRecords(prev => prev.map(r => r.id === existing.id ? data[0] : r));
        }
      } else {
        const { data, error } = await supabase
          .from('abp')
          .insert([payload])
          .select();

        if (error) throw error;
        if (data && data[0]) {
          setAbpRecords(prev => [...prev, data[0]]);
        }
      }
      setSavingStatus(prev => ({ ...prev, [key]: 'saved' }));
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [key]: 'idle' }));
      }, 2000);
    } catch (e) {
      console.error('Error saving play:', e);
      setSavingStatus(prev => ({ ...prev, [key]: 'idle' }));
      alert('Error al guardar la descripción de la jugada.');
    }
  };

  const handleAbpImageUpload = async (num: number, file: File) => {
    if (!selectedMatchId) return;
    const key = `${abpType}_${num}`;
    setSavingStatus(prev => ({ ...prev, [key]: 'saving' }));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `abp_${selectedMatchId}_${abpType}_${num}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('IMAGENES TACTICAS')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('IMAGENES TACTICAS')
        .getPublicUrl(fileName);

      const publicUrl = data.publicUrl;

      const existing = abpRecords.find(r => r.tipo === abpType && r.numero_jugada === num);
      const payload = {
        partido_id: selectedMatchId,
        tipo: abpType,
        numero_jugada: num,
        descripcion: localDesc[`${abpType}_${num}`] || '',
        imagen_url: publicUrl
      };

      if (existing?.id) {
        const { data: updatedData, error } = await supabase
          .from('abp')
          .update(payload)
          .eq('id', existing.id)
          .select();
        
        if (error) throw error;
        if (updatedData && updatedData[0]) {
          setAbpRecords(prev => prev.map(r => r.id === existing.id ? updatedData[0] : r));
        }
      } else {
        const { data: insertedData, error } = await supabase
          .from('abp')
          .insert([payload])
          .select();

        if (error) throw error;
        if (insertedData && insertedData[0]) {
          setAbpRecords(prev => [...prev, insertedData[0]]);
        }
      }

      setSavingStatus(prev => ({ ...prev, [key]: 'saved' }));
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [key]: 'idle' }));
      }, 2000);
    } catch (e) {
      console.error('Error uploading image:', e);
      setSavingStatus(prev => ({ ...prev, [key]: 'idle' }));
      alert('Error al subir el esquema táctico.');
    }
  };

  const deleteAbpImage = async (num: number) => {
    if (!selectedMatchId) return;
    const key = `${abpType}_${num}`;
    const existing = abpRecords.find(r => r.tipo === abpType && r.numero_jugada === num);
    if (!existing || !existing.imagen_url) return;

    if (!confirm('¿Estás seguro de que deseas eliminar este esquema táctico?')) return;

    setSavingStatus(prev => ({ ...prev, [key]: 'saving' }));
    try {
      const payload = {
        partido_id: selectedMatchId,
        tipo: abpType,
        numero_jugada: num,
        descripcion: localDesc[`${abpType}_${num}`] || '',
        imagen_url: null
      };

      const { data, error } = await supabase
        .from('abp')
        .update(payload)
        .eq('id', existing.id)
        .select();

      if (error) throw error;
      if (data && data[0]) {
        setAbpRecords(prev => prev.map(r => r.id === existing.id ? data[0] : r));
      }
      setSavingStatus(prev => ({ ...prev, [key]: 'saved' }));
      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [key]: 'idle' }));
      }, 2000);
    } catch (e) {
      console.error('Error deleting image:', e);
      setSavingStatus(prev => ({ ...prev, [key]: 'idle' }));
      alert('Error al eliminar el esquema táctico.');
    }
  };

  // Events Logger handlers
  const handleLoadVideo = () => {
    const cleanUrl = youtubeInput.trim();
    if (!cleanUrl) return;
    setVideoUrl(cleanUrl);
  };

  const addEventLog = async (type: 'Gol' | 'Falta' | 'Ocasión de gol') => {
    if (!selectedMatchId) {
      alert('Por favor, selecciona un partido primero.');
      return;
    }

    let seconds = 0;
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      try {
        seconds = Math.round(playerRef.current.getCurrentTime());
      } catch (e) {
        console.error('Error getting player current time:', e);
      }
    }

    const videoId = extractYouTubeId(videoUrl);
    const eventUrl = videoId 
      ? `https://www.youtube.com/watch?v=${videoId}&t=${seconds}`
      : videoUrl;

    const payload = {
      partido_id: selectedMatchId,
      youtube_url: eventUrl,
      evento_tipo: type
    };

    try {
      const { data, error } = await supabase
        .from('eventos_partido')
        .insert([payload])
        .select();

      if (error) throw error;
      if (data && data[0]) {
        setEventLogs(prev => [...prev, data[0]]);
      }
    } catch (e) {
      console.error('Error creating event log:', e);
      alert('Error al guardar el evento.');
    }
  };

  const deleteEventLog = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) return;
    try {
      const { error } = await supabase
        .from('eventos_partido')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEventLogs(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      console.error('Error deleting event:', e);
      alert('Error al eliminar el evento.');
    }
  };

  const handleSeekToEvent = (log: any) => {
    const seconds = extractSecondsFromUrl(log.youtube_url);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seconds, true);
      playerRef.current.playVideo();
    } else {
      const videoId = extractYouTubeId(log.youtube_url);
      if (videoId) {
        setVideoUrl(`https://www.youtube.com/watch?v=${videoId}&t=${seconds}`);
      }
    }
  };

  // Handle tactical tags click
  const toggleTag = (category: string, value: string) => {
    setTacticalTags(prev => ({
      ...prev,
      [category]: value
    }));
  };

  // Run AI analysis
  const runAiAnalysis = () => {
    setAiAnalyzing(true);
    setAiAnalysisResult(null);
    setTimeout(() => {
      setAiAnalyzing(false);
      setAiAnalysisResult(
        `Análisis Táctico IA (Sistema ${myFormation} vs ${rivalFormation}):\n\n` +
        `• Ventaja Espacial: Tu sistema ${myFormation} ofrece superioridad numérica en el centro del campo frente al ${rivalFormation} rival, permitiendo transiciones rápidas.\n` +
        `• Punto Crítico: Cuidado con las contras directas en bandas si tus laterales suben simultáneamente.\n` +
        `• Recomendación: Presionar alto la salida en corto rival para forzar envíos largos donde Vivian es superior.`
      );
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Match Meta Card */}
      <div className="bg-card-bg border border-card-border p-6 rounded-3xl shadow-xs transition-colors duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            {/* Match selector dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Planificando Partido:</span>
              {isLoadingMatches ? (
                <div className="flex items-center gap-1 text-xs text-brand-purple">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cargando partidos...</span>
                </div>
              ) : (
                <select
                  id="match-select"
                  value={selectedMatchId || ''}
                  onChange={(e) => handleMatchChange(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                >
                  {matches.length === 0 ? (
                    <option value="">No hay partidos</option>
                  ) : (
                    matches.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.equipo_local?.nombre || 'Local'} vs {m.equipo_visitante?.nombre || 'Visitante'} ({formatDateString(m.fecha)})
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            {selectedMatch ? (
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Partido de Planificación</span>
                  <span>•</span>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDateString(selectedMatch.fecha)}</span>
                  {selectedMatch.resultado && (
                    <>
                      <span>•</span>
                      <span>Resultado: {selectedMatch.resultado}</span>
                    </>
                  )}
                </span>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {selectedMatch.equipo_local?.nombre || 'Local'}
                  </span>
                  <span className="text-sm font-semibold text-slate-400 dark:text-slate-600">vs</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {selectedMatch.equipo_visitante?.nombre || 'Visitante'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                No hay partidos seleccionados. Crea uno en la sección de Partidos.
              </div>
            )}
          </div>
          
          {selectedMatch && (
            <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all duration-200 cursor-pointer">
              <Save className="w-4 h-4" />
              Guardar información
            </button>
          )}
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 dark:border-slate-800/60 mt-6 pt-5">
          {[
            { id: 'informe', label: 'Informe rival', icon: FileText },
            { id: 'alineacion', label: 'Alineación', icon: TrendingUp },
            { id: 'plan', label: 'Plan de partido', icon: CheckCircle },
            { id: 'abp', label: 'ABP', icon: Compass },
            { id: 'eventos', label: 'Eventos', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none
                  ${isActive 
                    ? 'bg-brand-purple text-white shadow-xs' 
                    : 'bg-slate-100/80 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-800/40'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="transition-all duration-300">
        
        {/* TAB: INFORME RIVAL */}
        {activeTab === 'informe' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Left: Tactical tags builder */}
            <div className="bg-card-bg border border-card-border p-6 rounded-3xl flex flex-col gap-6 shadow-xs">
              <h2 className="text-lg font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-xs">
                Características del Rival
              </h2>

              <div className="flex flex-col gap-5">
                {/* Salida de balón */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-extrabold text-slate-850 dark:text-slate-250 uppercase bg-rose-600/10 text-rose-600 dark:text-rose-450 py-1.5 px-3 rounded-lg w-max select-none">
                    Salida de Balón
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {['EN CORTO', 'EN LARGO', 'MIXTO'].map(val => (
                      <button
                        key={val}
                        onClick={() => toggleTag('salida', val)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                          tacticalTags.salida === val
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Presión */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-extrabold text-slate-850 dark:text-slate-250 uppercase bg-rose-600/10 text-rose-600 dark:text-rose-450 py-1.5 px-3 rounded-lg w-max select-none">
                    Presión
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {['ALTA', 'MEDIA', 'BAJA'].map(val => (
                      <button
                        key={val}
                        onClick={() => toggleTag('presion', val)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                          tacticalTags.presion === val
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bloque */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-extrabold text-slate-850 dark:text-slate-250 uppercase bg-rose-600/10 text-rose-600 dark:text-rose-450 py-1.5 px-3 rounded-lg w-max select-none">
                    Bloque
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {['ALTO', 'MEDIO', 'BAJO'].map(val => (
                      <button
                        key={val}
                        onClick={() => toggleTag('bloque', val)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                          tacticalTags.bloque === val
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Línea Defensiva */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-extrabold text-slate-850 dark:text-slate-250 uppercase bg-rose-600/10 text-rose-600 dark:text-rose-450 py-1.5 px-3 rounded-lg w-max select-none">
                    Línea Defensiva
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {['ALTA', 'MEDIA', 'BAJA'].map(val => (
                      <button
                        key={val}
                        onClick={() => toggleTag('defensa', val)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                          tacticalTags.defensa === val
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transición Ofensiva */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-extrabold text-slate-850 dark:text-slate-250 uppercase bg-rose-600/10 text-rose-600 dark:text-rose-450 py-1.5 px-3 rounded-lg w-max select-none">
                    Transición Ofensiva
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {['DIRECTA', 'POSESIÓN'].map(val => (
                      <button
                        key={val}
                        onClick={() => toggleTag('transOfensiva', val)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                          tacticalTags.transOfensiva === val
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transición Defensiva */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-extrabold text-slate-850 dark:text-slate-250 uppercase bg-rose-600/10 text-rose-600 dark:text-rose-450 py-1.5 px-3 rounded-lg w-max select-none">
                    Transición Defensiva
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {['PRESIÓN INMEDIATA', 'REPLIEGUE'].map(val => (
                      <button
                        key={val}
                        onClick={() => toggleTag('transDefensiva', val)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                          tacticalTags.transDefensiva === val
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Media inputs and embeds */}
            <div className="flex flex-col gap-6">
              {/* Google Slides Card */}
              <div className="bg-card-bg border border-card-border p-6 rounded-3xl shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Presentación Google Slides</h3>
                </div>
                <input
                  type="text"
                  placeholder="Pega el enlace de Google Slides (compartir > publicar)..."
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-purple mb-4"
                />
                <div className="h-48 rounded-2xl bg-slate-100/50 dark:bg-slate-900/60 flex items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-400 max-w-xs">
                    Introduce el enlace de Google Slides para previsualizarlo aquí
                  </span>
                </div>
              </div>

              {/* Vimeo Card */}
              <div className="bg-card-bg border border-card-border p-6 rounded-3xl shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <Video className="w-5 h-5 text-violet-500" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Vídeo Vimeo</h3>
                </div>
                <input
                  type="text"
                  placeholder="Pega el enlace de Vimeo (ej. https://vimeo.com/123456789)..."
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-purple mb-4"
                />
                <div className="h-48 rounded-2xl bg-slate-100/50 dark:bg-slate-900/60 flex items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-400 max-w-xs">
                    Introduce el enlace de Vimeo para previsualizarlo aquí
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ALINEACIÓN (TACTICAL BOARD) */}
        {activeTab === 'alineacion' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Field Map Mockup (Col span 2) */}
            <div className="lg:col-span-2 bg-card-bg border border-card-border p-6 rounded-3xl flex flex-col gap-5 shadow-xs relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Formation selection */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mi Formación</span>
                    <div className="flex gap-1.5">
                      {['4-3-3', '4-4-2', '4-2-3-1', '5-3-2'].map(sys => (
                        <button
                          key={sys}
                          onClick={() => setMyFormation(sys)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                            myFormation === sys
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          {sys}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Formación Rival</span>
                    <div className="flex gap-1.5">
                      {['4-3-3', '4-4-2', '4-2-3-1', '5-3-2'].map(sys => (
                        <button
                          key={sys}
                          onClick={() => setRivalFormation(sys)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                            rivalFormation === sys
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          {sys}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Field toggles */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRival(!showRival)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    {showRival ? 'Ocultar rival' : 'Mostrar rival'}
                  </button>
                  <button
                    onClick={runAiAnalysis}
                    className="flex items-center gap-1.5 bg-brand-purple hover:bg-brand-purple-dark text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm animate-pulse-slow"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Analizar IA
                  </button>
                </div>
              </div>

              {/* Soccer Field Canvas Mockup */}
              <div className="aspect-[2/3] w-full max-w-[420px] mx-auto bg-emerald-700 dark:bg-emerald-800/90 rounded-2xl relative border-4 border-emerald-500 overflow-hidden shadow-inner p-4 flex flex-col justify-between">
                {/* Grass stripes */}
                <div className="absolute inset-0 flex flex-col opacity-10 pointer-events-none">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-black' : 'bg-transparent'}`} />
                  ))}
                </div>

                {/* Tactical Lines */}
                <div className="absolute inset-0 border-2 border-white/50 m-2 rounded-lg pointer-events-none" />
                <div className="absolute top-1/2 left-2 right-2 border-t-2 border-white/50 -translate-y-1/2 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/50 rounded-full pointer-events-none" />
                
                {/* Penalty Area Top */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-48 h-20 border-b-2 border-x-2 border-white/50 pointer-events-none" />
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 border-b-2 border-x-2 border-white/50 pointer-events-none" />

                {/* Penalty Area Bottom */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 h-20 border-t-2 border-x-2 border-white/50 pointer-events-none" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-6 border-t-2 border-x-2 border-white/50 pointer-events-none" />

                {/* Players Placements (Simulated POR, DEF, CEN, DEL badges) */}
                <div className="relative z-10 w-full h-full flex flex-col justify-between py-6">
                  {/* Away Forward / Home GK */}
                  <div className="flex justify-center">
                    <div className="w-9 h-9 rounded-full bg-rose-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">POR</div>
                  </div>

                  {/* Defenses */}
                  <div className="flex justify-around px-2">
                    <div className="w-9 h-9 rounded-full bg-rose-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">DEF</div>
                    <div className="w-9 h-9 rounded-full bg-rose-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">DEF</div>
                    <div className="w-9 h-9 rounded-full bg-rose-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">DEF</div>
                    <div className="w-9 h-9 rounded-full bg-rose-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">DEF</div>
                  </div>

                  {/* Midfields */}
                  <div className="flex justify-around px-8">
                    <div className="w-9 h-9 rounded-full bg-rose-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">CEN</div>
                    <div className="w-9 h-9 rounded-full bg-rose-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">CEN</div>
                    <div className="w-9 h-9 rounded-full bg-rose-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">CEN</div>
                  </div>

                  {/* Forwards */}
                  <div className="flex justify-around px-4">
                    <div className="w-9 h-9 rounded-full bg-rose-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">DEL</div>
                    <div className="w-9 h-9 rounded-full bg-rose-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">DEL</div>
                    <div className="w-9 h-9 rounded-full bg-rose-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">DEL</div>
                  </div>

                  {/* Opponent Roster Overlay (Semi-transparent Blue circles) */}
                  {showRival && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-around py-8 select-none">
                      <div className="flex justify-around px-10 opacity-70">
                        <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">DEL</div>
                        <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">DEL</div>
                      </div>
                      <div className="flex justify-around px-6 opacity-70">
                        <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">CEN</div>
                        <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">CEN</div>
                        <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">CEN</div>
                      </div>
                      <div className="flex justify-around px-2 opacity-70">
                        <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">DEF</div>
                        <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">DEF</div>
                        <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">DEF</div>
                        <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">DEF</div>
                      </div>
                      <div className="flex justify-center opacity-70">
                        <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center text-xs font-black shadow-md">POR</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: AI Analysis Panel & Players Sidebar */}
            <div className="bg-card-bg border border-card-border p-6 rounded-3xl shadow-xs flex flex-col gap-6">
              <h3 className="font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-xs">
                Análisis Táctico
              </h3>

              {aiAnalyzing && (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
                  <span className="text-sm font-semibold text-slate-500">Analizando enfrentamientos de sistemas...</span>
                </div>
              )}

              {!aiAnalyzing && !aiAnalysisResult && (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center text-violet-500">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Análisis con IA</h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Pulsa «Analizar IA» para obtener recomendaciones automáticas basadas en la contraposición de sistemas tácticos.
                    </p>
                  </div>
                </div>
              )}

              {aiAnalysisResult && (
                <div className="bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/50 p-5 rounded-2xl animate-fade-in">
                  <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-3">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">Motor táctico IA</span>
                  </div>
                  <pre className="text-xs font-sans text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {aiAnalysisResult}
                  </pre>
                </div>
              )}

              {/* Roster list representation */}
              <div className="border-t border-card-border pt-5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase mb-3 text-slate-400">
                  Jugadores Disponibles (Athletic Club)
                </h4>
                <div className="h-64 overflow-y-auto flex flex-col gap-2 pr-1">
                  {[
                    'Alex Padilla', 'Unai Simón', 'Julen Agirrezabala', 
                    'Dani Vivian', 'Aitor Paredes', 'Yuri Berchiche', 
                    'Yeray Álvarez', 'Óscar de Marcos', 'Adama Boiro'
                  ].map((p, i) => (
                    <div 
                      key={p} 
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors text-xs font-medium cursor-grab active:cursor-grabbing"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {i === 0 ? 'Alex Padilla' : i === 1 ? 'Unai Simón' : p}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                        {i < 3 ? 'POR' : 'DEF'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PLAN DE PARTIDO (GAME PLAN) */}
        {activeTab === 'plan' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {[
              { id: 'ataque', title: 'ATAQUE', icon: '⚽' },
              { id: 'defensa', title: 'DEFENSA', icon: '🛡️' },
              { id: 'transiciones', title: 'TRANSICIONES', icon: '⚡' }
            ].map(block => (
              <div key={block.id} className="bg-card-bg border border-card-border p-6 rounded-3xl shadow-xs flex flex-col gap-5">
                {/* Block header */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{block.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">Bloque</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-lg leading-tight">{block.title}</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Notas abiertas</label>
                  <textarea
                    placeholder={`Escribe tu análisis de ${block.id}...`}
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-purple resize-none"
                  />
                </div>

                {/* Video */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Vídeo específico (Vimeo)</label>
                  <input
                    type="text"
                    placeholder="https://vimeo.com/..."
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                {/* Images uploaders */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Imágenes</span>
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3].map(num => (
                      <div 
                        key={num}
                        className="flex items-center justify-between p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      >
                        <span className="text-xs text-slate-450 dark:text-slate-500 flex items-center gap-2">
                          <Upload className="w-3.5 h-3.5" />
                          Subir Imagen {num}
                        </span>
                        <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          +
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Document input */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Documento (PDF en Google Drive)</label>
                  <input
                    type="text"
                    placeholder="Enlace al documento..."
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: ABP (SET PIECES) */}
        {activeTab === 'abp' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {!selectedMatchId ? (
              <div className="bg-card-bg border border-card-border p-12 rounded-3xl text-center flex flex-col items-center justify-center gap-4">
                <Shield className="w-12 h-12 text-slate-300 dark:text-slate-700 animate-bounce-slow" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No hay ningún partido seleccionado</h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Para poder gestionar el modulo ABP, necesitas dar de alta un partido primero.
                </p>
                <a href="/partidos" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold px-5 py-3 rounded-2xl transition-all shadow-sm">
                  Ir a Partidos
                </a>
              </div>
            ) : (
              <>
                {/* ABP sub-tabs */}
                <div className="flex justify-center bg-card-bg border border-card-border p-2 rounded-2xl max-w-sm mx-auto shadow-xs">
                  {['favor', 'contra'].map(type => (
                    <button
                      key={type}
                      onClick={() => setAbpType(type as any)}
                      className={`flex-1 px-4 py-2 rounded-xl text-xs font-black cursor-pointer select-none transition-all uppercase ${
                        abpType === type
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-xs'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
                      }`}
                    >
                      {type === 'favor' ? 'Córners a Favor' : 'Córners en Contra'}
                    </button>
                  ))}
                </div>

                <div className="text-center">
                  <span className="text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                    {abpType === 'favor' ? 'CÓRNERS A FAVOR' : 'CÓRNERS EN CONTRA'}
                  </span>
                </div>

                {/* Corners grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map(num => {
                    const record = abpRecords.find(r => r.tipo === abpType && r.numero_jugada === num);
                    const desc = localDesc[`${abpType}_${num}`] || '';
                    const imageUrl = record?.imagen_url || '';
                    const key = `${abpType}_${num}`;
                    const status = savingStatus[key] || 'idle';

                    return (
                      <div key={num} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col gap-4 relative">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase">
                            Jugada {num}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {status === 'saving' && (
                              <span className="text-[10px] text-brand-purple font-semibold flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
                              </span>
                            )}
                            {status === 'saved' && (
                              <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-500" /> Guardado
                              </span>
                            )}
                            <button
                              onClick={() => saveAbpPlay(num, desc)}
                              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer select-none"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>

                        {/* Detail strategy open input */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">
                            Estrategia y Movimientos
                          </label>
                          <textarea
                            value={desc}
                            onChange={(e) => handleDescChange(num, e.target.value)}
                            onBlur={() => saveAbpPlay(num, desc)}
                            placeholder="Describe los movimientos, bloqueos o remates..."
                            rows={3}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand-purple resize-none"
                          />
                        </div>

                        {/* Image Preview / Uploader Container */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">
                            Esquema Táctico
                          </label>
                          
                          {imageUrl ? (
                            <div className="relative group aspect-[16/9] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                              <img
                                src={imageUrl}
                                alt={`Esquema Jugada ${num}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                                <button
                                  onClick={() => fileInputRefs.current[num]?.click()}
                                  className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-sm transition-colors cursor-pointer"
                                >
                                  Cambiar
                                </button>
                                <button
                                  onClick={() => deleteAbpImage(num)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-sm transition-colors cursor-pointer"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => fileInputRefs.current[num]?.click()}
                              className="w-full aspect-[16/9] bg-slate-100 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-150 dark:hover:bg-slate-900/40 transition-colors"
                            >
                              <Upload className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                              <span className="text-xs font-bold text-slate-450 dark:text-slate-500">
                                Subir esquema táctico
                              </span>
                            </div>
                          )}

                          <input
                            type="file"
                            accept="image/*"
                            ref={(el) => { fileInputRefs.current[num] = el; }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleAbpImageUpload(num, file);
                            }}
                            className="hidden"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB: EVENTOS (REAL-TIME EVENTS LOGGER) */}
        {activeTab === 'eventos' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {!selectedMatchId ? (
              <div className="bg-card-bg border border-card-border p-12 rounded-3xl text-center flex flex-col items-center justify-center gap-4">
                <Shield className="w-12 h-12 text-slate-350 dark:text-slate-700 animate-bounce-slow" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No hay ningún partido seleccionado</h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Para poder registrar eventos en tiempo real, necesitas dar de alta un partido primero.
                </p>
                <a href="/partidos" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold px-5 py-3 rounded-2xl transition-all shadow-sm">
                  Ir a Partidos
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* URL Input Row */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-2">
                    URL del Partido (YouTube)
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={youtubeInput}
                      onChange={(e) => setYoutubeInput(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleLoadVideo();
                      }}
                    />
                    <button 
                      onClick={handleLoadVideo}
                      className="px-5 bg-brand-purple hover:bg-brand-purple-dark text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm font-bold text-xs shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Cargar Video</span>
                    </button>
                  </div>
                </div>

                {/* Main section: Video player and buttons on left, events timeline on right */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Video Player & Event buttons (Col span 2) */}
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    {/* YouTube Video Player Container */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs p-4 flex flex-col justify-center">
                      <div className="w-full aspect-video bg-slate-950 flex flex-col items-center justify-center relative rounded-2xl overflow-hidden">
                        <div id="youtube-player-container" className="w-full h-full" />
                        {!youtubePlayerReady && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white gap-3 z-15">
                            <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
                            <span className="text-sm font-semibold text-slate-455">
                              Cargando reproductor de YouTube...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Horizontal buttons just below the video */}
                    <div className="grid grid-cols-3 gap-4">
                      <button 
                        onClick={() => addEventLog('Gol')}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-extrabold py-4 rounded-2xl text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-2 shadow-xs cursor-pointer select-none transition-all active:scale-98"
                      >
                        <span className="text-base sm:text-lg">⚽</span>
                        <span>Gol</span>
                      </button>
                      
                      <button 
                        onClick={() => addEventLog('Falta')}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-extrabold py-4 rounded-2xl text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-2 shadow-xs cursor-pointer select-none transition-all active:scale-98"
                      >
                        <span className="text-base sm:text-lg">🟨</span>
                        <span>Falta</span>
                      </button>

                      <button 
                        onClick={() => addEventLog('Ocasión de gol')}
                        className="bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple dark:text-violet-400 border border-brand-purple/20 font-extrabold py-4 rounded-2xl text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-2 shadow-xs cursor-pointer select-none transition-all active:scale-98"
                      >
                        <span className="text-base sm:text-lg">🎯</span>
                        <span>Ocasión de gol</span>
                      </button>
                    </div>
                  </div>

                  {/* Registered Events List (Col span 1) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xs flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Eventos Registrados
                        </span>
                        <span className="text-[10px] bg-brand-purple/10 text-brand-purple dark:bg-brand-purple/20 dark:text-violet-300 px-2 py-0.5 rounded-full font-bold">
                          {eventLogs.length}
                        </span>
                      </div>
                    </div>

                    {isLoadingEvents ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-purple" />
                        <span className="text-xs text-slate-450">Cargando eventos...</span>
                      </div>
                    ) : eventLogs.length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-400 font-medium">
                        No hay eventos registrados en este partido.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                        {eventLogs.map((log) => {
                          const seconds = extractSecondsFromUrl(log.youtube_url);
                          const timeStr = formatVideoTime(seconds);
                          const badgeColor = {
                            'Gol': 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-200/50 dark:border-emerald-900/30',
                            'Falta': 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450 border border-amber-200/50 dark:border-amber-900/30',
                            'Ocasión de gol': 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30'
                          }[log.evento_tipo as string] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-750/30';

                          return (
                            <div 
                              key={log.id}
                              onClick={() => handleSeekToEvent(log)}
                              className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer group hover:translate-x-1 animate-fade-in"
                            >
                              <div className="flex gap-3 items-center min-w-0">
                                <span className={`h-fit text-[9px] font-black px-2 py-0.5 rounded uppercase ${badgeColor} shrink-0`}>
                                  {log.evento_tipo}
                                </span>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-slate-850 dark:text-slate-200 leading-tight">
                                    Click para ir
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                    Minuto: {timeStr}
                                  </span>
                                </div>
                              </div>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteEventLog(log.id);
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 dark:hover:bg-rose-900/40 border border-rose-200/50 dark:border-rose-900/30 rounded-xl transition-all cursor-pointer shrink-0 z-10"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
