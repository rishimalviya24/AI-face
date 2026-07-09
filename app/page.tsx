'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFaceAnalysis } from '@/hooks/use-face-analysis';
import { ImageUploader } from '@/components/face-analysis/image-uploader';
import { AnalysisCard } from '@/components/face-analysis/analysis-card';
import { ComparisonCard } from '@/components/face-analysis/comparison-card';
import { ModeSelector, AnalysisMode } from '@/components/face-analysis/mode-selector';
import { LoadingSkeleton } from '@/components/face-analysis/loading-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FaceAnalysisResult, FaceComparisonResult } from '@/types/face';

interface SingleResult {
  result: FaceAnalysisResult;
  imageUrl: string;
  analysisId: string;
}

interface CompareResult {
  result: FaceComparisonResult;
  images: {
    image1: string;
    image2: string;
  };
  analysisId: string;
}

export default function Home() {
  const [mode, setMode] = useState<AnalysisMode>('single');
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SingleResult | CompareResult | null>(null);

  const {
    isLoading,
    error,
    sessionId,
    analyzeSingle,
    compare,
    reset,
  } = useFaceAnalysis({
    onSuccess: (data) => setAnalysisResult(data as SingleResult | CompareResult),
    onError: () => setAnalysisResult(null),
  });

  const handleAnalyze = async () => {
    if (mode === 'single' && file1) {
      await analyzeSingle(file1);
    } else if (mode === 'compare' && file1 && file2) {
      await compare(file1, file2);
    }
  };

  const handleReset = () => {
    setFile1(null);
    setFile2(null);
    setAnalysisResult(null);
    reset();
  };

  const canAnalyze = mode === 'single' ? !!file1 : !!(file1 && file2);

  return (
    <main className="container py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">AI Face Analysis</h1>
          </div>
          <p className="text-muted-foreground">
            Upload an image to analyze facial features or compare two faces
          </p>
        </motion.div>

        <ModeSelector value={mode} onChange={setMode} />

        <AnimatePresence mode="wait">
          {!analysisResult && !isLoading && (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className={mode === 'compare' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}>
                <ImageUploader
                  value={file1}
                  onChange={setFile1}
                  label={mode === 'compare' ? 'First Image' : 'Upload Image'}
                  className={mode === 'compare' ? '' : 'max-w-md mx-auto'}
                />
                {mode === 'compare' && (
                  <ImageUploader
                    value={file2}
                    onChange={setFile2}
                    label="Second Image"
                  />
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze || isLoading}
                  className="px-8"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
                      />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze {mode === 'compare' ? 'Faces' : 'Face'}
                    </>
                  )}
                </Button>
                {(file1 || file2) && (
                  <Button variant="outline" size="lg" onClick={handleReset}>
                    Reset
                  </Button>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Session ID: {sessionId?.substring(0, 8)}...
              </p>
            </motion.div>
          )}

          {isLoading && <LoadingSkeleton mode={mode} />}

          {analysisResult && !isLoading && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {mode === 'single' && 'result' in analysisResult && 'imageUrl' in analysisResult && (
                <AnalysisCard
                  result={(analysisResult as SingleResult).result}
                  imageUrl={(analysisResult as SingleResult).imageUrl}
                  title="Face Analysis Results"
                />
              )}

              {mode === 'compare' && 'images' in analysisResult && (
                <ComparisonCard
                  result={(analysisResult as CompareResult).result}
                  image1Url={(analysisResult as CompareResult).images.image1}
                  image2Url={(analysisResult as CompareResult).images.image2}
                />
              )}

              <div className="flex justify-center">
                <Button variant="outline" size="lg" onClick={handleReset}>
                  Analyze Another
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}