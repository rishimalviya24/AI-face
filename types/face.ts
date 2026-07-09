export type FaceShape =
  | 'oval'
  | 'round'
  | 'square'
  | 'diamond'
  | 'heart'
  | 'rectangle'
  | 'triangle';

export type JawlineType =
  | 'strong'
  | 'soft'
  | 'rounded'
  | 'angular'
  | 'weak';

export type ChinShape =
  | 'pointed'
  | 'rounded'
  | 'square'
  | 'cleft'
  | 'projected'
  | 'receding';

export type NoseShape =
  | 'straight'
  | 'aquiline'
  | 'button'
  | 'upturned'
  | 'flat'
  | 'roman'
  | 'nubian';

export type LipShape =
  | 'full'
  | 'thin'
  | 'wide'
  | 'heart-shaped'
  | 'uneven'
  | 'bow-shaped';

export type EyeShape =
  | 'almond'
  | 'round'
  | 'hooded'
  | 'upturned'
  | 'downturned'
  | 'monolid'
  | 'protruding';

export type EyeDistance =
  | 'close-set'
  | 'normal'
  | 'wide-set';

export type EyebrowStyle =
  | 'arched'
  | 'straight'
  | 'curved'
  | 'angular'
  | 'thick'
  | 'thin';

export type ForeheadSize =
  | 'small'
  | 'medium'
  | 'large'
  | 'high';

export type SkinTone =
  | 'fair'
  | 'light'
  | 'medium'
  | 'olive'
  | 'brown'
  | 'dark';

export type SkinTexture =
  | 'smooth'
  | 'normal'
  | 'oily'
  | 'dry'
  | 'textured';

export interface FacialSymmetry {
  overallScore: number;
  leftRightSymmetry: number;
  eyeSymmetry: number;
  mouthSymmetry: number;
  noseSymmetry: number;
}

export interface GoldenRatio {
  overallScore: number;
  horizontalThirds: number;
  verticalFifths: number;
  eyeSpacing: number;
  noseToLipRatio: number;
  faceWidthToHeight: number;
}

export interface FacialProportions {
  faceWidthToHeight: number;
  foreheadToFaceHeight: number;
  noseToFaceHeight: number;
  chinToFaceHeight: number;
  eyeSpacingToFaceWidth: number;
  mouthWidthToNoseWidth: number;
}

export interface FacialFeatures {
  faceShape: FaceShape;
  symmetry: FacialSymmetry;
  goldenRatio: GoldenRatio;
  proportions: FacialProportions;
  jawline: JawlineType;
  chinShape: ChinShape;
  noseShape: NoseShape;
  lipShape: LipShape;
  eyeShape: EyeShape;
  eyeDistance: EyeDistance;
  eyebrowStyle: EyebrowStyle;
  foreheadSize: ForeheadSize;
  skinTone: SkinTone;
  skinTexture: SkinTexture;
  hasSmile: boolean;
  hasBeard: boolean;
  hasGlasses: boolean;
  estimatedAgeRange: {
    min: number;
    max: number;
    estimated: number;
  };
}

export interface GroomingSuggestion {
  category: 'hairstyle' | 'beard' | 'glasses' | 'makeup' | 'skincare' | 'posing';
  suggestions: string[];
  reason: string;
}

export interface FaceAnalysisResult {
  faceDetected: boolean;
  faceCount: number;
  features: FacialFeatures | null;
  aestheticsScore: number;
  aestheticsExplanation: string;
  groomingSuggestions: GroomingSuggestion[];
  overallHarmony: number;
  confidence: number;
}

export interface FaceComparisonResult {
  image1: FaceAnalysisResult;
  image2: FaceAnalysisResult;
  similarity: {
    overall: number;
    faceShape: number;
    symmetry: number;
    goldenRatio: number;
    jawline: number;
    eyeShape: number;
    noseShape: number;
    lipShape: number;
    skinTone: number;
    facialFeatureSimilarity: number;
  };
  comparison: {
    faceShapeMatch: boolean;
    eyeShapeMatch: boolean;
    noseShapeMatch: boolean;
    lipShapeMatch: boolean;
    jawlineMatch: boolean;
    ageSimilarity: number;
  };
}

export interface AnalysisDocument {
  _id: string;
  userId: string | null;
  sessionId: string;
  ipAddress?: string;
  uploadDate: Date;
  analysisType: 'single' | 'comparison';
  images: {
    url: string;
    publicId: string;
  }[];
  results: FaceAnalysisResult | FaceComparisonResult;
  metrics?: {
    similarityScore?: number;
    faceShape?: FaceShape;
    symmetryScore?: number;
    goldenRatioScore?: number;
    aestheticsScore?: number;
  };
}
