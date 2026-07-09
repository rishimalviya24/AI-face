'use client';

import { motion } from 'framer-motion';
import { FaceAnalysisResult } from '@/types/face';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatPercentage } from '@/lib/utils';

interface AnalysisCardProps {
  result: FaceAnalysisResult;
  imageUrl?: string;
  title?: string;
}

const scoreColors: Record<string, string> = {
  high: 'text-green-500',
  medium: 'text-yellow-500',
  low: 'text-orange-500',
};

function getScoreColor(score: number): string {
  if (score >= 80) return scoreColors.high;
  if (score >= 50) return scoreColors.medium;
  return scoreColors.low;
}

function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-green-500/20 to-green-500/5';
  if (score >= 50) return 'from-yellow-500/20 to-yellow-500/5';
  return 'from-orange-500/20 to-orange-500/5';
}

export function AnalysisCard({ result, imageUrl, title = 'Analysis Results' }: AnalysisCardProps) {
  if (!result.faceDetected || !result.features) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No face detected in the image.</p>
        </CardContent>
      </Card>
    );
  }

  const { features, aestheticsScore, aestheticsExplanation, groomingSuggestions, overallHarmony } = result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <Card className="overflow-hidden">
        {imageUrl && (
          <div className="relative h-48 overflow-hidden">
            <img src={imageUrl} alt="Analyzed" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Confidence: {formatPercentage(result.confidence)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScoreDisplay score={aestheticsScore} label="Aesthetics Score" />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <FeatureBadge label="Face Shape" value={features.faceShape} />
            <FeatureBadge label="Jawline" value={features.jawline} />
            <FeatureBadge label="Eye Shape" value={features.eyeShape} />
            <FeatureBadge label="Nose Shape" value={features.noseShape} />
            <FeatureBadge label="Lip Shape" value={features.lipShape} />
            <FeatureBadge label="Eye Distance" value={features.eyeDistance} />
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Detailed Metrics</h4>
            <MetricBar label="Symmetry" value={features.symmetry.overallScore} />
            <MetricBar label="Golden Ratio" value={features.goldenRatio.overallScore} />
            <MetricBar label="Overall Harmony" value={overallHarmony} />
            <MetricBar label="Eye Symmetry" value={features.symmetry.eyeSymmetry} />
            <MetricBar label="Nose Symmetry" value={features.symmetry.noseSymmetry} />
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Additional Features</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Chin:</span>
              <span className="capitalize">{features.chinShape}</span>
              <span className="text-muted-foreground">Eyebrows:</span>
              <span className="capitalize">{features.eyebrowStyle}</span>
              <span className="text-muted-foreground">Forehead:</span>
              <span className="capitalize">{features.foreheadSize}</span>
              <span className="text-muted-foreground">Skin Tone:</span>
              <span className="capitalize">{features.skinTone}</span>
              <span className="text-muted-foreground">Skin Texture:</span>
              <span className="capitalize">{features.skinTexture}</span>
              <span className="text-muted-foreground">Estimated Age:</span>
              <span>{features.estimatedAgeRange.estimated} years</span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {features.hasSmile && <Badge variant="secondary">Smiling</Badge>}
            {features.hasBeard && <Badge variant="secondary">Beard Detected</Badge>}
            {features.hasGlasses && <Badge variant="secondary">Glasses Detected</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analysis Explanation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{aestheticsExplanation}</p>
        </CardContent>
      </Card>

      {groomingSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grooming Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groomingSuggestions.map((suggestion, idx) => (
              <SuggestionCard key={idx} suggestion={suggestion} />
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function ScoreDisplay({ score, label }: { score: number; label: string }) {
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${getScoreGradient(score)}`}>
      <div className="text-center">
        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
          {score.toFixed(1)}
        </span>
        <span className="text-2xl text-muted-foreground">/10</span>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        <p className="text-xs text-muted-foreground mt-1 italic">
          For entertainment purposes only
        </p>
      </div>
    </div>
  );
}

function FeatureBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Badge variant="outline" className="capitalize w-fit">
        {value.replace('-', ' ')}
      </Badge>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={getScoreColor(value)}>{formatPercentage(value)}</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: { category: string; suggestions: string[]; reason: string } }) {
  const categoryLabels: Record<string, string> = {
    hairstyle: 'Hair',
    beard: 'Beard',
    glasses: 'Glasses',
    makeup: 'Makeup',
    skincare: 'Skincare',
    posing: 'Posing',
  };

  return (
    <div className="border rounded-lg p-3">
      <h5 className="font-medium text-sm capitalize mb-2">
        {categoryLabels[suggestion.category] || suggestion.category}
      </h5>
      <ul className="text-sm text-muted-foreground space-y-1">
        {suggestion.suggestions.slice(0, 3).map((s, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-primary">-</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground mt-2 italic">
        {suggestion.reason}
      </p>
    </div>
  );
}
