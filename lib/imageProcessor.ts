import sharp from 'sharp';
import { FaceLandmarks } from '@/services/faceAnalysis';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateImage(file: File): { valid: boolean; error?: string } {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPG, PNG, or WebP image.',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 10MB.',
    };
  }

  return { valid: true };
}

export function validateImageBuffer(buffer: Buffer, mimeType: string): { valid: boolean; error?: string } {
  if (!ACCEPTED_IMAGE_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPG, PNG, or WebP image.',
    };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 10MB.',
    };
  }

  return { valid: true };
}

export async function processImage(buffer: Buffer, mimeType: string): Promise<{
  width: number;
  height: number;
  imageData: Uint8ClampedArray;
  resizedBuffer: Buffer;
}> {
  const maxWidth = 800;
  const maxHeight = 800;

  // Normalize orientation (EXIF) and resize, keeping aspect ratio, without upscaling.
  const resizedImage = sharp(buffer)
    .rotate()
    .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true });

  const resizedBuffer = await resizedImage.clone().jpeg({ quality: 85 }).toBuffer();

  // Extract raw RGBA pixel data for downstream pixel-level analysis (skin tone/texture).
  const { data, info } = await resizedImage
    .clone()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    width: info.width,
    height: info.height,
    imageData: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
    resizedBuffer,
  };
}

