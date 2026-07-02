'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { FORMATIONS } from '@/lib/formations';

interface TacticalAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  miSistema: string;
}

interface AnalysisResult {
  ventajas: string[];
  desventajas: string[];
  estrategia: string;
}

export default function TacticalAnalysisModal({ isOpen, onClose, miSistema }: TacticalAnalysisModalProps) {
  const [sistemaRival, setSistemaRival] = useState('4-4-2');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analizar-tactica', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ miSistema, sistemaRival }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener el análisis.');
      }

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error desconocido.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
  };

  const handleClose = () => {
    resetAnalysis();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-violet-50/50 to-transparent dark:from-violet-950/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-violet-100 dark:bg-violet-900/40 rounded-xl">
                    <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">
                      Análisis con IA
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 font-medium">
                      Descubre ventajas tácticas para este enfrentamiento.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 md:p-6 overflow-y-auto">
                {!result && !isLoading && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Mi Sistema */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Mi Sistema (Configurado)
                        </label>
                        <div className="text-xl font-black text-slate-800 dark:text-slate-200">
                          {miSistema}
                        </div>
                      </div>

                      {/* Sistema Rival */}
                      <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
                        <label className="block text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-2">
                          Sistema Probable del Rival
                        </label>
                        <select
                          value={sistemaRival}
                          onChange={(e) => setSistemaRival(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
                        >
                          {FORMATIONS.map((f) => (
                            <option key={f.name} value={f.name}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-xl font-medium flex items-start gap-2 border border-red-100 dark:border-red-900/30">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <p>{error}</p>
                      </div>
                    )}
                  </div>
                )}

                {isLoading && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-violet-400/20 blur-xl rounded-full" />
                      <Loader2 className="w-10 h-10 text-violet-500 animate-spin relative z-10" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 animate-pulse">
                      La IA está analizando los sistemas tácticos...
                    </p>
                    
                    {/* Shimmer skeleton for content anticipation */}
                    <div className="w-full max-w-md mt-6 space-y-3">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-3/4 mx-auto" />
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-1/2 mx-auto" />
                    </div>
                  </div>
                )}

                {result && !isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                  >
                    {/* Enfrentamiento badge */}
                    <div className="flex items-center justify-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 py-2 px-4 rounded-full w-fit mx-auto">
                      <span>{miSistema}</span>
                      <span className="text-slate-400 font-normal">vs</span>
                      <span>{sistemaRival}</span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Ventajas */}
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-2xl">
                        <h3 className="flex items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-400 mb-3">
                          <CheckCircle2 className="w-4 h-4" />
                          VENTAJAS TÁCTICAS
                        </h3>
                        <ul className="space-y-2.5">
                          {result.ventajas.map((v, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                              <span className="text-emerald-500 font-black mt-0.5">•</span>
                              <span className="leading-snug">{v}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Desventajas */}
                      <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl">
                        <h3 className="flex items-center gap-2 text-sm font-black text-red-600 dark:text-red-400 mb-3">
                          <AlertTriangle className="w-4 h-4" />
                          RIESGOS A CONSIDERAR
                        </h3>
                        <ul className="space-y-2.5">
                          {result.desventajas.map((d, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                              <span className="text-red-500 font-black mt-0.5">•</span>
                              <span className="leading-snug">{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Estrategia clave */}
                    <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-[1px] rounded-2xl shadow-lg">
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-[15px]">
                        <h3 className="flex items-center gap-2 text-sm font-black text-violet-600 dark:text-violet-400 mb-2">
                          <Lightbulb className="w-4 h-4" />
                          RECOMENDACIÓN ESTRATÉGICA
                        </h3>
                        <p className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                          {result.estrategia}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 md:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                {result ? (
                  <>
                    <button
                      onClick={resetAnalysis}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Analizar otro sistema
                    </button>
                    <button
                      onClick={handleClose}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 transition-all active:scale-95"
                    >
                      Entendido
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleClose}
                      disabled={isLoading}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAnalyze}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generar Análisis
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
