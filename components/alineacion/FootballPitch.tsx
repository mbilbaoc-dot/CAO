'use client';

import React from 'react';
import FieldSlot from './FieldSlot';
import FormationSelector from './FormationSelector';
import type { SlotPosition } from '@/lib/formations';

interface Player {
  id: string;
  nombre: string;
  dorsal: number | null;
  demarcacion: string | null;
  foto_url: string | null;
}

interface FootballPitchProps {
  formation: string;
  slots: SlotPosition[];
  assignments: Record<string, Player | null>;
  onFormationChange: (name: string) => void;
  onDropPlayer: (slotId: string, playerId: string) => void;
  onRemovePlayer: (slotId: string) => void;
}

export default function FootballPitch({
  formation,
  slots,
  assignments,
  onFormationChange,
  onDropPlayer,
  onRemovePlayer,
}: FootballPitchProps) {
  return (
    <div className="relative w-full h-full select-none">
      {/* ── Formation selector (top-left on pitch) ── */}
      <div className="absolute top-4 left-4 z-30">
        <FormationSelector selected={formation} onChange={onFormationChange} />
      </div>

      {/* ── Formation name (top-right) ── */}
      <div className="absolute top-4 right-4 z-30">
        <span className="text-white/30 text-xs font-bold uppercase tracking-[0.25em]">
          Sistema {formation}
        </span>
      </div>

      {/* ── Pitch background with CSS-drawn lines ── */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-800 shadow-2xl">
        {/* Grass stripe pattern */}
        <div className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 80px)',
          }}
        />

        {/* ── Outer boundary ── */}
        <div className="absolute inset-[4%] border-2 border-white/30 rounded-sm" />

        {/* ── Half line ── */}
        <div className="absolute left-[4%] right-[4%] top-1/2 h-0 border-t-2 border-white/30" />

        {/* ── Center circle ── */}
        <div className="absolute top-1/2 left-1/2 w-[22%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />

        {/* ── Center dot ── */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-white/40 rounded-full" />

        {/* ── TOP penalty area (opponent's) ── */}
        <div className="absolute top-[4%] left-1/2 -translate-x-1/2 w-[52%] h-[18%] border-2 border-t-0 border-white/30" />
        {/* Top goal area */}
        <div className="absolute top-[4%] left-1/2 -translate-x-1/2 w-[26%] h-[8%] border-2 border-t-0 border-white/30" />
        {/* Top penalty dot */}
        <div className="absolute top-[18%] left-1/2 w-1.5 h-1.5 -translate-x-1/2 bg-white/35 rounded-full" />
        {/* Top goal */}
        <div className="absolute top-[2.5%] left-1/2 -translate-x-1/2 w-[14%] h-[2%] border-2 border-b-0 border-white/20 rounded-t-sm" />
        {/* Top penalty arc */}
        <div className="absolute top-[21%] left-1/2 -translate-x-1/2 w-[20%] h-[4%] border-b-2 border-white/25 rounded-b-full" />

        {/* ── BOTTOM penalty area (own) ── */}
        <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 w-[52%] h-[18%] border-2 border-b-0 border-white/30" />
        {/* Bottom goal area */}
        <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 w-[26%] h-[8%] border-2 border-b-0 border-white/30" />
        {/* Bottom penalty dot */}
        <div className="absolute bottom-[18%] left-1/2 w-1.5 h-1.5 -translate-x-1/2 bg-white/35 rounded-full" />
        {/* Bottom goal */}
        <div className="absolute bottom-[2.5%] left-1/2 -translate-x-1/2 w-[14%] h-[2%] border-2 border-t-0 border-white/20 rounded-b-sm" />
        {/* Bottom penalty arc */}
        <div className="absolute bottom-[21%] left-1/2 -translate-x-1/2 w-[20%] h-[4%] border-t-2 border-white/25 rounded-t-full" />

        {/* ── Corner arcs ── */}
        <div className="absolute top-[4%] left-[4%] w-4 h-4 -translate-x-1/2 -translate-y-1/2 border-2 border-white/25 rounded-full" />
        <div className="absolute top-[4%] right-[4%] w-4 h-4 translate-x-1/2 -translate-y-1/2 border-2 border-white/25 rounded-full" />
        <div className="absolute bottom-[4%] left-[4%] w-4 h-4 -translate-x-1/2 translate-y-1/2 border-2 border-white/25 rounded-full" />
        <div className="absolute bottom-[4%] right-[4%] w-4 h-4 translate-x-1/2 translate-y-1/2 border-2 border-white/25 rounded-full" />

        {/* ── Decorative vignette ── */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/10 pointer-events-none" />
      </div>

      {/* ── Player slots ── */}
      <div className="absolute inset-[4%]">
        {slots.map((slot) => (
          <FieldSlot
            key={slot.id}
            slotId={slot.id}
            label={slot.label}
            top={slot.top}
            left={slot.left}
            player={assignments[slot.id] || null}
            onDrop={onDropPlayer}
            onRemove={onRemovePlayer}
          />
        ))}
      </div>
    </div>
  );
}
