'use client';

import { ScanFace, GitCompare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AnalysisMode = 'single' | 'compare';

interface ModeSelectorProps {
  value: AnalysisMode;
  onChange: (mode: AnalysisMode) => void;
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-lg',
          value === 'single' ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
        )}
        onClick={() => onChange('single')}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <ScanFace className={cn('h-8 w-8', value === 'single' ? 'text-primary' : 'text-muted-foreground')} />
            {value === 'single' && (
              <Button variant="secondary" size="sm" className="pointer-events-none">
                Selected
              </Button>
            )}
          </div>
          <CardTitle className="text-lg">Single Face Analysis</CardTitle>
          <CardDescription>
            Analyze facial features, symmetry, and get personalized suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>Face shape detection</span>
            <span className="text-muted-foreground/50">-</span>
            <span>Aesthetics score</span>
            <span className="text-muted-foreground/50">-</span>
            <span>Grooming tips</span>
          </div>
        </CardContent>
      </Card>

      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-lg',
          value === 'compare' ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
        )}
        onClick={() => onChange('compare')}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <GitCompare className={cn('h-8 w-8 rotate-90', value === 'compare' ? 'text-primary' : 'text-muted-foreground')} />
            {value === 'compare' && (
              <Button variant="secondary" size="sm" className="pointer-events-none">
                Selected
              </Button>
            )}
          </div>
          <CardTitle className="text-lg">Face Comparison</CardTitle>
          <CardDescription>
            Compare two faces and analyze similarities
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>Similarity score</span>
            <span className="text-muted-foreground/50">-</span>
            <span>Feature matching</span>
            <span className="text-muted-foreground/50">-</span>
            <span>Detailed comparison</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
