'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Shield, 
  Calendar, 
  LayoutGrid, 
  Menu 
} from 'lucide-react';

interface BottomNavProps {
  onOpenMenu: () => void;
}

export default function BottomNav({ onOpenMenu }: BottomNavProps) {
  const pathname = usePathname();

  const primaryItems = [
    { name: 'Plantilla', href: '/plantilla', icon: Users },
    { name: 'Equipos', href: '/equipos', icon: Shield },
    { name: 'Partidos', href: '/partidos', icon: Calendar },
    { name: 'Alineación', href: '/alineacion', icon: LayoutGrid },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar-bg/85 backdrop-blur-lg border-t border-sidebar-border px-4 py-2 pb-6 flex items-center justify-around shadow-lg transition-colors duration-300">
      {primaryItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200
              ${isActive 
                ? 'text-brand-purple dark:text-violet-400 font-bold scale-105' 
                : 'text-slate-500 dark:text-slate-400 font-medium'
              }
            `}
          >
            <Icon 
              className={`
                w-5 h-5
                ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}
              `} 
            />
            <span className="text-[10px] tracking-wide">{item.name}</span>
          </Link>
        );
      })}

      {/* "Más" / Hamburger button */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200 cursor-pointer"
        aria-label="Open full menu"
      >
        <Menu className="w-5 h-5 stroke-[2px]" />
        <span className="text-[10px] tracking-wide">Más</span>
      </button>
    </nav>
  );
}
