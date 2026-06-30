'use client';

import React from 'react';
import { User, Check } from 'lucide-react';

interface Player {
  id: string;
  nombre: string;
  dorsal: number | null;
  demarcacion: string | null;
  foto_url: string | null;
}

interface PlayerCardProps {
  player: Player;
  isPlaced: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onDragStart: (e: React.DragEvent, player: Player) => void;
}

const DEMARCACION_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Portero:        { bg: 'bg-amber-150 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500' },
  Defensa:        { bg: 'bg-sky-150 dark:bg-sky-950/40', text: 'text-sky-800 dark:text-sky-300', dot: 'bg-sky-500' },
  Centrocampista: { bg: 'bg-emerald-150 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500' },
  Delantero:      { bg: 'bg-rose-150 dark:bg-rose-950/40', text: 'text-rose-800 dark:text-rose-300', dot: 'bg-rose-500' },
};

export default function PlayerCard({ player, isPlaced, isSelected, onClick, onDragStart }: PlayerCardProps) {
  const colors = player.demarcacion ? DEMARCACION_COLORS[player.demarcacion] : null;

  return (
    <div
      draggable={!isPlaced}
      onDragStart={(e) => onDragStart(e, player)}
      onClick={() => {
        if (!isPlaced && onClick) onClick();
      }}
      className={`
        flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 select-none relative overflow-hidden
        ${isPlaced
          ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/20'
          : isSelected
            ? 'cursor-pointer border-violet-500 dark:border-violet-400 ring-2 ring-violet-500/40 dark:ring-violet-400/40 bg-violet-50/50 dark:bg-violet-950/20 shadow-md -translate-y-0.5'
            : 'cursor-grab active:cursor-grabbing border-slate-200 dark:border-slate-800/80 bg-card-bg hover:border-brand-purple/40 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]'
        }
      `}
    >
      {/* Placed badge watermark */}
      {isPlaced && (
        <div className="absolute right-3 top-3 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
          <Check className="w-3 h-3" />
        </div>
      )}

      {/* Mini photo */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 ring-2 ring-white dark:ring-slate-700 shadow-xs">
        {player.foto_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={player.foto_url}
            alt={player.nombre}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <User className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Name + position */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
            {player.nombre}
          </p>
          {isPlaced && (
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              En campo
            </span>
          )}
        </div>
        {colors && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded-md ${colors.bg} ${colors.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            {player.demarcacion}
          </span>
        )}
      </div>

      {/* Dorsal badge */}
      {player.dorsal !== null && (
        <span className="shrink-0 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-xs font-extrabold text-slate-700 dark:text-slate-300 ring-1 ring-slate-200/55 dark:ring-slate-700/60">
          {player.dorsal}
        </span>
      )}
    </div>
  );
}