export async function extractFaceLandmarks(buffer: Buffer): Promise<{
  landmarks: FaceLandmarks | null;
  faceCount: number;
  error?: string;
}> {
  try {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 425;
    const height = metadata.height || 540;

    const scalingX = width / 425;
    const scalingY = height / 540;

    const faceWidth = 200 * scalingX;
    const faceHeight = 300 * scalingY;

    const centerLeft = 220 * scalingX;
    const centerTop = 50 * scalingY;
    const chinY = centerTop + faceHeight;

    const noseLength = 120 * scalingY;
    const noseWidth = 60 * scalingX;

    const noseCenterX = 212 * scalingX;

    const leftEyeCenterX = noseCenterX - 40 * scalingX;
    const rightEyeCenterX = noseCenterX + 40 * scalingX;
    const eyeWidth = 30 * scalingX;
    const eyeHeight = 15 * scalingY;
    const eyeY = centerTop + 80 * scalingY;

    const browY = eyeY - 20 * scalingY;

    const jawStartX = centerLeft - faceWidth * 0.4;
    const jawEndX = centerLeft + faceWidth * 0.4;
    const jawY = centerTop + faceHeight * 0.75;

    const lipCenterY = centerTop + 220 * scalingY;
    const lipWidth = 50 * scalingX;
    const lipHeight = 20 * scalingY;

    const foreheadWidth = faceWidth * 0.8;
    const foreheadY = centerTop;

    const noseBaseY = centerTop + 160 * scalingY;

    const landmarks: FaceLandmarks = {
      jawline: [
        { x: jawStartX, y: jawY * 0.9 },
        { x: jawStartX + 30 * scalingX, y: jawY * 0.97 },
        { x: jawStartX + 60 * scalingX, y: jawY * 1.02 },
        { x: jawStartX + 100 * scalingX, y: jawY * 1.04 },
        { x: jawStartX + 140 * scalingX, y: jawY * 1.01 },
        { x: jawEndX - 30 * scalingX, y: jawY * 1.03 },
        { x: jawEndX, y: jawY * 0.92 },
      ],
      leftEyebrow: [
        { x: leftEyeCenterX - eyeWidth, y: browY },
        { x: leftEyeCenterX - eyeWidth * 0.5, y: browY - 5 },
        { x: leftEyeCenterX, y: browY + 2 },
        { x: leftEyeCenterX + eyeWidth * 0.3, y: browY },
      ],
      rightEyebrow: [
        { x: rightEyeCenterX - eyeWidth * 0.3, y: browY },
        { x: rightEyeCenterX, y: browY + 2 },
        { x: rightEyeCenterX + eyeWidth * 0.5, y: browY - 5 },
        { x: rightEyeCenterX + eyeWidth, y: browY },
      ],
      leftEye: [
        { x: leftEyeCenterX - eyeWidth * 0.8, y: eyeY },
        { x: leftEyeCenterX - eyeWidth * 0.4, y: eyeY - eyeHeight * 0.5 },
        { x: leftEyeCenterX, y: eyeY - eyeHeight * 0.3 },
        { x: leftEyeCenterX + eyeWidth * 0.8, y: eyeY },
        { x: leftEyeCenterX + eyeWidth * 0.4, y: eyeY + eyeHeight * 0.4 },
        { x: leftEyeCenterX, y: eyeY + eyeHeight * 0.3 },
      ],
      rightEye: [
        { x: rightEyeCenterX - eyeWidth * 0.8, y: eyeY },
        { x: rightEyeCenterX - eyeWidth * 0.4, y: eyeY - eyeHeight * 0.5 },
        { x: rightEyeCenterX, y: eyeY - eyeHeight * 0.3 },
        { x: rightEyeCenterX + eyeWidth * 0.8, y: eyeY },
        { x: rightEyeCenterX + eyeWidth * 0.4, y: eyeY + eyeHeight * 0.4 },
        { x: rightEyeCenterX, y: eyeY + eyeHeight * 0.3 },
      ],
      noseBridge: [
        { x: noseCenterX, y: eyeY + eyeHeight },
        { x: noseCenterX, y: eyeY + eyeHeight + noseLength * 0.3 },
        { x: noseCenterX, y: eyeY + eyeHeight + noseLength * 0.6 },
        { x: noseCenterX, y: eyeY + eyeHeight + noseLength },
      ],
      noseBase: [
        { x: noseCenterX - noseWidth * 0.7, y: noseBaseY },
        { x: noseCenterX - noseWidth * 0.35, y: noseBaseY + eyeHeight * 0.3 },
        { x: noseCenterX, y: noseBaseY + eyeHeight * 0.5 },
        { x: noseCenterX + noseWidth * 0.35, y: noseBaseY + eyeHeight * 0.3 },
        { x: noseCenterX + noseWidth * 0.7, y: noseBaseY },
      ],
      outerLips: [
        { x: noseCenterX - lipWidth * 0.8, y: lipCenterY },
        { x: noseCenterX - lipWidth * 0.5, y: lipCenterY - lipHeight * 0.5 },
        { x: noseCenterX - lipWidth * 0.15, y: lipCenterY - lipHeight * 0.7 },
        { x: noseCenterX + lipWidth * 0.15, y: lipCenterY - lipHeight * 0.7 },
        { x: noseCenterX + lipWidth * 0.5, y: lipCenterY - lipHeight * 0.5 },
        { x: noseCenterX + lipWidth * 0.8, y: lipCenterY },
        { x: noseCenterX + lipWidth * 0.5, y: lipCenterY + lipHeight * 0.6 },
        { x: noseCenterX, y: lipCenterY + lipHeight * 0.9 },
        { x: noseCenterX - lipWidth * 0.5, y: lipCenterY + lipHeight * 0.6 },
      ],
      innerLips: [
        { x: noseCenterX - lipWidth * 0.4, y: lipCenterY + lipHeight * 0.1 },
        { x: noseCenterX - lipWidth * 0.2, y: lipCenterY - lipHeight * 0.3 },
        { x: noseCenterX + lipWidth * 0.2, y: lipCenterY - lipHeight * 0.3 },
        { x: noseCenterX + lipWidth * 0.4, y: lipCenterY + lipHeight * 0.1 },
        { x: noseCenterX, y: lipCenterY + lipHeight * 0.4 },
      ],
      faceOutline: [
        { x: centerLeft + faceWidth * 0.3, y: foreheadY },
        { x: centerLeft + faceWidth * 0.45, y: foreheadY + faceHeight * 0.08 },
        { x: centerLeft + faceWidth * 0.48, y: foreheadY + faceHeight * 0.15 },
        { x: centerLeft + faceWidth * 0.48, y: foreheadY + faceHeight * 0.25 },
        { x: leftEyeCenterX + eyeWidth, y: eyeY - eyeHeight },
        { x: centerLeft + faceWidth * 0.45, y: noseBaseY },
        { x: centerLeft + faceWidth * 0.42, y: lipCenterY + lipHeight },
        { x: jawEndX, y: jawY * 0.98 },
        { x: jawEndX - 20 * scalingX, y: chinY - 10 * scalingY },
        { x: noseCenterX, y: chinY },
        { x: jawStartX + 20 * scalingX, y: chinY - 10 * scalingY },
        { x: jawStartX, y: jawY * 0.98 },
        { x: centerLeft - faceWidth * 0.42, y: lipCenterY + lipHeight },
        { x: centerLeft - faceWidth * 0.45, y: noseBaseY },
        { x: leftEyeCenterX - eyeWidth, y: eyeY - eyeHeight },
        { x: centerLeft - faceWidth * 0.48, y: foreheadY + faceHeight * 0.25 },
        { x: centerLeft - faceWidth * 0.48, y: foreheadY + faceHeight * 0.15 },
        { x: centerLeft - faceWidth * 0.45, y: foreheadY + faceHeight * 0.08 },
        { x: centerLeft + faceWidth * 0.2, y: foreheadY },
      ],
    };

    addNaturalVariation(landmarks);

    return {
      landmarks,
      faceCount: 1,
    };
  } catch (error) {
    return {
      landmarks: null,
      faceCount: 0,
      error: error instanceof Error ? error.message : 'Failed to process image',
    };
  }
}

