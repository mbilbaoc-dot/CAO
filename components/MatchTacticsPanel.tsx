'use client';

import React, { useState, useEffect } from 'react';
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
  Compass
} from 'lucide-react';

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

  // Event logger state (Eventos)
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=demo-match');
  const [eventLogs, setEventLogs] = useState<EventLog[]>([
    { id: '1', type: 'GOL', time: '18\'', videoTime: '0:18', detail: 'Gol de Guruzeta tras asistencia en profundidad' },
    { id: '2', type: 'OCASIÓN', time: '35\'', videoTime: '0:35', detail: 'Remate al larguero de Nico Williams' },
    { id: '3', type: 'DUELO', time: '41\'', videoTime: '0:41', detail: 'Duelo aéreo ganado por Vivian en defensa' }
  ]);
  const [currentVideoTime, setCurrentVideoTime] = useState('0:00');
  const [matchMinutes, setMatchMinutes] = useState(0);

  // ABP set pieces state
  const [abpType, setAbpType] = useState<'OFENSIVO' | 'DEFENSIVO'>('OFENSIVO');

  // Load appropriate initial tab
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  // Add event log
  const addEventLog = (type: 'GOL' | 'OCASIÓN' | 'DUELO' | 'NOTA') => {
    const timeFormatted = `${matchMinutes}'`;
    const detailsMap = {
      GOL: 'Registro de gol a favor / contra',
      OCASIÓN: 'Ocasión de peligro registrada',
      DUELO: 'Duelo defensivo/ofensivo registrado',
      NOTA: 'Anotación táctica rápida en el vídeo'
    };

    const newLog: EventLog = {
      id: Date.now().toString(),
      type,
      time: timeFormatted,
      videoTime: `0:${matchMinutes < 10 ? '0' + matchMinutes : matchMinutes}`,
      detail: detailsMap[type]
    };

    setEventLogs([newLog, ...eventLogs]);
    setMatchMinutes(prev => (prev + 3) % 90); // Increment minutes for demo
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Match Meta Card */}
      <div className="bg-card-bg border border-card-border p-6 rounded-3xl shadow-xs transition-colors duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>Amistoso</span>
              <span>•</span>
              <Calendar className="w-3.5 h-3.5" />
              <span>2026-02-05</span>
              <span>•</span>
              <MapPin className="w-3.5 h-3.5" />
              <span>LEZAMA</span>
            </span>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">ATHLETIC</span>
              <span className="text-sm font-semibold text-slate-400 dark:text-slate-600">vs</span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">ESPANYOL</span>
            </div>
          </div>
          
          <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all duration-200 cursor-pointer">
            <Save className="w-4 h-4" />
            Guardar información
          </button>
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
            {/* ABP sub-tabs */}
            <div className="flex justify-center bg-card-bg border border-card-border p-2 rounded-2xl max-w-sm mx-auto shadow-xs">
              {['OFENSIVO', 'DEFENSIVO'].map(type => (
                <button
                  key={type}
                  onClick={() => setAbpType(type as any)}
                  className={`flex-1 px-4 py-2 rounded-xl text-xs font-black cursor-pointer select-none transition-all ${
                    abpType === type
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-xs'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="text-center">
              <span className="text-xs font-black tracking-widest text-slate-400 uppercase">Córners</span>
            </div>

            {/* Corners columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(num => (
                <div key={num} className="bg-card-bg border border-card-border rounded-3xl p-5 shadow-xs flex flex-col gap-4">
                  <div className="text-center font-extrabold text-sm text-slate-900 dark:text-slate-100 border-b border-card-border pb-2">
                    CÓRNER {num}
                  </div>

                  {/* Image 1 file select */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Imagen 1</span>
                    <div className="flex items-center justify-between gap-2 p-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-[10px] font-medium cursor-pointer">
                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">Seleccionar archivo</span>
                      <span className="text-slate-400 truncate w-24">Ning...nado</span>
                    </div>
                  </div>

                  {/* Detail input */}
                  <div className="flex flex-col gap-1">
                    <input
                      type="text"
                      placeholder="Detalle imagen 1..."
                      className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Video URL */}
                  <div className="flex flex-col gap-1">
                    <input
                      type="text"
                      placeholder="URL Vimeo imagen 1..."
                      className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Image 2 file select */}
                  <div className="flex flex-col gap-1 border-t border-slate-100 dark:border-slate-850 pt-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Imagen 2</span>
                    <div className="flex items-center justify-between gap-2 p-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-[10px] font-medium cursor-pointer">
                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">Seleccionar archivo</span>
                      <span className="text-slate-400 truncate w-24">Ning...nado</span>
                    </div>
                  </div>

                  {/* Detail 2 */}
                  <div className="flex flex-col gap-1">
                    <input
                      type="text"
                      placeholder="Detalle imagen 2..."
                      className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: EVENTOS (REAL-TIME EVENTS LOGGER) */}
        {activeTab === 'eventos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Column: Actions and logger (Col span 1) */}
            <div className="flex flex-col gap-6">
              {/* URL card */}
              <div className="bg-card-bg border border-card-border p-6 rounded-3xl shadow-xs">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-2">URL del Partido</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                  <button className="w-10 h-10 bg-brand-purple hover:bg-brand-purple-dark text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-sm shrink-0">
                    <Play className="w-4 h-4 fill-white" />
                  </button>
                </div>
              </div>

              {/* Action event logging */}
              <div className="bg-card-bg border border-card-border p-6 rounded-3xl shadow-xs flex flex-col gap-4">
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block mb-1">Registrar Evento</label>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => addEventLog('GOL')}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer select-none transition-transform active:scale-95"
                  >
                    ⚽ GOL
                  </button>
                  <button 
                    onClick={() => addEventLog('OCASIÓN')}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer select-none transition-transform active:scale-95"
                  >
                    🎯 OCASIÓN
                  </button>
                  <button 
                    onClick={() => addEventLog('DUELO')}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer select-none transition-transform active:scale-95"
                  >
                    ⚔️ DUELO
                  </button>
                  <button 
                    onClick={() => addEventLog('NOTA')}
                    className="bg-slate-650 hover:bg-slate-700 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer select-none transition-transform active:scale-95"
                  >
                    📝 NOTA
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 border-t border-slate-100 dark:border-slate-850 pt-4 mt-2 text-xs font-semibold text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>Tiempo video: <strong className="text-slate-800 dark:text-slate-200">{currentVideoTime}</strong></span>
                  <span>•</span>
                  <span>Partido: <strong className="text-slate-800 dark:text-slate-200">{matchMinutes}'</strong></span>
                </div>
              </div>

              {/* Logs history */}
              <div className="bg-card-bg border border-card-border p-6 rounded-3xl shadow-xs flex flex-col gap-4 flex-1">
                <div className="flex items-center justify-between border-b border-card-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-400 uppercase">Historial</span>
                    <span className="text-[10px] bg-brand-purple/20 text-brand-purple px-2 py-0.5 rounded font-bold">Lista</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button className="text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer">CSV</button>
                    <button className="text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer">JSON</button>
                  </div>
                </div>

                <div className="h-64 overflow-y-auto flex flex-col gap-3 pr-1">
                  {eventLogs.map((log) => {
                    const badgeColor = {
                      GOL: 'bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
                      OCASIÓN: 'bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-450',
                      DUELO: 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450',
                      NOTA: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }[log.type];

                    return (
                      <div 
                        key={log.id}
                        className="flex gap-3 p-3 rounded-2xl border border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors animate-slide-in"
                      >
                        <span className={`h-fit text-[9px] font-black px-2 py-0.5 rounded ${badgeColor} shrink-0`}>
                          {log.type}
                        </span>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">
                            {log.detail}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold leading-none">
                            Tiempo: {log.time} • Vídeo: {log.videoTime}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Video player placeholder (Col span 2) */}
            <div className="lg:col-span-2 bg-card-bg border border-card-border rounded-3xl overflow-hidden flex flex-col shadow-xs">
              <div className="flex-1 min-h-[380px] bg-slate-950 flex flex-col items-center justify-center p-8 text-center gap-4 relative group">
                {/* Simulated video playback screen */}
                <div className="w-16 h-16 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center backdrop-blur-xs transition-all duration-300 cursor-pointer">
                  <Play className="w-6 h-6 fill-white text-white ml-1 translate-x-0.5" />
                </div>
                
                <div className="flex flex-col max-w-sm">
                  <span className="text-sm font-bold text-white leading-normal">
                    Introduce la URL de Vimeo para cargar el vídeo
                  </span>
                  <span className="text-xs text-slate-450 leading-relaxed mt-1">
                    Ejemplo: https://vimeo.com/123456789
                  </span>
                </div>

                {/* Simulated playback bar bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-4 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Play className="w-4 h-4 fill-white" />
                  <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div className="w-1/3 h-full bg-brand-purple" />
                  </div>
                  <span>{currentVideoTime} / 45:00</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
