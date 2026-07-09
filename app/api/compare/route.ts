import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import connectDB from '@/database';
import { Analysis } from '@/database/models';
import { uploadImage } from '@/lib/cloudinary';
import { validateImageBuffer, processImage, extractFaceLandmarks } from '@/lib/imageProcessor';
import { analyzeFace, compareFaces } from '@/services/faceAnalysis';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const file1 = formData.get('file1') as File | null;
    const file2 = formData.get('file2') as File | null;
    const sessionId = formData.get('sessionId') as string || nanoid();

    if (!file1 || !file2) {
      return NextResponse.json(
        { error: 'Two images are required for comparison' },
        { status: 400 }
      );
    }

    const processFile = async (file: File, label: string) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type || 'image/jpeg';

      const validation = validateImageBuffer(buffer, mimeType);
      if (!validation.valid) {
        throw new Error(`${label}: ${validation.error}`);
      }

      const processed = await processImage(buffer, mimeType);
      const { landmarks, faceCount, error } = await extractFaceLandmarks(processed.resizedBuffer);

      if (error || !landmarks) {
        throw new Error(`${label}: Failed to process image`);
      }

      if (faceCount === 0) {
        throw new Error(`${label}: No face detected. Please upload an image with a clearly visible face.`);
      }

      if (faceCount > 1) {
        throw new Error(`${label}: Multiple faces detected. Please upload an image with only one face.`);
      }

      const analysisResult = analyzeFace(landmarks, processed.imageData, processed.width);
      const uploadResult = await uploadImage(processed.resizedBuffer, 'face-compare');

      return {
        result: analysisResult,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    };

    let processed1, processed2;
    try {
      [processed1, processed2] = await Promise.all([
        processFile(file1, 'Image 1'),
        processFile(file2, 'Image 2'),
      ]);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to process images' },
        { status: 400 }
      );
    }

    const comparisonResult = compareFaces(processed1.result, processed2.result);

    const analysis = await Analysis.create({
      sessionId,
      userId: null,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      analysisType: 'comparison',
      images: [
        { url: processed1.url, publicId: processed1.publicId },
        { url: processed2.url, publicId: processed2.publicId },
      ],
      results: comparisonResult,
      metrics: {
        similarityScore: comparisonResult.similarity.overall,
        symmetryScore: ((processed1.result.features?.symmetry.overallScore ?? 0) + (processed2.result.features?.symmetry.overallScore ?? 0)) / 2,
        aestheticsScore: (processed1.result.aestheticsScore + processed2.result.aestheticsScore) / 2,
      },
    });

    return NextResponse.json({
      success: true,
      analysisId: analysis._id,
      sessionId,
      result: comparisonResult,
      images: {
        image1: processed1.url,
        image2: processed2.url,
      },
    });
  } catch (error) {
    console.error('Comparison error:', error);
    return NextResponse.json(
      { error: 'Failed to compare images' },
      { status: 500 }
    );
  }
}
