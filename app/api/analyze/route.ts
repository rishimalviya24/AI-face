import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import connectDB from '@/database';
import { Analysis } from '@/database/models';
import { uploadImage } from '@/lib/cloudinary';
import { validateImageBuffer, processImage, extractFaceLandmarks } from '@/lib/imageProcessor';
import { analyzeFace } from '@/services/faceAnalysis';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sessionId = formData.get('sessionId') as string || nanoid();

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || 'image/jpeg';

    const validation = validateImageBuffer(buffer, mimeType);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const processed = await processImage(buffer, mimeType);

    const { landmarks, faceCount, error } = await extractFaceLandmarks(processed.resizedBuffer);

    if (error || !landmarks) {
      return NextResponse.json(
        { error: error || 'Failed to process image' },
        { status: 400 }
      );
    }

    if (faceCount === 0) {
      return NextResponse.json(
        { error: 'No face detected in the image. Please upload an image with a clearly visible face.' },
        { status: 400 }
      );
    }

    if (faceCount > 1) {
      return NextResponse.json(
        { error: 'Multiple faces detected. Please upload an image with only one face.' },
        { status: 400 }
      );
    }

    const analysisResult = analyzeFace(landmarks, processed.imageData, processed.width);

    const uploadResult = await uploadImage(processed.resizedBuffer, 'face-analysis');

    const analysis = await Analysis.create({
      sessionId,
      userId: null,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      analysisType: 'single',
      images: [{
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      }],
      results: analysisResult,
      metrics: {
        faceShape: analysisResult.features?.faceShape,
        symmetryScore: analysisResult.features?.symmetry.overallScore,
        goldenRatioScore: analysisResult.features?.goldenRatio.overallScore,
        aestheticsScore: analysisResult.aestheticsScore,
      },
    });

    return NextResponse.json({
      success: true,
      analysisId: analysis._id,
      sessionId,
      result: analysisResult,
      imageUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
