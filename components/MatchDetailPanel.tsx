'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  Calendar,
  Clock,
  Save,
  Loader2,
  ArrowLeft,
  FileText,
  Video,
  Target,
  ShieldAlert,
  Zap,
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  equipo_local?: Team;
  equipo_visitante?: Team;
}

interface InformeRival {
  id?: string;
  partido_id: string;
  google_slides_url: string | null;
  youtube_video_url: string | null;
}

interface PlanPartido {
  id?: string;
  partido_id: string;
  bloque: string;
  texto_abierto: string | null;
  youtube_url: string | null;
  imagenes_urls: string[] | null;
}

/* ───── YouTube helpers ───── */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

/* ───── Google Slides helper ───── */
function getSlidesEmbedUrl(url: string): string | null {
  if (!url) return null;
  // If already an embed URL, return as-is
  if (url.includes('/embed')) return url;
  // Convert /edit or /pub URL to /embed
  const match = url.match(
    /docs\.google\.com\/presentation\/d\/([\w-]+)/
  );
  if (match) {
    return `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000`;
  }
  return url;
}

/* ───── Date helpers ───── */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Sin fecha';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return '';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}h`;
}

/* ───── Plan tabs config ───── */
const PLAN_TABS = [
  { id: 'ataque', label: 'Ataque', icon: Target, emoji: '⚽' },
  { id: 'defensa', label: 'Defensa', icon: ShieldAlert, emoji: '🛡️' },
  { id: 'transiciones', label: 'Transiciones', icon: Zap, emoji: '⚡' },
] as const;

type PlanTabId = (typeof PLAN_TABS)[number]['id'];

