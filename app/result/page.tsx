'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AnalysisCard } from '@/components/face-analysis/analysis-card';
import { ComparisonCard } from '@/components/face-analysis/comparison-card';
import { FaceAnalysisResult, FaceComparisonResult } from '@/types/face';
import Link from 'next/link';

interface StoredAnalysis {
  _id: string;
  analysisType: 'single' | 'comparison';
  images: {
    url: string;
    publicId: string;
  }[];
  results: FaceAnalysisResult | FaceComparisonResult;
  createdAt: string;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('id');
  const [analysis, setAnalysis] = useState<StoredAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!analysisId) {
        setError('No analysis ID provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/history?analysisId=${analysisId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Analysis not found or has been deleted');
          }
          throw new Error('Failed to fetch analysis');
        }

        const data = await response.json();
        setAnalysis(data.result);
      } catch {
        setError('Failed to load analysis');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [analysisId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Analysis not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </Button>

      {analysis.analysisType === 'single' ? (
        <AnalysisCard
          result={analysis.results as FaceAnalysisResult}
          imageUrl={analysis.images[0]?.url}
          title="Saved Analysis"
        />
      ) : (
        <ComparisonCard
          result={analysis.results as FaceComparisonResult}
          image1Url={analysis.images[0]?.url}
          image2Url={analysis.images[1]?.url}
        />
      )}
    </motion.div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function ResultPage() {
  return (
    <main className="container py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={<LoadingFallback />}>
          <ResultContent />
        </Suspense>
      </div>
    </main>
  );
}
