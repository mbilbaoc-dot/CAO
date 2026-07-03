'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Trophy,
  Activity,
  FileText,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Share2,
  Plus,
  Video,
  List,
  Map,
  BarChart3,
  Flame,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

/* ───── Type Definitions ───── */
interface EventoPartido {
  id: string;
  partido_id: string | null;
  youtube_url: string | null;
  evento_tipo: string | null;
  created_at: string;
}

interface MatchEventsPanelProps {
  matchId: string;
}

/* ───── Custom Icons for Event Buttons ───── */
const SoccerBallIcon = () => (
  <svg className="w-6 h-6 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    <path d="M12 8l3 4.5-3 3.5-3-3.5L12 8z" fill="currentColor" fillOpacity="0.1" />
  </svg>
);

const DueloIcon = () => (
  <svg className="w-6 h-6 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
    <path d="M13 19l-2-2" />
    <path d="M16 16l3 3" />
    <path d="M19 13l2-2" />
    <path d="M9.5 17.5L21 6V3h-3L6.5 14.5" />
    <path d="M11 19l2-2" />
    <path d="M8 16l-3 3" />
    <path d="M5 13l-2-2" />
  </svg>
);

/* ───── Helper Functions ───── */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function extractVimeoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  return match ? match[1] : null;
}

