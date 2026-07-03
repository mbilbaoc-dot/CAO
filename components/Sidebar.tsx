'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { 
  Users, 
  Shield, 
  Calendar, 
  FileText, 
  LayoutGrid, 
  Target, 
  Compass, 
  Activity, 
  Moon, 
  Sun 
} from 'lucide-react';

export const MENU_ITEMS = [
  { name: 'Plantilla', href: '/plantilla', icon: Users },
  { name: 'Equipos', href: '/equipos', icon: Shield },
  { name: 'Partidos', href: '/partidos', icon: Calendar },
  { name: 'Informe de rival', href: '/informe-rival', icon: FileText },
  { name: 'Alineación', href: '/alineacion', icon: LayoutGrid },
  { name: 'Plan de partido', href: '/plan-partido', icon: Target },
  { name: 'ABP', href: '/abp', icon: Compass },
  { name: 'Eventos', href: '/eventos', icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-72 bg-sidebar-bg border-r border-sidebar-border h-full flex flex-col justify-between py-6 px-4 shrink-0 transition-colors duration-300">
      <div className="flex flex-col gap-8">
        {/* Header: Logo, Title and Theme Toggle */}
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-3">
            {/* Athletic-like Crest SVG (premium soccer badge) */}
            <div className="w-10 h-12 relative flex-shrink-0 drop-shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/escudo.png" 
                alt="Escudo CAO" 
                className="w-full h-full object-contain" 
              />
            </div>
            
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                CD AOIZ
              </span>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-500 animate-spin-slow" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600 hover:rotate-12 transition-transform duration-300" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            // The item is active if the current pathname starts with or equals the item's href
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-brand-purple-light dark:bg-brand-purple/20 text-slate-950 dark:text-violet-200 border-2 border-slate-900 dark:border-violet-500 font-bold shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] dark:shadow-[3px_3px_0px_0px_rgba(139,92,246,0.3)] translate-x-[-2px] translate-y-[-2px]' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/40 border-2 border-transparent font-medium hover:translate-x-[1px]'
                  }
                `}
              >
                <Icon 
                  className={`
                    w-5 h-5 transition-transform duration-200 group-hover:scale-110
                    ${isActive 
                      ? 'text-brand-purple dark:text-violet-400 stroke-[2.5px]' 
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }
                  `} 
                />
                <span className="text-sm tracking-wide">{item.name}</span>
                
                {/* Active indicator dot/bar */}
                {isActive && (
                  <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-brand-purple dark:bg-violet-400 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 border-t border-sidebar-border flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-medium">Supabase Conectado</span>
      </div>
    </aside>
  );
}
