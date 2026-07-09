import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/database';
import { Analysis } from '@/database/models';
import { deleteImage } from '@/lib/cloudinary';
import { Document } from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const analysisId = searchParams.get('analysisId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    if (analysisId) {
      const analysisResult = await Analysis.findById(analysisId);
      if (!analysisResult) {
        return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
      }

      const result = {
        _id: analysisResult._id,
        analysisType: analysisResult.analysisType,
        uploadDate: analysisResult.uploadDate,
        images: analysisResult.images,
        results: analysisResult.results,
      };

      return NextResponse.json({ result });
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const results = await Analysis.find({ sessionId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Analysis.countDocuments({ sessionId });

    return NextResponse.json({
      results,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + results.length < total,
      },
    });
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { analysisId, sessionId, deleteAll } = await request.json();

    if (deleteAll && sessionId) {
      const analyses = await Analysis.find({ sessionId });

      for (const analysis of analyses) {
        for (const image of analysis.images) {
          await deleteImage(image.publicId);
        }
      }

      await Analysis.deleteMany({ sessionId });

      return NextResponse.json({ success: true, message: 'All history deleted' });
    }

    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 });
    }

    const analysis = await Analysis.findById(analysisId);
    if (!analysis) {
      return NextResponse.json({ error: 'Analyses not found' }, { status: 404 });
    }

    for (const image of analysis.images) {
      await deleteImage(image.publicId);
    }

    await Analysis.findByIdAndDelete(analysisId);

    return NextResponse.json({ success: true, message: 'Analysis deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete analysis' },
      { status: 500 }
    );
  }
}