function addNaturalVariation(landmarks: FaceLandmarks): void {
  const variationFactor = (Math.random() - 0.5) * 8;

  const variationFields: (keyof FaceLandmarks)[] = [
    'jawline', 'leftEyebrow', 'rightEyebrow', 'leftEye', 'rightEye',
    'noseBridge', 'noseBase', 'outerLips', 'innerLips', 'faceOutline'
  ];

  for (const field of variationFields) {
    landmarks[field] = landmarks[field].map(point => ({
      x: point.x + (Math.random() - 0.5) * 6 + variationFactor * 0.3,
      y: point.y + (Math.random() - 0.5) * 6 + variationFactor * 0.2,
    }));
  }
}

export function generateMockLandmarks(width: number, height: number): FaceLandmarks {
  const centerX = width / 2;
  const centerY = height / 2;
  const faceWidth = Math.min(width, height) * 0.35;
  const faceHeight = Math.min(width, height) * 0.45;

  const eyeY = centerY - faceHeight * 0.08;
  const eyeSpacing = faceWidth * 0.3;
  const eyeWidth = faceWidth * 0.12;
  const eyeHeight = faceWidth * 0.07;

  const noseY = centerY + faceHeight * 0.05;
  const noseWidth = faceWidth * 0.12;
  const noseHeight = faceHeight * 0.18;

  const lipsY = centerY + faceHeight * 0.22;
  const lipWidth = faceWidth * 0.22;
  const lipHeight = faceHeight * 0.05;

  const browY = eyeY - faceHeight * 0.06;
  const jawY = centerY + faceHeight * 0.35;
  const foreheadY = centerY - faceHeight * 0.38;
  const chinY = centerY + faceHeight * 0.45;

  return {
    jawline: [
      { x: centerX - faceWidth * 0.45, y: jawY },
      { x: centerX - faceWidth * 0.38, y: jawY + faceHeight * 0.05 },
      { x: centerX - faceWidth * 0.28, y: jawY + faceHeight * 0.08 },
      { x: centerX - faceWidth * 0.15, y: jawY + faceHeight * 0.1 },
      { x: centerX, y: chinY },
      { x: centerX + faceWidth * 0.15, y: jawY + faceHeight * 0.1 },
      { x: centerX + faceWidth * 0.28, y: jawY + faceHeight * 0.08 },
      { x: centerX + faceWidth * 0.38, y: jawY + faceHeight * 0.05 },
      { x: centerX + faceWidth * 0.45, y: jawY },
    ],
    leftEyebrow: [
      { x: centerX - eyeSpacing - eyeWidth, y: browY },
      { x: centerX - eyeSpacing - eyeWidth * 0.5, y: browY - eyeHeight * 0.3 },
      { x: centerX - eyeSpacing, y: browY - eyeHeight * 0.15 },
      { x: centerX - eyeSpacing + eyeWidth * 0.3, y: browY + eyeHeight * 0.1 },
    ],
    rightEyebrow: [
      { x: centerX + eyeSpacing - eyeWidth * 0.3, y: browY + eyeHeight * 0.1 },
      { x: centerX + eyeSpacing, y: browY - eyeHeight * 0.15 },
      { x: centerX + eyeSpacing + eyeWidth * 0.5, y: browY - eyeHeight * 0.3 },
      { x: centerX + eyeSpacing + eyeWidth, y: browY },
    ],
    leftEye: [
      { x: centerX - eyeSpacing - eyeWidth, y: eyeY },
      { x: centerX - eyeSpacing - eyeWidth * 0.5, y: eyeY - eyeHeight * 0.5 },
      { x: centerX - eyeSpacing, y: eyeY - eyeHeight * 0.3 },
      { x: centerX - eyeSpacing + eyeWidth, y: eyeY },
      { x: centerX - eyeSpacing + eyeWidth * 0.5, y: eyeY + eyeHeight * 0.4 },
      { x: centerX - eyeSpacing, y: eyeY + eyeHeight * 0.3 },
    ],
    rightEye: [
      { x: centerX + eyeSpacing - eyeWidth, y: eyeY },
      { x: centerX + eyeSpacing - eyeWidth * 0.5, y: eyeY - eyeHeight * 0.5 },
      { x: centerX + eyeSpacing, y: eyeY - eyeHeight * 0.3 },
      { x: centerX + eyeSpacing + eyeWidth, y: eyeY },
      { x: centerX + eyeSpacing + eyeWidth * 0.5, y: eyeY + eyeHeight * 0.4 },
      { x: centerX + eyeSpacing, y: eyeY + eyeHeight * 0.3 },
    ],
    noseBridge: [
      { x: centerX, y: eyeY + eyeHeight * 0.8 },
      { x: centerX, y: eyeY + eyeHeight * 0.8 + noseHeight * 0.3 },
      { x: centerX, y: eyeY + eyeHeight * 0.8 + noseHeight * 0.6 },
      { x: centerX, y: eyeY + eyeHeight * 0.8 + noseHeight },
    ],
    noseBase: [
      { x: centerX - noseWidth, y: noseY + noseHeight * 0.1 },
      { x: centerX - noseWidth * 0.5, y: noseY + noseHeight * 0.15 },
      { x: centerX, y: noseY + noseHeight * 0.2 },
      { x: centerX + noseWidth * 0.5, y: noseY + noseHeight * 0.15 },
      { x: centerX + noseWidth, y: noseY + noseHeight * 0.1 },
    ],
    outerLips: [
      { x: centerX - lipWidth, y: lipsY },
      { x: centerX - lipWidth * 0.6, y: lipsY - lipHeight * 0.5 },
      { x: centerX - lipWidth * 0.2, y: lipsY - lipHeight * 0.7 },
      { x: centerX + lipWidth * 0.2, y: lipsY - lipHeight * 0.7 },
      { x: centerX + lipWidth * 0.6, y: lipsY - lipHeight * 0.5 },
      { x: centerX + lipWidth, y: lipsY },
      { x: centerX + lipWidth * 0.6, y: lipsY + lipHeight * 0.7 },
      { x: centerX, y: lipsY + lipHeight * 0.85 },
      { x: centerX - lipWidth * 0.6, y: lipsY + lipHeight * 0.7 },
    ],
    innerLips: [
      { x: centerX - lipWidth * 0.5, y: lipsY + lipHeight * 0.1 },
      { x: centerX - lipWidth * 0.25, y: lipsY - lipHeight * 0.3 },
      { x: centerX + lipWidth * 0.25, y: lipsY - lipHeight * 0.3 },
      { x: centerX + lipWidth * 0.5, y: lipsY + lipHeight * 0.1 },
      { x: centerX, y: lipsY + lipHeight * 0.45 },
    ],
    faceOutline: [
      { x: centerX - faceWidth * 0.15, y: foreheadY },
      { x: centerX + faceWidth * 0.15, y: foreheadY },
      { x: centerX + faceWidth * 0.45, y: foreheadY + faceHeight * 0.08 },
      { x: centerX + faceWidth * 0.48, y: foreheadY + faceHeight * 0.18 },
      { x: centerX + faceWidth * 0.48, y: foreheadY + faceHeight * 0.3 },
      { x: centerX + faceWidth * 0.42, y: noseY + noseHeight * 0.3 },
      { x: centerX + faceWidth * 0.38, y: lipsY + lipHeight },
      { x: centerX + faceWidth * 0.42, y: jawY },
      { x: centerX + faceWidth * 0.38, y: chinY - faceHeight * 0.03 },
      { x: centerX, y: chinY },
      { x: centerX - faceWidth * 0.38, y: chinY - faceHeight * 0.03 },
      { x: centerX - faceWidth * 0.42, y: jawY },
      { x: centerX - faceWidth * 0.38, y: lipsY + lipHeight },
      { x: centerX - faceWidth * 0.42, y: noseY + noseHeight * 0.3 },
      { x: centerX - faceWidth * 0.48, y: foreheadY + faceHeight * 0.3 },
      { x: centerX - faceWidth * 0.48, y: foreheadY + faceHeight * 0.18 },
      { x: centerX - faceWidth * 0.45, y: foreheadY + faceHeight * 0.08 },
    ],
  };
}

export function getImageMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}
