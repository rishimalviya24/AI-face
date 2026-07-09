'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, Trash2, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDate, formatPercentage } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';

interface HistoryItem {
  _id: string;
  analysisType: 'single' | 'comparison';
  uploadDate: string;
  images: { url: string; publicId: string }[];
  results: {
    aestheticsScore?: number;
    similarity?: { overall: number };
    features?: {
      faceShape: string;
      symmetry: { overallScore: number };
    };
  };
}

interface PaginatedHistory {
  results: HistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export default function HistoryPage() {
  const [history, setHistory] = useState<PaginatedHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const existingSessionId = localStorage.getItem('faceAnalysis_sessionId') || nanoid();
    localStorage.setItem('faceAnalysis_sessionId', existingSessionId);
    setSessionId(existingSessionId);
  }, []);

  const fetchHistory = useCallback(async (page = 1) => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/history?sessionId=${sessionId}&page=${page}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
      setHistory(data);
    } catch {
      setError('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleViewAnalysis = (analysisId: string) => {
    router.push(`/result?id=${analysisId}`);
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    try {
      const response = await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId }),
      });

      if (!response.ok) throw new Error('Failed to delete');

      fetchHistory(history?.pagination.page || 1);
    } catch {
      setError('Failed to delete analysis');
    }
  };

  const handleDeleteAll = async () => {
    try {
      const response = await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAll: true, sessionId }),
      });

      if (!response.ok) throw new Error('Failed to delete');

      setHistory(null);
    } catch {
      setError('Failed to delete history');
    }
  };

  if (!sessionId) return null;

  return (
    <main className="container py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <HistoryIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Analysis History</h1>
              <p className="text-muted-foreground">
                View your previous face analyses
              </p>
            </div>
          </div>

          {history?.results.length !== undefined && history.results.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your analysis history and associated images.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive hover:bg-destructive/90">
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </motion.div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !history?.results.length ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <HistoryIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">No History Yet</h3>
              <p className="text-muted-foreground">
                Start analyzing faces to build your history
              </p>
              <Button onClick={() => router.push('/')}>Analyze a Face</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.results.map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex">
                    <div className="relative w-24 h-24 md:w-32 md:h-32">
                      {item.images[0] && (
                        <img
                          src={item.images[0].url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      {item.analysisType === 'comparison' && item.images[1] && (
                        <img
                          src={item.images[1].url}
                          alt=""
                          className="absolute right-0 top-0 w-1/2 h-full object-cover border-l"
                        />
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {item.analysisType === 'single' ? 'Single Analysis' : 'Face Comparison'}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {formatDate(new Date(item.uploadDate))}
                          </CardDescription>
                        </div>
                        <Badge variant={item.analysisType === 'single' ? 'default' : 'secondary'}>
                          {item.analysisType}
                        </Badge>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        {item.analysisType === 'single' && item.results.aestheticsScore !== undefined && (
                          <span>Score: {item.results.aestheticsScore.toFixed(1)}/10</span>
                        )}
                        {item.analysisType === 'comparison' && item.results.similarity && (
                          <span>Similarity: {item.results.similarity.overall}%</span>
                        )}
                        {item.results.features?.faceShape && (
                          <span>Shape: {item.results.features.faceShape}</span>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewAnalysis(item._id)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete analysis?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this analysis and its images.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAnalysis(item._id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            {history.pagination.hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchHistory(history.pagination.page + 1)}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