function parseSecondsFromUrl(url: string): number {
  if (!url) return 0;
  const match = url.match(/[?&]t=(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function parseCoordinatesFromUrl(url: string): { x: number; y: number } | null {
  if (!url) return null;
  const matchX = url.match(/[?&]x=(\d+)/);
  const matchY = url.match(/[?&]y=(\d+)/);
  if (matchX && matchY) {
    return {
      x: parseInt(matchX[1], 10),
      y: parseInt(matchY[1], 10),
    };
  }
  return null;
}

function formatVideoTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mStr = String(m).padStart(2, '0');
  const sStr = String(s).padStart(2, '0');
  if (h > 0) {
    return `${h}:${mStr}:${sStr}`;
  }
  return `${m}:${sStr}`;
}

export default function MatchEventsPanel({ matchId }: MatchEventsPanelProps) {
  /* ───── States ───── */
  const [urlInput, setUrlInput] = useState('');
  const [loadedVideoUrl, setLoadedVideoUrl] = useState('');
  const [playerType, setPlayerType] = useState<'youtube' | 'vimeo' | null>(null);
  
  // Events state
  const [events, setEvents] = useState<EventoPartido[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // Real-time synchronization
  const [currentSecs, setCurrentSecs] = useState(0);

  // Cards UI Toggles / Tabs
  const [showTiempos, setShowTiempos] = useState(false);
  const [historyView, setHistoryView] = useState<'lista' | 'campo' | 'graficas'>('lista');
  const [filterType, setFilterType] = useState<'todos' | 'gol' | 'ocasion' | 'duelo' | 'nota'>('todos');

  /* ───── Refs ───── */
  const playerRef = useRef<any>(null);
  const youtubeReadyRef = useRef<boolean>(false);
  const vimeoReadyRef = useRef<boolean>(false);

  /* ───── Load events from Supabase ───── */
  const loadEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from('eventos_partido')
        .select('*')
        .eq('partido_id', matchId);

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error cargando eventos:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [matchId]);

  // Load active video URL from either first event URL or DB fallback
  const loadInitialVideoUrl = useCallback(async () => {
    try {
      // 1. Try to find if any event already exists and has a video URL
      const { data: eventData } = await supabase
        .from('eventos_partido')
        .select('youtube_url')
        .eq('partido_id', matchId)
        .not('youtube_url', 'is', null)
        .limit(1);

      if (eventData && eventData.length > 0 && eventData[0].youtube_url) {
        // Strip out the event-specific params (?t=..., &x=..., &y=...)
        const cleanUrl = eventData[0].youtube_url.split('?')[0].split('&')[0];
        setUrlInput(cleanUrl);
        setLoadedVideoUrl(cleanUrl);
        return;
      }

      // 2. Fall back to the opponent analysis youtube URL if present
      const { data: infoData } = await supabase
        .from('informes_rival')
        .select('youtube_video_url')
        .eq('partido_id', matchId)
        .maybeSingle();

      if (infoData && infoData.youtube_video_url) {
        setUrlInput(infoData.youtube_video_url);
        setLoadedVideoUrl(infoData.youtube_video_url);
      }
    } catch (err) {
      console.error('Error cargando URL de video inicial:', err);
    }
  }, [matchId]);

  useEffect(() => {
    loadEvents();
    loadInitialVideoUrl();
  }, [loadEvents, loadInitialVideoUrl]);

  /* ───── Video Player Integrations ───── */
  
  // Cleanup player helpers
  const clearPlayers = () => {
    playerRef.current = null;
    youtubeReadyRef.current = false;
    vimeoReadyRef.current = false;
  };

  // Initialize YouTube Player API
  const initYouTubePlayer = (videoId: string) => {
    const container = document.getElementById('media-player-container');
    if (!container) return;
    
    container.innerHTML = '<div id="youtube-player-iframe" class="w-full h-full text-card-bg"></div>';
    clearPlayers();

    const loadPlayer = () => {
      try {
        const player = new (window as any).YT.Player('youtube-player-iframe', {
          videoId: videoId,
          playerVars: {
            playsinline: 1,
            rel: 0,
            autoplay: 0,
            enablejsapi: 1,
          },
          events: {
            onReady: () => {
              playerRef.current = player;
              youtubeReadyRef.current = true;
              
              // If loaded URL has an initial timestamp, seek to it
              const initialSeconds = parseSecondsFromUrl(urlInput);
              if (initialSeconds > 0) {
                player.seekTo(initialSeconds, true);
              }
            },
          },
        });
      } catch (e) {
        console.error('Error YT Player Constructor:', e);
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      loadPlayer();
    } else {
      const prevCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        loadPlayer();
      };

      if (!document.getElementById('youtube-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    }
  };

  // Initialize Vimeo Player SDK
  const initVimeoPlayer = (vimeoId: string) => {
    const container = document.getElementById('media-player-container');
    if (!container) return;

    container.innerHTML = '<div id="vimeo-player-iframe" class="w-full h-full text-card-bg"></div>';
    clearPlayers();

    const loadPlayer = () => {
      try {
        const player = new (window as any).Vimeo.Player('vimeo-player-iframe', {
          id: parseInt(vimeoId, 10),
          width: 640,
          loop: false,
          autoplay: false,
        });

        player.ready().then(() => {
          playerRef.current = player;
          vimeoReadyRef.current = true;

          // If loaded URL has an initial timestamp, seek to it
          const initialSeconds = parseSecondsFromUrl(urlInput);
          if (initialSeconds > 0) {
            player.setCurrentTime(initialSeconds);
          }
        });
      } catch (e) {
        console.error('Error Vimeo Player SDK:', e);
      }
    };

    if ((window as any).Vimeo && (window as any).Vimeo.Player) {
      loadPlayer();
    } else {
      if (!document.getElementById('vimeo-sdk-script')) {
        const tag = document.createElement('script');
        tag.id = 'vimeo-sdk-script';
        tag.src = 'https://player.vimeo.com/api/player.js';
        tag.onload = () => {
          loadPlayer();
        };
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      } else {
        // Wait script load
        const interval = setInterval(() => {
          if ((window as any).Vimeo && (window as any).Vimeo.Player) {
            clearInterval(interval);
            loadPlayer();
          }
        }, 100);
      }
    }
  };

  // Trigger loading player when loadedVideoUrl updates
  useEffect(() => {
    if (!loadedVideoUrl) {
      setPlayerType(null);
      clearPlayers();
      return;
    }

    const ytId = extractYouTubeId(loadedVideoUrl);
    const vimeoId = extractVimeoId(loadedVideoUrl);

    if (ytId) {
      setPlayerType('youtube');
      initYouTubePlayer(ytId);
    } else if (vimeoId) {
      setPlayerType('vimeo');
      initVimeoPlayer(vimeoId);
    } else {
      alert('Por favor, introduce una URL de YouTube o Vimeo válida.');
      setPlayerType(null);
      setLoadedVideoUrl('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedVideoUrl]);

  // Synchronize current video time continuously
  const getCurrentPlayerTime = useCallback(async (): Promise<number> => {
    if (!playerRef.current) return 0;
    if (playerType === 'youtube' && youtubeReadyRef.current) {
      if (typeof playerRef.current.getCurrentTime === 'function') {
        return Math.round(playerRef.current.getCurrentTime());
      }
    } else if (playerType === 'vimeo' && vimeoReadyRef.current) {
      try {
        const secs = await playerRef.current.getCurrentTime();
        return Math.round(secs);
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }, [playerType]);

  useEffect(() => {
    let active = true;
    const interval = setInterval(async () => {
      if (!active) return;
      if (playerRef.current) {
        const secs = await getCurrentPlayerTime();
        setCurrentSecs(secs);
      }
    }, 500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [getCurrentPlayerTime]);

  const handleSeek = (seconds: number) => {
    if (!playerRef.current) return;
    if (playerType === 'youtube' && youtubeReadyRef.current) {
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(seconds, true);
        playerRef.current.playVideo();
      }
    } else if (playerType === 'vimeo' && vimeoReadyRef.current) {
      if (typeof playerRef.current.setCurrentTime === 'function') {
        playerRef.current.setCurrentTime(seconds).then(() => {
          playerRef.current.play();
        });
      }
    }
  };

  /* ───── Event Handlers ───── */

  const handleLoadVideo = () => {
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;
    setLoadedVideoUrl(cleanUrl);
  };

  const registerEvent = async (type: 'gol' | 'ocasion' | 'duelo' | 'nota') => {
    if (!loadedVideoUrl) {
      alert('Introduce la URL del partido para poder registrar eventos.');
      return;
    }

    const seconds = await getCurrentPlayerTime();
    
    // Representative initial coordinates on the pitch based on event types:
    // Gol -> Near opponent goal (90, 50)
    // Ocasion -> Inside opponent penalty box (80, 45)
    // Duelo -> Midfield (50, 40)
    // Nota -> Sidelines (40, 85)
    let x = 50;
    let y = 50;
    if (type === 'gol') { x = 90; y = 50; }
    else if (type === 'ocasion') { x = 80; y = 45; }
    else if (type === 'duelo') { x = 50; y = 40; }
    else if (type === 'nota') { x = 40; y = 85; }

    const base = loadedVideoUrl.split('?')[0].split('&')[0];
    const newUrlWithMetadata = `${base}?t=${seconds}&x=${x}&y=${y}`;

    const payload = {
      partido_id: matchId,
      youtube_url: newUrlWithMetadata,
      evento_tipo: type,
    };

    try {
      const { data, error } = await supabase
        .from('eventos_partido')
        .insert([payload])
        .select();

      if (error) throw error;
      if (data && data[0]) {
        setEvents(prev => [...prev, data[0]]);
        setSelectedEventId(data[0].id); // Auto-select to allow immediate placement
      }
    } catch (e) {
      console.error('Error registrando evento:', e);
      alert('Error al guardar el evento en Supabase.');
    }
  };

  const deleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details or seek on item click
    if (!confirm('¿Estás seguro de que deseas eliminar este evento del historial?')) return;
    
    try {
      const { error } = await supabase
        .from('eventos_partido')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEvents(prev => prev.filter(item => item.id !== id));
      if (selectedEventId === id) setSelectedEventId(null);
    } catch (err) {
      console.error('Error eliminando evento:', err);
      alert('Error al eliminar el evento.');
    }
  };

  // Update event coordinates when clicking on the soccer pitch
  const handlePitchClick = async (e: React.MouseEvent<SVGSVGElement>) => {
    if (!selectedEventId) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const targetEvent = events.find(item => item.id === selectedEventId);
    if (!targetEvent || !targetEvent.youtube_url) return;

    const secs = parseSecondsFromUrl(targetEvent.youtube_url);
    const base = targetEvent.youtube_url.split('?')[0].split('&')[0];
    const newUrlWithCoords = `${base}?t=${secs}&x=${clickX}&y=${clickY}`;

    try {
      const { data, error } = await supabase
        .from('eventos_partido')
        .update({ youtube_url: newUrlWithCoords })
        .eq('id', selectedEventId)
        .select();

      if (error) throw error;
      if (data && data[0]) {
        setEvents(prev => prev.map(item => item.id === selectedEventId ? data[0] : item));
      }
    } catch (err) {
      console.error('Error al actualizar las coordenadas:', err);
    }
  };

  /* ───── Data Exports ───── */

  const exportCSV = () => {
    if (events.length === 0) {
      alert('No hay eventos registrados para exportar.');
      return;
    }

    const sorted = [...events].sort((a, b) => 
      parseSecondsFromUrl(a.youtube_url || '') - parseSecondsFromUrl(b.youtube_url || '')
    );

    const csvHeaders = ['Minuto de Juego', 'Tiempo Video', 'Tipo de Evento', 'Coordenadas (X;Y)', 'URL del Video'];
    const csvRows = sorted.map(item => {
      const secs = parseSecondsFromUrl(item.youtube_url || '');
      const min = Math.floor(secs / 60);
      const videoTime = formatVideoTime(secs);
      const coords = parseCoordinatesFromUrl(item.youtube_url || '');
      const coordsStr = coords ? `${coords.x}%;${coords.y}%` : 'N/A';
      return [
        `"${min}'"`,
        `"${videoTime}"`,
        `"${item.evento_tipo?.toUpperCase()}"`,
        `"${coordsStr}"`,
        `"${item.youtube_url || ''}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [csvHeaders.join(','), ...csvRows].join('\n'); // Add BOM for excel accents
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `historial_partido_${matchId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = () => {
    if (events.length === 0) {
      alert('No hay eventos registrados para exportar.');
      return;
    }

    const sorted = [...events].sort((a, b) => 
      parseSecondsFromUrl(a.youtube_url || '') - parseSecondsFromUrl(b.youtube_url || '')
    );

    const jsonData = sorted.map(item => {
      const secs = parseSecondsFromUrl(item.youtube_url || '');
      const coords = parseCoordinatesFromUrl(item.youtube_url || '');
      return {
        id: item.id,
        partido_id: item.partido_id,
        tipo: item.evento_tipo,
        segundo_exacto: secs,
        minuto_partido: Math.floor(secs / 60),
        formato_tiempo: formatVideoTime(secs),
        coordenadas: coords ? { x: `${coords.x}%`, y: `${coords.y}%` } : null,
        url_reproduccion: item.youtube_url,
        creado_en: item.created_at,
      };
    });

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `historial_partido_${matchId}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ───── Processing & Filtering Data ───── */
  const filteredEvents = events
    .filter(item => {
      if (filterType === 'todos') return true;
      return item.evento_tipo === filterType;
    })
    .sort((a, b) => 
      parseSecondsFromUrl(a.youtube_url || '') - parseSecondsFromUrl(b.youtube_url || '')
    );

  // Stats for Gráficas
  const countByType = {
    gol: events.filter(e => e.evento_tipo === 'gol').length,
    ocasion: events.filter(e => e.evento_tipo === 'ocasion').length,
    duelo: events.filter(e => e.evento_tipo === 'duelo').length,
    nota: events.filter(e => e.evento_tipo === 'nota').length,
  };
  const totalEvents = events.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ========================================== */}
      {/* COLUMNA IZQUIERDA: CONTROLES E HISTORIAL   */}
      {/* ========================================== */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* TARJETA 1: URL DEL PARTIDO */}
        <div className="bg-white dark:bg-card-bg border border-slate-100 dark:border-card-border p-5 rounded-3xl shadow-xs flex flex-col gap-3">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Url del partido
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=... o vimeo..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
              className="flex-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple transition-all"
            />
            <button
              onClick={handleLoadVideo}
              className="bg-brand-purple hover:bg-brand-purple-dark text-white rounded-full w-10 h-10 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer select-none"
              title="Cargar Video"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
          </div>
        </div>

        {/* TARJETA 2: TIEMPOS DE PARTIDO (Collapsible) */}
        <div className="bg-white dark:bg-card-bg border border-slate-100 dark:border-card-border p-5 rounded-3xl shadow-xs flex flex-col gap-3 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Tiempos de partido
            </span>
            <button
              onClick={() => setShowTiempos(prev => !prev)}
              className="text-xs font-bold text-brand-purple hover:text-brand-purple-dark flex items-center gap-1 cursor-pointer select-none transition-colors"
            >
              {showTiempos ? 'Ocultar' : 'Mostrar'}
              {showTiempos ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          {showTiempos && (
            <div className="grid grid-cols-2 gap-3 pt-2 animate-fade-in">
              <button
                onClick={() => handleSeek(0)}
                disabled={!loadedVideoUrl}
                className="bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl py-2 px-3 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Inicio 1ª Parte (00:00)
              </button>
              <button
                onClick={() => handleSeek(2700)}
                disabled={!loadedVideoUrl}
                className="bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl py-2 px-3 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Inicio 2ª Parte (45:00)
              </button>
            </div>
          )}
        </div>

        {/* TARJETA 3: REGISTRAR EVENTO */}
        <div className="bg-white dark:bg-card-bg border border-slate-100 dark:border-card-border p-5 rounded-3xl shadow-xs flex flex-col gap-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Registrar evento
          </span>
          <div className="grid grid-cols-2 gap-3">
            {/* GOL */}
            <button
              onClick={() => registerEvent('gol')}
              disabled={!loadedVideoUrl}
              className="bg-red-600 dark:bg-red-655 hover:bg-red-700 dark:hover:bg-red-700 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-102 hover:shadow-md cursor-pointer disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed select-none"
            >
              <SoccerBallIcon />
              <span className="text-xs font-extrabold uppercase tracking-wide">Gol</span>
            </button>

            {/* OCASIÓN */}
            <button
              onClick={() => registerEvent('ocasion')}
              disabled={!loadedVideoUrl}
              className="bg-orange-500 dark:bg-orange-600 hover:bg-orange-600 dark:hover:bg-orange-700 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-102 hover:shadow-md cursor-pointer disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed select-none"
            >
              <Activity className="w-6 h-6 text-current stroke-[2.5]" />
              <span className="text-xs font-extrabold uppercase tracking-wide">Ocasión</span>
            </button>

            {/* DUELO */}
            <button
              onClick={() => registerEvent('duelo')}
              disabled={!loadedVideoUrl}
              className="bg-amber-400 dark:bg-amber-500 hover:bg-amber-550 dark:hover:bg-amber-600 text-slate-950 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-102 hover:shadow-md cursor-pointer disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed select-none"
            >
              <DueloIcon />
              <span className="text-xs font-extrabold uppercase tracking-wide">Duelo</span>
            </button>

            {/* NOTA */}
            <button
              onClick={() => registerEvent('nota')}
              disabled={!loadedVideoUrl}
              className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-102 hover:shadow-md cursor-pointer disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed select-none"
            >
              <FileText className="w-6 h-6 text-current stroke-[2.5]" />
              <span className="text-xs font-extrabold uppercase tracking-wide">Nota</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold flex items-center justify-center gap-1 py-1 border-t border-slate-100 dark:border-slate-800/40 mt-1">
            <span>Tiempo video:</span>
            <span className="text-slate-600 dark:text-slate-350 font-bold">{formatVideoTime(currentSecs)}</span>
            <span className="mx-1">•</span>
            <span>Partido:</span>
            <span className="text-slate-600 dark:text-slate-350 font-bold">{Math.floor(currentSecs / 60)}&apos;</span>
          </div>
        </div>

        {/* TARJETA 4: HISTORIAL */}
        <div className="bg-white dark:bg-card-bg border border-slate-100 dark:border-card-border p-5 rounded-3xl shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              Historial
            </h4>
            
            {/* View Sub-Tabs */}
            <div className="bg-slate-100 dark:bg-slate-900/60 p-0.5 rounded-xl flex">
              {(['lista', 'campo', 'graficas'] as const).map((view) => {
                const isActive = historyView === view;
                return (
                  <button
                    key={view}
                    onClick={() => setHistoryView(view)}
                    className={`
                      text-[10px] font-bold px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer select-none
                      ${isActive 
                        ? 'bg-white dark:bg-slate-800 text-brand-purple dark:text-white shadow-xs'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
                      }
                    `}
                  >
                    {view}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label Filters */}
          <div className="flex flex-wrap gap-1.5 py-1 border-b border-slate-50 dark:border-slate-800/20">
            {([
              { id: 'todos', label: 'Todos' },
              { id: 'gol', label: 'Gol' },
              { id: 'ocasion', label: 'Ocasión' },
              { id: 'duelo', label: 'Duelo' },
              { id: 'nota', label: 'Nota' }
            ] as const).map((pill) => {
              const isActive = filterType === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setFilterType(pill.id)}
                  className={`
                    text-[10px] font-extrabold px-3 py-1 rounded-full cursor-pointer transition-all select-none
                    ${isActive
                      ? 'bg-brand-purple text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }
                  `}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="flex-1 bg-slate-50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-150 dark:border-slate-850 text-slate-650 dark:text-slate-300 rounded-xl py-2 px-3 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
            <button
              onClick={downloadJSON}
              className="flex-1 bg-slate-50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-150 dark:border-slate-850 text-slate-650 dark:text-slate-300 rounded-xl py-2 px-3 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              Descargar JSON
            </button>
          </div>

          {/* Lower Area (Dynamic Listing based on View) */}
          <div className="min-h-[220px] max-h-[300px] overflow-y-auto pr-1">
            {isLoadingEvents ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-slate-300 dark:text-slate-700 text-3xl mb-1">⏱️</span>
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  Sin marcas registradas
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-550 max-w-[180px] mt-0.5">
                  Pulsa los botones superiores para registrar marcas.
                </span>
              </div>
            ) : (
              <>
                {/* VIEW: LISTA */}
                {historyView === 'lista' && (
                  <div className="flex flex-col gap-2">
                    {filteredEvents.map((item) => {
                      const secs = parseSecondsFromUrl(item.youtube_url || '');
                      const displayTime = formatVideoTime(secs);
                      const isSelected = selectedEventId === item.id;
                      
                      let badgeColor = '';
                      if (item.evento_tipo === 'gol') badgeColor = 'bg-red-500 text-white';
                      else if (item.evento_tipo === 'ocasion') badgeColor = 'bg-orange-500 text-white';
                      else if (item.evento_tipo === 'duelo') badgeColor = 'bg-amber-450 text-slate-900';
                      else badgeColor = 'bg-slate-700 text-white';

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedEventId(item.id);
                            handleSeek(secs);
                          }}
                          className={`
                            p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all hover:-translate-y-0.5 duration-200
                            ${isSelected
                              ? 'bg-brand-purple/5 border-brand-purple dark:bg-brand-purple/10'
                              : 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 w-10">
                              {displayTime}
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                              {Math.floor(secs / 60)}&apos;
                            </span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeColor}`}>
                              {item.evento_tipo === 'ocasion' ? 'Ocasión' : item.evento_tipo}
                            </span>
                          </div>
                          <button
                            onClick={(e) => deleteEvent(item.id, e)}
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

                {/* VIEW: CAMPO */}
                {historyView === 'campo' && (
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] text-center font-bold text-slate-400 dark:text-slate-550 italic">
                      {selectedEventId 
                        ? 'Haz clic en el campo para reubicar la marca seleccionada.'
                        : 'Selecciona una marca para reubicarla en el campo.'
                      }
                    </span>
                    <div className="relative aspect-[3/2] w-full rounded-2xl border border-slate-200 dark:border-slate-850 overflow-hidden bg-emerald-800 dark:bg-emerald-950 flex select-none">
                      {/* Football field markings in SVG */}
                      <svg 
                        className="absolute inset-0 w-full h-full text-white/20" 
                        viewBox="0 0 100 66" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="0.8"
                        onClick={handlePitchClick}
                      >
                        {/* Outer perimeter */}
                        <rect x="0.5" y="0.5" width="99" height="65" />
                        {/* Midfield line */}
                        <line x1="50" y1="0.5" x2="50" y2="65.5" />
                        {/* Center circle */}
                        <circle cx="50" cy="33" r="9.15" />
                        <circle cx="50" cy="33" r="0.8" fill="currentColor" />
                        
                        {/* Left box */}
                        <rect x="0.5" y="13.2" width="16.5" height="39.6" />
                        <rect x="0.5" y="24.2" width="5.5" height="17.6" />
                        <path d="M17,27.5 a 9.15 9.15 0 0 1 0,11" />
                        
                        {/* Right box */}
                        <rect x="83" y="13.2" width="16.5" height="39.6" />
                        <rect x="94" y="24.2" width="5.5" height="17.6" />
                        <path d="M83,27.5 a 9.15 9.15 0 0 0 0,11" />

                        {/* Penalty dots */}
                        <circle cx="11" cy="33" r="0.5" fill="currentColor" />
                        <circle cx="89" cy="33" r="0.5" fill="currentColor" />
                      </svg>

                      {/* Display Event dots */}
                      {filteredEvents.map((item) => {
                        const coords = parseCoordinatesFromUrl(item.youtube_url || '');
                        if (!coords) return null;

                        const isSelected = selectedEventId === item.id;
                        const secs = parseSecondsFromUrl(item.youtube_url || '');
                        
                        let dotColor = 'bg-slate-700';
                        if (item.evento_tipo === 'gol') dotColor = 'bg-red-500 ring-white';
                        else if (item.evento_tipo === 'ocasion') dotColor = 'bg-orange-500 ring-white';
                        else if (item.evento_tipo === 'duelo') dotColor = 'bg-amber-400 ring-slate-900';

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedEventId(item.id);
                              handleSeek(secs);
                            }}
                            style={{
                              left: `${coords.x}%`,
                              top: `${coords.y}%`,
                              transform: 'translate(-50%, -50%)',
                            }}
                            className={`
                              absolute w-5 h-5 rounded-full ring-2 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-125 hover:z-10
                              ${dotColor}
                              ${isSelected ? 'ring-brand-purple scale-120 animate-pulse border border-white' : 'ring-opacity-40'}
                            `}
                            title={`${item.evento_tipo?.toUpperCase()} - Min ${Math.floor(secs / 60)}'`}
                          >
                            <span className="text-[7.5px] font-black text-inherit select-none">
                              {Math.floor(secs / 60)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* VIEW: GRÁFICAS */}
                {historyView === 'graficas' && (
                  <div className="flex flex-col gap-5 pt-1">
                    {/* Event Timeline (0' to 90') */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                        Línea de Tiempo del Partido (0&apos; - 90&apos;)
                      </span>
                      <div className="relative h-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg flex items-center">
                        {/* Halftime border */}
                        <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-slate-300 dark:border-slate-700"></div>
                        
                        {/* Event marks */}
                        {filteredEvents.map((item) => {
                          const secs = parseSecondsFromUrl(item.youtube_url || '');
                          const min = Math.floor(secs / 60);
                          const isSelected = selectedEventId === item.id;
                          const ratio = Math.min((min / 90) * 100, 100);

                          let markColor = 'bg-slate-700';
                          if (item.evento_tipo === 'gol') markColor = 'bg-red-500';
                          else if (item.evento_tipo === 'ocasion') markColor = 'bg-orange-500';
                          else if (item.evento_tipo === 'duelo') markColor = 'bg-amber-400';

                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setSelectedEventId(item.id);
                                handleSeek(secs);
                              }}
                              style={{ left: `${ratio}%` }}
                              className={`
                                absolute w-2.5 h-4 -translate-x-1/2 rounded-xs transition-all hover:h-5 cursor-pointer
                                ${markColor}
                                ${isSelected ? 'ring-2 ring-brand-purple z-10 scale-125' : ''}
                              `}
                              title={`${item.evento_tipo?.toUpperCase()} - Min ${min}'`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[8px] font-bold text-slate-400 px-1">
                        <span>0&apos;</span>
                        <span>MT</span>
                        <span>90&apos;+</span>
                      </div>
                    </div>

                    {/* Frequencies Bar Chart */}
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                        Frecuencia de marcas
                      </span>
                      
                      <div className="flex flex-col gap-2.5">
                        {([
                          { id: 'gol', label: 'Gol', colorClass: 'bg-red-500', count: countByType.gol },
                          { id: 'ocasion', label: 'Ocasión', colorClass: 'bg-orange-500', count: countByType.ocasion },
                          { id: 'duelo', label: 'Duelo', colorClass: 'bg-amber-400', count: countByType.duelo },
                          { id: 'nota', label: 'Nota', colorClass: 'bg-slate-750 dark:bg-slate-600', count: countByType.nota },
                        ] as const).map((stat) => {
                          const percentage = totalEvents > 0 ? (stat.count / totalEvents) * 100 : 0;
                          return (
                            <div key={stat.id} className="flex items-center text-xs gap-3">
                              <span className="w-14 font-extrabold text-[10px] text-slate-550 uppercase tracking-wide">
                                {stat.label}
                              </span>
                              <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 h-3 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${percentage}%` }}
                                  className={`h-full ${stat.colorClass} transition-all duration-500 rounded-full`}
                                />
                              </div>
                              <span className="w-6 text-right font-black text-slate-700 dark:text-slate-300 text-[10px]">
                                {stat.count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* COLUMNA DERECHA: REPRODUCTOR DE VÍDEO      */}
      {/* ========================================== */}
      <div className="lg:col-span-7">
        <div className="bg-white dark:bg-card-bg border border-slate-100 dark:border-card-border p-6 rounded-3xl shadow-sm min-h-[440px] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/40 pb-3 mb-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Video className="w-4 h-4 text-brand-purple" />
              Reproductor del Partido
            </h3>
            {loadedVideoUrl && (
              <span className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-900 text-slate-450 dark:text-slate-550 px-2 py-0.5 rounded-md">
                {playerType === 'youtube' ? 'YouTube' : 'Vimeo'}
              </span>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center">
            {loadedVideoUrl ? (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-slate-850 shadow-inner relative">
                <div id="media-player-container" className="w-full h-full">
                  {/* Iframe dynamic target */}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-150 dark:border-slate-850 rounded-2xl w-full aspect-video bg-slate-50/20 max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-900/60 flex items-center justify-center mb-4 text-slate-350 dark:text-slate-650">
                  <Video className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Introduce la URL de Vimeo para cargar el vídeo
                </h4>
                <p className="text-xs text-slate-450 dark:text-slate-500 max-w-sm">
                  Ejemplo: https://vimeo.com/123456789 o una URL de YouTube válida
                </p>
              </div>
            )}
          </div>
          
          <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-bold mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/40">
            {loadedVideoUrl ? (
              <span>Vinculado con la API de sincronización multimedia</span>
            ) : (
              <span>Introduce un enlace arriba para activar el reproductor interactivo</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
