'use client';

import { useState, useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';

export interface UseFaceAnalysisOptions {
  onSuccess?: (result: unknown) => void;
  onError?: (error: string) => void;
}

export function useFaceAnalysis(options: UseFaceAnalysisOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ Hydration-safe session ID
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    let id = localStorage.getItem('faceAnalysis_sessionId');

    if (!id) {
      id = nanoid();
      localStorage.setItem('faceAnalysis_sessionId', id);
    }

    setSessionId(id);
  }, []);

  const analyzeSingle = useCallback(async (file: File) => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data);
      options.onSuccess?.(data);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Analysis failed';

      setError(errorMessage);
      options.onError?.(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, options]);

  const compare = useCallback(async (file1: File, file2: File) => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file1', file1);
      formData.append('file2', file2);
      formData.append('sessionId', sessionId);

      const response = await fetch('/api/compare', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Comparison failed');
      }

      setResult(data);
      options.onSuccess?.(data);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Comparison failed';

      setError(errorMessage);
      options.onError?.(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, options]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isLoading,
    result,
    error,
    sessionId,
    analyzeSingle,
    compare,
    reset,
  };
}