'use client';

import React, { useState } from 'react';
import { User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Player {
  id: string;
  nombre: string;
  dorsal: number | null;
  demarcacion: string | null;
  foto_url: string | null;
}

interface FieldSlotProps {
  slotId: string;
  label: string;
  top: number;
  left: number;
  player: Player | null;
  onDrop: (slotId: string, playerId: string) => void;
  onRemove: (slotId: string) => void;
  onClickSlot?: (slotId: string) => void;
}

function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  // Take first initial + last name
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

const DEMARCACION_RINGS: Record<string, string> = {
  Portero:        'ring-amber-500 shadow-amber-500/10',
  Defensa:        'ring-sky-500 shadow-sky-500/10',
  Centrocampista: 'ring-emerald-500 shadow-emerald-500/10',
  Delantero:      'ring-rose-500 shadow-rose-500/10',
};

export default function FieldSlot({
  slotId,
  label,
  top,
  left,
  player,
  onDrop,
  onRemove,
  onClickSlot,
}: FieldSlotProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const playerId = e.dataTransfer.getData('text/plain');
    if (playerId) {
      onDrop(slotId, playerId);
    }
  };

  const handleSlotClick = (e: React.MouseEvent) => {
    if (player) {
      e.stopPropagation();
      onRemove(slotId);
    } else if (onClickSlot) {
      e.stopPropagation();
      onClickSlot(slotId);
    }
  };

  const ringColor = player?.demarcacion ? DEMARCACION_RINGS[player.demarcacion] : 'ring-white/80';

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer"
      style={{ top: `${top}%`, left: `${left}%` }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleSlotClick}
    >
      <AnimatePresence mode="wait">
        {player ? (
          /* ── Occupied slot: player pill ── */
          <motion.div
            key={`player-${player.id}`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 280 }}
            className="relative group flex flex-col items-center gap-1"
            title="Hacer click para quitar"
          >
            {/* Photo circle */}
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden ring-[3px] ${ringColor} shadow-lg bg-slate-900 relative transition-all duration-300 group-hover:scale-105`}>
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
                  <User className="w-6 h-6" />
                </div>
              )}

              {/* Remove hover overlay */}
              <div className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-full">
                <X className="w-5 h-5 text-white" />
              </div>

              {/* Dorsal badge on photo */}
              {player.dorsal !== null && (
                <span className="absolute -bottom-0.5 -right-0.5 w-5.5 h-5.5 md:w-6.5 md:h-6.5 rounded-full bg-slate-950 text-white text-[9px] md:text-[10px] font-extrabold flex items-center justify-center ring-2 ring-emerald-800 shadow-md">
                  {player.dorsal}
                </span>
              )}
            </div>

            {/* Name pill */}
            <span className="px-2 py-0.5 bg-slate-950/90 border border-white/10 backdrop-blur-xs text-white text-[9px] md:text-[10px] font-extrabold rounded-full whitespace-nowrap shadow-md max-w-[95px] truncate transition-colors duration-200 group-hover:bg-red-950 group-hover:border-red-500/25">
              {abbreviateName(player.nombre)}
            </span>
          </motion.div>
        ) : (
          /* ── Empty slot: glassmorphism dashed circle ── */
          <motion.div
            key={`empty-${slotId}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className={`
              flex flex-col items-center gap-1 transition-all duration-200
              ${isDragOver ? 'scale-120' : 'scale-100'}
            `}
          >
            <div
              className={`
                w-11 h-11 md:w-13 md:h-13 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-255 backdrop-blur-xs shadow-inner
                ${isDragOver
                  ? 'border-white bg-white/35 shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105'
                  : 'border-white/30 bg-white/5 hover:bg-white/15 hover:border-white/50'
                }
              `}
            >
              <span className={`text-[9px] md:text-[10px] font-extrabold tracking-wider transition-colors duration-200 ${isDragOver ? 'text-white' : 'text-white/60'}`}>
                {label}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
