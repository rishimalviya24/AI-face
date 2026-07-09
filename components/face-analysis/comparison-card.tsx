'use client';

import { motion } from 'framer-motion';
import { FaceComparisonResult } from '@/types/face';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatPercentage } from '@/lib/utils';

interface ComparisonCardProps {
  result: FaceComparisonResult;
  image1Url?: string;
  image2Url?: string;
}

const comparisonMetrics = [
  { key: 'overall', label: 'Overall Similarity' },
  { key: 'faceShape', label: 'Face Shape' },
  { key: 'symmetry', label: 'Symmetry' },
  { key: 'goldenRatio', label: 'Golden Ratio' },
  { key: 'eyeShape', label: 'Eye Shape' },
  { key: 'noseShape', label: 'Nose Shape' },
  { key: 'jawline', label: 'Jawline' },
  { key: 'lipShape', label: 'Lip Shape' },
  { key: 'skinTone', label: 'Skin Tone' },
] as const;

export function ComparisonCard({ result, image1Url, image2Url }: ComparisonCardProps) {
  const { similarity, comparison, image1, image2 } = result;

  const getSimilarityColor = ( score: number): string => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Comparison Results</CardTitle>
          <CardDescription>
            Analyzing facial similarities and differences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {image1Url && image2Url && (
              <div className="space-y-2">
                <img
                  src={image1Url}
                  alt="Face 1"
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <div className="text-center">
                  <p className="text-sm font-medium">Image 1</p>
                  <p className={`text-2xl font-bold ${getSimilarityColor(image1.aestheticsScore)}`}>
                    {image1.aestheticsScore.toFixed(1)}
                  </p>
                </div>
              </div>
            )}
            {image1Url && image2Url && (
              <div className="space-y-2">
                <img
                  src={image2Url}
                  alt="Face 2"
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <div className="text-center">
                  <p className="text-sm font-medium">Image 2</p>
                  <p className={`text-2xl font-bold ${getSimilarityColor(image2.aestheticsScore)}`}>
                    {image2.aestheticsScore.toFixed(1)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-center">
            <span className={`text-5xl font-bold ${getSimilarityColor(similarity.overall)}`}>
              {similarity.overall}%
            </span>
            <p className="text-muted-foreground mt-1">Overall Similarity Score</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Similarity Breakdown</h4>
            {comparisonMetrics.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={getSimilarityColor(similarity[key])}>
                    {similarity[key]}%
                  </span>
                </div>
                <Progress value={similarity[key]} className="h-2" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Image 1 Features</h4>
              {image1.features && (
                <div className="flex flex-wrap gap-1">
                  <FeatureBadge label={image1.features.faceShape} />
                  <FeatureBadge label={image1.features.eyeShape} />
                  <FeatureBadge label={image1.features.noseShape} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Image 2 Features</h4>
              {image2.features && (
                <div className="flex flex-wrap gap-1">
                  <FeatureBadge label={image2.features.faceShape} />
                  <FeatureBadge label={image2.features.eyeShape} />
                  <FeatureBadge label={image2.features.noseShape} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Feature Matches</h4>
            <div className="flex flex-wrap gap-2">
              <MatchBadge label="Face Shape" match={comparison.faceShapeMatch} />
              <MatchBadge label="Eye Shape" match={comparison.eyeShapeMatch} />
              <MatchBadge label="Nose Shape" match={comparison.noseShapeMatch} />
              <MatchBadge label="Lip Shape" match={comparison.lipShapeMatch} />
              <MatchBadge label="Jawline" match={comparison.jawlineMatch} />
            </div>
          </div>

          <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
            <p className="font-medium mb-1">Note on Comparison</p>
            <p>
              This comparison analyzes measurable facial characteristics and symmetry.
              Both individuals have unique beauty that cannot be objectively ranked.
              Scores are calculated independently and are for entertainment purposes only.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FeatureBadge({ label }: { label: string }) {
  return (
    <Badge variant="outline" className="capitalize">
      {label.replace('-', ' ')}
    </Badge>
  );
}

function MatchBadge({ label, match }: { label: string; match: boolean }) {
  return (
    <Badge variant={match ? 'default' : 'secondary'} className="capitalize">
      {match ? 'Match' : 'Different'} {label}
    </Badge>
  );
}
