import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalysis extends Document {
  userId: string | null;
  sessionId: string;
  ipAddress?: string;
  uploadDate: Date;
  analysisType: 'single' | 'comparison';
  images: {
    url: string;
    publicId: string;
  }[];
  results: Record<string, unknown>;
  metrics?: {
    similarityScore?: number;
    faceShape?: string;
    symmetryScore?: number;
    goldenRatioScore?: number;
    aestheticsScore?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSchema = new Schema<IAnalysis>(
  {
    userId: {
      type: String,
      default: null,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: undefined,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    analysisType: {
      type: String,
      enum: ['single', 'comparison'],
      required: true,
      index: true,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    results: {
      type: Schema.Types.Mixed,
      required: true,
    },
    metrics: {
      similarityScore: Number,
      faceShape: String,
      symmetryScore: Number,
      goldenRatioScore: Number,
      aestheticsScore: Number,
    },
  },
  {
    timestamps: true,
    collection: 'analyses',
  }
);

AnalysisSchema.index({ createdAt: -1 });
AnalysisSchema.index({ analysisType: 1, createdAt: -1 });

export const Analysis = mongoose.models.Analysis || mongoose.model<IAnalysis>('Analysis', AnalysisSchema);
