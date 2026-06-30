'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FORMATIONS } from '@/lib/formations';

interface FormationSelectorProps {
  selected: string;
  onChange: (formationName: string) => void;
}

export default function FormationSelector({ selected, onChange }: FormationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (name: string) => {
    onChange(name);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 bg-slate-950/70 backdrop-blur-md text-white text-xs md:text-sm font-bold
          pl-4 pr-10 py-2.5 rounded-xl border border-white/15
          hover:bg-slate-950/90 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/40
          transition-all duration-200 cursor-pointer shadow-lg
        "
      >
        <Sliders className="w-3.5 h-3.5 text-violet-400" />
        <span>Sistema {selected}</span>
        <ChevronDown 
          className={`absolute right-3 w-4 h-4 text-white/60 pointer-events-none transition-transform duration-250 ${isOpen ? 'rotate-180 text-violet-400' : 'rotate-0'}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="
              absolute left-0 mt-2 w-44 rounded-2xl bg-slate-950/90 border border-white/10 backdrop-blur-md
              shadow-2xl z-40 overflow-hidden py-1.5 focus:outline-none
            "
          >
            <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 mb-1.5">
              Formaciones
            </div>
            {FORMATIONS.map((f) => (
              <button
                key={f.name}
                onClick={() => handleSelect(f.name)}
                className={`
                  w-full text-left px-4 py-2 text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center justify-between
                  ${selected === f.name
                    ? 'text-violet-300 bg-violet-650/20 bg-white/5'
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <span>{f.name}</span>
                {selected === f.name && (
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

