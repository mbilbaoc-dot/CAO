'use client';

import React from 'react';
import { Save, Loader2, CheckCircle } from 'lucide-react';
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
  onClickSlot?: (slotId: string) => void;
  // Save props passed from parent
  onSave?: () => void;
  isSaving?: boolean;
  saveSuccess?: boolean;
  canSave?: boolean;
}

export default function FootballPitch({
  formation,
  slots,
  assignments,
  onFormationChange,
  onDropPlayer,
  onRemovePlayer,
  onClickSlot,
  onSave,
  isSaving = false,
  saveSuccess = false,
  canSave = false,
}: FootballPitchProps) {
  return (
    <div className="relative w-full h-full min-h-[520px] select-none rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800/80 shadow-2xl">
      {/* ── Formation selector (top-left on pitch) ── */}
      <div className="absolute top-4 left-4 z-30">
        <FormationSelector selected={formation} onChange={onFormationChange} />
      </div>

      {/* ── Formation name (top-right) ── */}
      <div className="absolute top-5 right-5 z-30">
        <span className="text-white/40 text-[10px] font-extrabold uppercase tracking-[0.25em] bg-slate-950/40 backdrop-blur-xs px-3 py-1 rounded-full border border-white/5">
          Táctica: {formation}
        </span>
      </div>

      {/* ── Save button (bottom-right on pitch) ── */}
      {onSave && (
        <div className="absolute bottom-4 right-4 z-30">
          <button
            onClick={onSave}
            disabled={isSaving || !canSave}
            className={`
              flex items-center gap-2 px-4.5 py-2.5 rounded-2xl text-xs md:text-sm font-extrabold transition-all duration-300 cursor-pointer shadow-lg
              disabled:cursor-not-allowed disabled:opacity-40 select-none
              ${saveSuccess
                ? 'bg-emerald-500 text-white shadow-emerald-500/20 scale-100 hover:bg-emerald-600'
                : 'bg-slate-950/80 hover:bg-slate-950 border border-white/10 hover:border-white/30 text-white shadow-black/40 hover:-translate-y-0.5 active:translate-y-0'
              }
            `}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                <span>Guardando...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-350 animate-bounce" />
                <span>Alineación Guardada</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-violet-400" />
                <span>Guardar Alineación</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Pitch background with CSS-drawn lines ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-850">
        {/* Lawn horizontal stripes */}
        <div className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 45px, rgba(255,255,255,0.4) 45px, rgba(255,255,255,0.4) 90px)',
          }}
        />

        {/* Stadium light flood overlay */}
        <div className="absolute inset-0 opacity-[0.22] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.4) 0%, transparent 75%)',
          }}
        />

        {/* ── Outer boundary ── */}
        <div className="absolute inset-[4%] border-2 border-white/20 rounded-xs" />

        {/* ── Half line ── */}
        <div className="absolute left-[4%] right-[4%] top-1/2 h-0 border-t-2 border-white/20" />

        {/* ── Center circle ── */}
        <div className="absolute top-1/2 left-1/2 w-[22%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20" />

        {/* ── Center dot ── */}
        <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 bg-white/30 rounded-full" />

        {/* ── TOP penalty area ── */}
        <div className="absolute top-[4%] left-1/2 -translate-x-1/2 w-[50%] h-[18%] border-2 border-t-0 border-white/20" />
        {/* Top goal area */}
        <div className="absolute top-[4%] left-1/2 -translate-x-1/2 w-[24%] h-[7%] border-2 border-t-0 border-white/20" />
        {/* Top penalty dot */}
        <div className="absolute top-[17%] left-1/2 w-1.5 h-1.5 -translate-x-1/2 bg-white/25 rounded-full" />
        {/* Top goal */}
        <div className="absolute top-[2%] left-1/2 -translate-x-1/2 w-[14%] h-[2%] border-2 border-b-0 border-white/10 rounded-t-sm" />
        {/* Top penalty arc */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[18%] h-[5%] border-b-2 border-white/15 rounded-b-full" />

        {/* ── BOTTOM penalty area ── */}
        <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 w-[50%] h-[18%] border-2 border-b-0 border-white/20" />
        {/* Bottom goal area */}
        <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 w-[24%] h-[7%] border-2 border-b-0 border-white/20" />
        {/* Bottom penalty dot */}
        <div className="absolute bottom-[17%] left-1/2 w-1.5 h-1.5 -translate-x-1/2 bg-white/25 rounded-full" />
        {/* Bottom goal */}
        <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 w-[14%] h-[2%] border-2 border-t-0 border-white/10 rounded-b-sm" />
        {/* Bottom penalty arc */}
        <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[18%] h-[5%] border-t-2 border-white/15 rounded-t-full" />

        {/* ── Corner arcs ── */}
        <div className="absolute top-[4%] left-[4%] w-4.5 h-4.5 -translate-x-1/2 -translate-y-1/2 border-2 border-white/15 rounded-full" />
        <div className="absolute top-[4%] right-[4%] w-4.5 h-4.5 translate-x-1/2 -translate-y-1/2 border-2 border-white/15 rounded-full" />
        <div className="absolute bottom-[4%] left-[4%] w-4.5 h-4.5 -translate-x-1/2 translate-y-1/2 border-2 border-white/15 rounded-full" />
        <div className="absolute bottom-[4%] right-[4%] w-4.5 h-4.5 translate-x-1/2 translate-y-1/2 border-2 border-white/15 rounded-full" />

        {/* ── Decorative Vignette ── */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/15 pointer-events-none" />
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
            onClickSlot={onClickSlot}
          />
        ))}
      </div>
    </div>
  );
}

