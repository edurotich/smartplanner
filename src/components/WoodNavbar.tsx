"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function WoodNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/projects', label: 'Projects' },
    { href: '/tokens/purchase', label: 'Buy Tokens' },
    { href: '/reports', label: 'Reports' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`sticky top-0 w-full z-40 transition-all duration-300 ease-in-out ${
      isScrolled 
        ? 'bg-gradient-to-r from-amber-600 to-amber-500 shadow-amber-lg py-2' 
        : 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber py-3'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <span className="font-display text-2xl font-bold tracking-tight text-beige drop-shadow-md mr-1 transition-all duration-300 hover:text-accent-goldLight">
                  Smart<span className="text-accent-goldLight">Planner</span>
                </span>
              </Link>
            </div>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:block">
            <div className="flex items-center gap-6">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className={`relative px-3 py-2 text-lg font-medium rounded-lg transition-all duration-300 ease-in-out hover:text-accent-goldLight ${
                      isActive 
                        ? 'text-accent-goldLight' 
                        : 'text-beige'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-gold rounded animate-pulse-slow"></span>
                    )}
                  </Link>
                );
              })}
              <div className="ml-3 pl-3 border-l border-amber-400/30">
                <ThemeToggle />
              </div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-beige hover:text-accent-goldLight focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block animate-slide-down' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gradient-to-b from-amber-500 to-amber-600 shadow-inner border-t border-amber-400/30">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive 
                    ? 'bg-amber-700/30 text-accent-goldLight' 
                    : 'text-beige hover:bg-amber-700/20 hover:text-accent-goldLight'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-4 pb-2 border-t border-amber-400/30 flex justify-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
