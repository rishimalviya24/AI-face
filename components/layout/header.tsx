'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScanFace, History, LayoutDashboard, BrainCircuit } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Analyze', icon: ScanFace },
  { href: '/history', label: 'History', icon: History },
  { href: '/admin', label: 'Admin', icon: LayoutDashboard },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl hidden sm:inline-block">
              Face Analysis AI
            </span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center justify-end space-x-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  'flex items-center gap-2',
                  pathname === item.href && 'bg-accent'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
