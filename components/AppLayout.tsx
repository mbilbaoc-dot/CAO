'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar, { MENU_ITEMS } from './Sidebar';
import BottomNav from './BottomNav';
import { useTheme } from './ThemeProvider';
import { Menu, X, Sun, Moon } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-app-bg text-app-fg transition-colors duration-300">
      
      {/* Desktop Sidebar (visible on md and up) */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer (sliding menu) */}
      <div 
        className={`
          md:hidden fixed top-0 bottom-0 left-0 z-50 w-72 bg-sidebar-bg border-r border-sidebar-border shadow-2xl transition-transform duration-300 ease-in-out flex flex-col justify-between py-6 px-4
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col gap-8">
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-11 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/escudo.png" 
                  alt="Escudo CAO" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  CD AOIZ
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Menu Links */}
          <nav className="flex flex-col gap-2" onClick={() => setIsMobileMenuOpen(false)}>
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-brand-purple-light dark:bg-brand-purple/20 text-slate-950 dark:text-violet-200 border-2 border-slate-900 dark:border-violet-500 font-bold' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/40 border-2 border-transparent font-medium'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm tracking-wide">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Drawer Footer with Theme Toggle */}
        <div className="flex items-center justify-between border-t border-sidebar-border pt-4 px-2">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Tema Oscuro</span>
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-sidebar-border bg-sidebar-bg shrink-0 transition-colors duration-300 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-10 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/escudo.png" 
                alt="Escudo CAO" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="font-extrabold text-lg text-slate-900 dark:text-slate-100 tracking-tight">CAO</span>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8 transition-colors duration-300">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav onOpenMenu={() => setIsMobileMenuOpen(true)} />
      </div>
    </div>
  );
}