/* ════════════════════════════════════════════════════════════ */
export default function MatchDetailPanel({
  matchId,
}: {
  matchId: string;
}) {
  /* ── State ── */
  const [partido, setPartido] = useState<Partido | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Main section toggle
  const [activeSection, setActiveSection] = useState<'informe' | 'plan'>(
    'informe'
  );

  // Informe Rival
  const [informe, setInforme] = useState<InformeRival>({
    partido_id: matchId,
    google_slides_url: null,
    youtube_video_url: null,
  });
  const [slidesInput, setSlidesInput] = useState('');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [isSavingInforme, setIsSavingInforme] = useState(false);
  const [informeSaved, setInformeSaved] = useState(false);

  // Plan de Partido
  const [activePlanTab, setActivePlanTab] = useState<PlanTabId>('ataque');
  const [planData, setPlanData] = useState<Record<PlanTabId, PlanPartido>>({
    ataque: {
      partido_id: matchId,
      bloque: 'ataque',
      texto_abierto: '',
      youtube_url: '',
      imagenes_urls: [],
    },
    defensa: {
      partido_id: matchId,
      bloque: 'defensa',
      texto_abierto: '',
      youtube_url: '',
      imagenes_urls: [],
    },
    transiciones: {
      partido_id: matchId,
      bloque: 'transiciones',
      texto_abierto: '',
      youtube_url: '',
      imagenes_urls: [],
    },
  });
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);

  // Image upload refs
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);

  /* ── Load partido ── */
  const loadPartido = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('partidos')
        .select(
          `
          *,
          equipo_local:equipos!equipo_local_id ( id, nombre, escudo_url ),
          equipo_visitante:equipos!equipo_visitante_id ( id, nombre, escudo_url )
        `
        )
        .eq('id', matchId)
        .single();

      if (error) throw error;
      setPartido(data as Partido);
    } catch (err) {
      console.error('Error cargando partido:', err);
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  /* ── Load informe ── */
  const loadInforme = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('informes_rival')
        .select('*')
        .eq('partido_id', matchId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setInforme(data as InformeRival);
        setSlidesInput(data.google_slides_url || '');
        setYoutubeInput(data.youtube_video_url || '');
      }
    } catch (err) {
      console.error('Error cargando informe:', err);
    }
  }, [matchId]);

  /* ── Load plan ── */
  const loadPlan = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('plan_partido')
        .select('*')
        .eq('partido_id', matchId);

      if (error) throw error;
      if (data && data.length > 0) {
        const updated = { ...planData };
        for (const row of data) {
          const bloque = row.bloque as PlanTabId;
          if (bloque && updated[bloque]) {
            updated[bloque] = {
              ...updated[bloque],
              id: row.id,
              texto_abierto: row.texto_abierto || '',
              youtube_url: row.youtube_url || '',
              imagenes_urls: row.imagenes_urls || [],
            };
          }
        }
        setPlanData(updated);
      }
    } catch (err) {
      console.error('Error cargando plan:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    loadPartido();
    loadInforme();
    loadPlan();
  }, [loadPartido, loadInforme, loadPlan]);

  /* ── Save informe ── */
  const saveInforme = async () => {
    setIsSavingInforme(true);
    setInformeSaved(false);
    try {
      const payload = {
        partido_id: matchId,
        google_slides_url: slidesInput || null,
        youtube_video_url: youtubeInput || null,
      };

      if (informe.id) {
        const { error } = await supabase
          .from('informes_rival')
          .update(payload)
          .eq('id', informe.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('informes_rival')
          .insert([payload])
          .select();
        if (error) throw error;
        if (data && data[0]) {
          setInforme({ ...payload, id: data[0].id });
        }
      }
      setInformeSaved(true);
      setTimeout(() => setInformeSaved(false), 2000);
    } catch (err) {
      console.error('Error guardando informe:', err);
      alert('Error al guardar el informe de rival.');
    } finally {
      setIsSavingInforme(false);
    }
  };

  /* ── Save plan ── */
  const savePlan = async () => {
    setIsSavingPlan(true);
    setPlanSaved(false);
    try {
      for (const tab of PLAN_TABS) {
        const block = planData[tab.id];
        const payload = {
          partido_id: matchId,
          bloque: tab.id,
          texto_abierto: block.texto_abierto || null,
          youtube_url: block.youtube_url || null,
          imagenes_urls: block.imagenes_urls || [],
        };

        if (block.id) {
          const { error } = await supabase
            .from('plan_partido')
            .update(payload)
            .eq('id', block.id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from('plan_partido')
            .insert([payload])
            .select();
          if (error) throw error;
          if (data && data[0]) {
            setPlanData((prev) => ({
              ...prev,
              [tab.id]: { ...prev[tab.id], id: data[0].id },
            }));
          }
        }
      }
      setPlanSaved(true);
      setTimeout(() => setPlanSaved(false), 2000);
    } catch (err) {
      console.error('Error guardando plan:', err);
      alert('Error al guardar el plan de partido.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  /* ── Image upload ── */
  const handleImageUpload = async (
    tabId: PlanTabId,
    slotIndex: number,
    file: File
  ) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${matchId}_${tabId}_${slotIndex}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('IMAGENES TACTICAS')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('IMAGENES TACTICAS')
        .getPublicUrl(fileName);

      const newUrls = [...(planData[tabId].imagenes_urls || [])];
      // Pad array to 3
      while (newUrls.length < 3) newUrls.push('');
      newUrls[slotIndex] = data.publicUrl;

      setPlanData((prev) => ({
        ...prev,
        [tabId]: { ...prev[tabId], imagenes_urls: newUrls },
      }));
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      alert('Error al subir la imagen.');
    }
  };

  const removeImage = (tabId: PlanTabId, slotIndex: number) => {
    const newUrls = [...(planData[tabId].imagenes_urls || [])];
    newUrls[slotIndex] = '';
    setPlanData((prev) => ({
      ...prev,
      [tabId]: { ...prev[tabId], imagenes_urls: newUrls },
    }));
  };

  /* ── Update plan field ── */
  const updatePlanField = (
    tabId: PlanTabId,
    field: 'texto_abierto' | 'youtube_url',
    value: string
  ) => {
    setPlanData((prev) => ({
      ...prev,
      [tabId]: { ...prev[tabId], [field]: value },
    }));
  };

  /* ════════════════════ RENDER ════════════════════ */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    );
  }

  if (!partido) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-slate-500 text-sm font-semibold">
          Partido no encontrado.
        </p>
        <Link
          href="/partidos"
          className="text-brand-purple font-bold text-sm hover:underline"
        >
          ← Volver a Partidos
        </Link>
      </div>
    );
  }

  const currentPlan = planData[activePlanTab];
  const slidesEmbed = getSlidesEmbedUrl(slidesInput);
  const youtubeEmbed = getYouTubeEmbedUrl(youtubeInput);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ───── Back link ───── */}
      <Link
        href="/partidos"
        className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-brand-purple transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Partidos
      </Link>

      {/* ───── Match Header Card ───── */}
      <div className="bg-card-bg border border-card-border p-6 rounded-3xl shadow-xs transition-colors duration-300">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Matchup */}
          <div className="flex items-center gap-5">
            {/* Local */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-center p-2">
                {partido.equipo_local?.escudo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={partido.equipo_local.escudo_url}
                    alt={partido.equipo_local.nombre}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Shield className="w-8 h-8 text-brand-purple stroke-[1.5px]" />
                )}
              </div>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-center">
                {partido.equipo_local?.nombre || 'Local'}
              </span>
            </div>

            <span className="text-2xl font-black text-slate-300 dark:text-slate-700 tracking-widest select-none">
              VS
            </span>

            {/* Visitante */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-center p-2">
                {partido.equipo_visitante?.escudo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={partido.equipo_visitante.escudo_url}
                    alt={partido.equipo_visitante.nombre}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Shield className="w-8 h-8 text-brand-purple stroke-[1.5px]" />
                )}
              </div>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-center">
                {partido.equipo_visitante?.nombre || 'Visitante'}
              </span>
            </div>
          </div>

          {/* Date info */}
          <div className="flex flex-col items-end gap-1.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(partido.fecha)}
            </span>
            {formatTime(partido.fecha) && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(partido.fecha)}
              </span>
            )}
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800/60 mt-6 pt-5">
          {[
            {
              id: 'informe' as const,
              label: 'Informe de Rival',
              icon: FileText,
            },
            {
              id: 'plan' as const,
              label: 'Plan de Partido',
              icon: Target,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`
                  flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer select-none
                  ${
                    isActive
                      ? 'bg-brand-purple text-white shadow-md'
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

      {/* ═══════════════════════════════════════════════ */}
      {/* INFORME DE RIVAL                                */}
      {/* ═══════════════════════════════════════════════ */}
      {activeSection === 'informe' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Google Slides */}
          <div className="bg-card-bg border border-card-border p-6 rounded-3xl shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Presentación Google Slides
              </h3>
            </div>

            <div className="relative">
              <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pega el enlace de Google Slides…"
                value={slidesInput}
                onChange={(e) => setSlidesInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple transition-all"
              />
            </div>

            {slidesEmbed ? (
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <iframe
                  src={slidesEmbed}
                  className="w-full h-full"
                  allowFullScreen
                  title="Google Slides"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-2xl bg-slate-100/50 dark:bg-slate-900/60 flex items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-400 max-w-xs">
                  Introduce el enlace de Google Slides para previsualizarlo aquí
                </span>
              </div>
            )}
          </div>

          {/* YouTube Video */}
          <div className="bg-card-bg border border-card-border p-6 rounded-3xl shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Vídeo YouTube
              </h3>
            </div>

            <div className="relative">
              <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pega el enlace de YouTube…"
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple transition-all"
              />
            </div>

            {youtubeEmbed ? (
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <iframe
                  src={youtubeEmbed}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube Video"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-2xl bg-slate-100/50 dark:bg-slate-900/60 flex items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-400 max-w-xs">
                  Introduce el enlace de YouTube para previsualizarlo aquí
                </span>
              </div>
            )}
          </div>

          {/* Save button full-width */}
          <div className="lg:col-span-2 flex justify-end">
            <button
              onClick={saveInforme}
              disabled={isSavingInforme}
              className="flex items-center gap-2 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-md cursor-pointer disabled:cursor-not-allowed disabled:bg-brand-purple/40"
            >
              {isSavingInforme ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando…
                </>
              ) : informeSaved ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  ¡Guardado!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Informe de Rival
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* PLAN DE PARTIDO                                */}
      {/* ═══════════════════════════════════════════════ */}
      {activeSection === 'plan' && (
        <div className="flex flex-col gap-6">
          {/* Plan Tab Selector */}
          <div className="flex justify-center bg-card-bg border border-card-border p-2 rounded-2xl max-w-lg mx-auto shadow-xs">
            {PLAN_TABS.map((tab) => {
              const isActive = activePlanTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePlanTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-black cursor-pointer select-none transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-purple text-white shadow-md'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span className="text-base">{tab.emoji}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active tab content */}
          <div className="bg-card-bg border border-card-border rounded-3xl shadow-xs overflow-hidden">
            {/* Tab header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3">
              <span className="text-2xl">
                {PLAN_TABS.find((t) => t.id === activePlanTab)?.emoji}
              </span>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
                  Bloque
                </span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-lg leading-tight uppercase">
                  {PLAN_TABS.find((t) => t.id === activePlanTab)?.label}
                </span>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-6">
              {/* Textarea */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Notas y Anotaciones
                </label>
                <textarea
                  placeholder={`Escribe tu análisis de ${activePlanTab}…`}
                  rows={6}
                  value={currentPlan.texto_abierto || ''}
                  onChange={(e) =>
                    updatePlanField(
                      activePlanTab,
                      'texto_abierto',
                      e.target.value
                    )
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple resize-none transition-all"
                />
              </div>

              {/* YouTube video */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Vídeo Táctico (YouTube)
                </label>
                <div className="relative">
                  <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="https://youtube.com/watch?v=…"
                    value={currentPlan.youtube_url || ''}
                    onChange={(e) =>
                      updatePlanField(
                        activePlanTab,
                        'youtube_url',
                        e.target.value
                      )
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/40 focus:border-brand-purple transition-all"
                  />
                </div>

                {getYouTubeEmbedUrl(currentPlan.youtube_url || '') ? (
                  <div className="aspect-video w-full max-w-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 mt-2">
                    <iframe
                      src={getYouTubeEmbedUrl(currentPlan.youtube_url || '')!}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`Video ${activePlanTab}`}
                    />
                  </div>
                ) : (
                  currentPlan.youtube_url && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Introduce una URL de YouTube válida para visualizar el
                      reproductor.
                    </p>
                  )
                )}
              </div>

              {/* Images (3 slots) */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Imágenes Explicativas (máx. 3)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[0, 1, 2].map((slotIndex) => {
                    const urls = currentPlan.imagenes_urls || [];
                    const imgUrl = urls[slotIndex] || '';

                    return (
                      <div
                        key={slotIndex}
                        className="relative group aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center overflow-hidden transition-all hover:border-brand-purple/40"
                      >
                        {imgUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgUrl}
                              alt={`Imagen ${slotIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {/* Remove button */}
                            <button
                              onClick={() =>
                                removeImage(activePlanTab, slotIndex)
                              }
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              fileInputRefs.current[slotIndex]?.click()
                            }
                            className="flex flex-col items-center gap-2 text-slate-400 hover:text-brand-purple transition-colors cursor-pointer p-4"
                          >
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <Upload className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              Imagen {slotIndex + 1}
                            </span>
                          </button>
                        )}

                        <input
                          type="file"
                          ref={(el) => {
                            fileInputRefs.current[slotIndex] = el;
                          }}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(
                                activePlanTab,
                                slotIndex,
                                file
                              );
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Save plan button */}
          <div className="flex justify-end">
            <button
              onClick={savePlan}
              disabled={isSavingPlan}
              className="flex items-center gap-2 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-md cursor-pointer disabled:cursor-not-allowed disabled:bg-brand-purple/40"
            >
              {isSavingPlan ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando…
                </>
              ) : planSaved ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  ¡Guardado!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Plan de Partido
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
