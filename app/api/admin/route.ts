import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/database';
import { Analysis } from '@/database/models';
import { deleteImage } from '@/lib/cloudinary';
import mongoose from 'mongoose';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin-secret-key';

function validateAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');
  return token === ADMIN_SECRET;
}

export async function GET(request: NextRequest) {
  try {
    if (!validateAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'stats') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalAnalyses,
        todaysAnalyses,
        singleCount,
        comparisonCount,
        recentAnalyses,
        avgStats,
      ] = await Promise.all([
        Analysis.countDocuments(),
        Analysis.countDocuments({ createdAt: { $gte: today } }),
        Analysis.countDocuments({ analysisType: 'single' }),
        Analysis.countDocuments({ analysisType: 'comparison' }),
        Analysis.find().sort({ createdAt: -1 }).limit(10).lean(),
        Analysis.aggregate([
          {
            $group: {
              _id: null,
              avgAesthetics: { $avg: '$metrics.aestheticsScore' },
              avgSimilarity: { $avg: '$metrics.similarityScore' },
              avgSymmetry: { $avg: '$metrics.symmetryScore' },
            },
          },
        ]),
      ]);

      const uploadsByDay = await Analysis.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]);

      const faceShapeDistribution = await Analysis.aggregate([
        {
          $match: { 'metrics.faceShape': { $exists: true } },
        },
        {
          $group: {
            _id: '$metrics.faceShape',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      return NextResponse.json({
        stats: {
          totalAnalyses,
          todaysAnalyses,
          singleCount,
          comparisonCount,
          avgAesthetics: avgStats[0]?.avgAesthetics?.toFixed(1) || '0',
          avgSimilarity: avgStats[0]?.avgSimilarity?.toFixed(1) || '0',
          avgSymmetry: avgStats[0]?.avgSymmetry?.toFixed(1) || '0',
        },
        charts: {
          uploadsByDay,
          faceShapeDistribution,
        },
        recentAnalyses,
      });
    }

    if (action === 'list') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const skip = (page - 1) * limit;

      const analyses = await Analysis.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Analysis.countDocuments();

      return NextResponse.json({
        analyses,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!validateAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { analysisId, deleteAll } = await request.json();

    if (deleteAll) {
      const analyses = await Analysis.find();

      for (const analysis of analyses) {
        for (const image of analysis.images) {
          await deleteImage(image.publicId);
        }
      }

      await Analysis.deleteMany({});

      return NextResponse.json({ success: true, message: 'All data deleted' });
    }

    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(analysisId)) {
      return NextResponse.json({ error: 'Invalid analysis ID' }, { status: 400 });
    }

    const analysis = await Analysis.findById(analysisId);
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    for (const image of analysis.images) {
      await deleteImage(image.publicId);
    }

    await Analysis.findByIdAndDelete(analysisId);

    return NextResponse.json({ success: true, message: 'Analysis deleted' });
  } catch (error) {
    console.error('Admin delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete' },
      { status: 500 }
    );
  }
}
