'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';

/**
 * Component for auth buttons (Login/Signup) to be displayed in the navigation bar
 */
export default function AuthButtons() {
  return (
    <div className="flex items-center gap-3">
      <Link href="/login">
        <Button variant="ghost" className="flex items-center gap-1 text-beige hover:text-accent-goldLight">
          <LogIn className="h-4 w-4" />
          <span>Login</span>
        </Button>
      </Link>
      
      <Link href="/signup">
        <Button className="flex items-center gap-1 bg-[#00a550] hover:bg-[#008642] text-white">
          <UserPlus className="h-4 w-4" />
          <span>Sign Up</span>
        </Button>
      </Link>
    </div>
  );
}