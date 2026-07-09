'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/lib/constants';

interface ImageUploaderProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  preview?: string;
  className?: string;
  label?: string;
}

export function ImageUploader({
  value,
  onChange,
  preview,
  className,
  label = 'Upload Image',
}: ImageUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      const file = acceptedFiles[0];

      if (!file) return;

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError('Invalid file type. Please upload a JPG, PNG, or WebP image.');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError('File too large. Maximum size is 10MB.');
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);
      onChange(file);
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
  });

  const displayPreview = preview || localPreview;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
    }
    setLocalPreview(null);
    onChange(null);
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden group',
          isDragActive
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50',
          displayPreview && 'border-solid border-primary/30'
        )}
      >
        <input {...getInputProps()} />

        {displayPreview ? (
          <div className="relative aspect-square">
            <img
              src={displayPreview}
              alt="Preview"
              className="w-full h-full object-cover rounded-xl"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-background/90 rounded-full shadow-lg hover:bg-background transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center aspect-square p-8">
            <div className="mb-4 p-4 rounded-full bg-primary/10">
              {isDragActive ? (
                <ImageIcon className="h-8 w-8 text-primary animate-pulse" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <p className="mb-1 text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground text-center">
              Drag & drop or click to upload
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG or WebP (max 10MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
