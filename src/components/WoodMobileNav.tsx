"use client";
import React from 'react';
import Link from 'next/link';
import { Home, Folder, ShoppingCart, BarChart2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function WoodMobileNav() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/projects', icon: Folder, label: 'Projects' },
    { href: '/tokens/purchase', icon: ShoppingCart, label: 'Tokens' },
    { href: '/reports', icon: BarChart2, label: 'Reports' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-amber-600 to-amber-500 border-t border-amber-400/50 flex justify-around items-center h-18 md:hidden shadow-amber-lg rounded-t-2xl backdrop-blur-sm animate-slide-up">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        
        return (
          <Link 
            key={item.href}
            href={item.href} 
            className={`flex flex-col items-center justify-center py-3 w-full relative transition-all duration-300 ease-in-out ${
              isActive 
                ? 'text-accent-goldLight' 
                : 'text-beige hover:text-amber-200'
            }`}
          >
            <span className={`absolute -top-3 ${isActive ? 'opacity-100' : 'opacity-0'} transition-all duration-300 ease-in-out`}>
              <span className="w-10 h-1 bg-accent-gold rounded-full block"></span>
            </span>
            <Icon className={`h-6 w-6 mb-1 transition-transform duration-300 ${isActive ? 'text-accent-gold animate-pulse-slow' : ''}`} />
            <span className={`text-xs font-medium transition-all duration-300 ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
            {isActive && (
              <span className="absolute inset-0 bg-amber-700/20 rounded-xl"></span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
