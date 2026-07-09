import {
  FaceShape,
  JawlineType,
  ChinShape,
  NoseShape,
  LipShape,
  EyeShape,
  EyeDistance,
  EyebrowStyle,
  ForeheadSize,
  SkinTone,
  SkinTexture,
  FacialSymmetry,
  GoldenRatio,
  FacialProportions,
  FacialFeatures,
  GroomingSuggestion,
  FaceAnalysisResult,
  FaceComparisonResult,
} from '@/types/face';

export interface LandmarkPoint {
  x: number;
  y: number;
}

export interface FaceLandmarks {
  jawline: LandmarkPoint[];
  leftEyebrow: LandmarkPoint[];
  rightEyebrow: LandmarkPoint[];
  leftEye: LandmarkPoint[];
  rightEye: LandmarkPoint[];
  noseBridge: LandmarkPoint[];
  noseBase: LandmarkPoint[];
  outerLips: LandmarkPoint[];
  innerLips: LandmarkPoint[];
  faceOutline: LandmarkPoint[];
}

function distance(p1: LandmarkPoint, p2: LandmarkPoint): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function midpoint(p1: LandmarkPoint, p2: LandmarkPoint): LandmarkPoint {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

function calculateAngle(p1: LandmarkPoint, p2: LandmarkPoint, p3: LandmarkPoint): number {
  const a = distance(p2, p1);
  const b = distance(p2, p3);
  const c = distance(p1, p3);
  if (a === 0 || b === 0) return 0;
  const cos = (a * a + b * b - c * c) / (2 * a * b);
  return Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
}

function analyzeFaceLandmarks(landmarks: FaceLandmarks): {
  faceWidth: number;
  faceHeight: number;
  foreheadHeight: number;
  cheekWidth: number;
  jawWidth: number;
  chinHeight: number;
  eyeWidth: number;
  eyeHeight: number;
  eyeDistance: number;
  noseWidth: number;
  noseHeight: number;
  lipWidth: number;
  lipHeight: number;
  jawAngle: number;
} {
  const face = landmarks.faceOutline;
  const leftEye = landmarks.leftEye;
  const rightEye = landmarks.rightEye;
  const nose = landmarks.noseBase;
  const jaw = landmarks.jawline;
  const lips = landmarks.outerLips;

  if (face.length < 2 || leftEye.length < 4 || rightEye.length < 4) {
    return {
      faceWidth: 0, faceHeight: 0, foreheadHeight: 0, cheekWidth: 0,
      jawWidth: 0, chinHeight: 0, eyeWidth: 0, eyeHeight: 0,
      eyeDistance: 0, noseWidth: 0, noseHeight: 0,
      lipWidth: 0, lipHeight: 0, jawAngle: 0
    };
  }

  const leftMost = face.reduce((min, p) => p.x < min.x ? p : min, face[0]);
  const rightMost = face.reduce((max, p) => p.x > max.x ? p : max, face[0]);
  const topMost = face.reduce((min, p) => p.y < min.y ? p : min, face[0]);
  const bottomMost = face.reduce((max, p) => p.y > max.y ? p : max, face[0]);

  const faceWidth = distance(leftMost, rightMost);
  const faceHeight = distance(topMost, bottomMost);

  const browY = (landmarks.leftEyebrow[0]?.y || leftEye[0]?.y || 0);
  const foreheadHeight = browY - topMost.y;

  const leftCheek = jaw[0] || leftMost;
  const rightCheek = jaw[jaw.length - 1] || rightMost;
  const jawWidth = distance(leftCheek, rightCheek);
  const cheekWidth = Math.max(jawWidth, faceWidth * 0.85);

  const chinY = bottomMost.y;
  const lipY = lips[0]?.y || chinY;
  const chinHeight = chinY - lipY;

  const leftEyeWidth = distance(leftEye[0], leftEye[3]);
  const leftEyeHeight = distance(leftEye[1], leftEye[5] || leftEye[1]);
  const eyeWidth = leftEyeWidth;
  const eyeHeight = leftEyeHeight;

  const leftEyeCenter = midpoint(leftEye[0], leftEye[3]);
  const rightEyeCenter = midpoint(rightEye[0], rightEye[3]);
  const eyeDistance = distance(leftEyeCenter, rightEyeCenter);

  const noseWidth = distance(nose[0], nose[nose.length - 1]);
  const noseHeight = distance(nose[0], landmarks.noseBridge[0] || nose[0]);

  const lipWidth = distance(lips[0], lips[6] || lips[lips.length - 1]);
  const lipHeight = distance(lips[2] || lips[0], lips[6] || lips[lips.length - 1]);

  const jawAngle = calculateAngle(jaw[0] || leftCheek, jaw[Math.floor(jaw.length / 2)] || bottomMost, jaw[jaw.length - 1] || rightCheek);

  return {
    faceWidth,
    faceHeight,
    foreheadHeight,
    cheekWidth,
    jawWidth,
    chinHeight,
    eyeWidth,
    eyeHeight,
    eyeDistance,
    noseWidth,
    noseHeight,
    lipWidth,
    lipHeight,
    jawAngle,
  };
}

function determineFaceShape(measurements: ReturnType<typeof analyzeFaceLandmarks>): FaceShape {
  const { faceWidth, faceHeight, jawWidth, foreheadHeight, cheekWidth } = measurements;

  if (faceHeight === 0 || faceWidth === 0) return 'oval';

  const widthToHeight = faceWidth / faceHeight;
  const jawToFace = jawWidth / faceWidth;
  const cheekToFace = cheekWidth / faceWidth;

  if (widthToHeight >= 0.9 && widthToHeight <= 1.1 && jawToFace < 0.7) {
    return 'round';
  }

  if (widthToHeight < 0.8 && jawToFace > 0.75 && cheekToFace < 0.85) {
    if (jawToFace > 0.8) return 'rectangle';
    return 'square';
  }

  if (jawToFace < 0.65 && cheekToFace > 0.75) {
    return 'diamond';
  }

  if (foreheadHeight > faceHeight * 0.35 && jawToFace < 0.6) {
    return 'heart';
  }

  if (jawToFace < 0.55 && widthToHeight < 0.85) {
    return 'triangle';
  }

  return 'oval';
}

function determineJawline(measurements: ReturnType<typeof analyzeFaceLandmarks>, landmarks: FaceLandmarks): JawlineType {
  const { jawAngle, jawWidth, faceWidth } = measurements;

  if (jawWidth === 0) return 'soft';

  const jawRatio = jawWidth / faceWidth;

  if (jawAngle < 110 && jawRatio > 0.8) return 'strong';
  if (jawAngle >= 110 && jawAngle <= 140) return 'angular';
  if (jawRatio < 0.65) return 'weak';
  if (jawAngle > 140) return 'rounded';

  return 'soft';
}

function determineChinShape(measurements: ReturnType<typeof analyzeFaceLandmarks>, landmarks: FaceLandmarks): ChinShape {
  const { chinHeight, jawWidth, faceHeight } = measurements;

  if (faceHeight === 0) return 'rounded';

  const chinRatio = chinHeight / faceHeight;

  if (chinRatio > 0.15) return 'projected';
  if (chinRatio < 0.08) return 'receding';

  const jaw = landmarks.jawline;
  if (jaw.length > 5) {
    const chinPoint = jaw[Math.floor(jaw.length / 2)];
    const leftPoint = jaw[0];
    const rightPoint = jaw[jaw.length - 1];

    if (!chinPoint || !leftPoint || !rightPoint) return 'rounded';

    const chinAngle = calculateAngle(leftPoint, chinPoint, rightPoint);

    if (chinAngle < 140) return 'pointed';
    if (chinAngle > 160) return 'square';
  }

  return 'rounded';
}

function determineNoseShape(landmarks: FaceLandmarks): NoseShape {
  const nose = landmarks.noseBridge;
  const noseBase = landmarks.noseBase;

  if (nose.length < 2 || noseBase.length < 3) return 'straight';

  const bridgeSlope = Math.abs(nose[nose.length - 1].y - nose[0].y) /
    Math.abs(nose[nose.length - 1].x - nose[0].x + 0.001);

  const noseWidth = distance(noseBase[0], noseBase[noseBase.length - 1]);
  const noseHeight = distance(noseBase[0], nose[0]);

  if (bridgeSlope > 2.5) return 'aquiline';
  if (noseWidth > noseHeight * 0.9) return 'flat';
  if (noseBase[2] && noseBase[2].y < noseBase[0].y) return 'upturned';

  const tipProjection = noseBase[2] ? distance(noseBase[2], nose[0]) : 0;
  if (tipProjection < noseHeight * 0.3) return 'button';

  return 'straight';
}

function determineLipShape(landmarks: FaceLandmarks): LipShape {
  const outer = landmarks.outerLips;

  if (outer.length < 8) return 'full';

  const lipWidth = distance(outer[0], outer[outer.length - 2] || outer[outer.length - 1]);
  const upperLipHeight = distance(outer[1], outer[outer.length - 3] || outer[outer.length - 1]);
  const lowerLipHeight = distance(outer[5] || outer[0], outer[outer.length - 1] || outer[0]);

  if (lipWidth === 0) return 'full';

  const fullnessRatio = (upperLipHeight + lowerLipHeight) / lipWidth;

  if (fullnessRatio > 0.5) return 'full';
  if (fullnessRatio < 0.25) return 'thin';
  if (lipWidth > faceWidth(landmarks) * 0.4) return 'wide';

  const cupidBow = determineCupidBow(outer);
  if (cupidBow) return 'bow-shaped';

  return 'full';
}

function determineCupidBow(lips: LandmarkPoint[]): boolean {
  const peak1 = lips[2] || lips[1];
  const peak2 = lips[3] || lips[1];
  const center = lips[Math.floor(lips.length / 2)];

  if (!peak1 || !peak2 || !center) return false;

  return center.y > peak1.y + 5 && center.y > peak2.y + 5;
}

function faceWidth(landmarks: FaceLandmarks): number {
  const face = landmarks.faceOutline;
  if (face.length < 2) return 100;
  const left = face.reduce((min, p) => p.x < min.x ? p : min, face[0]);
  const right = face.reduce((max, p) => p.x > max.x ? p : max, face[0]);
  return distance(left, right);
}

function determineEyeShape(landmarks: FaceLandmarks): EyeShape {
  const leftEye = landmarks.leftEye;

  if (leftEye.length < 6) return 'almond';

  const eyeWidth = distance(leftEye[0], leftEye[3]);
  const eyeHeight = distance(leftEye[1], leftEye[5]);

  if (eyeWidth === 0) return 'almond';

  const ratio = eyeHeight / eyeWidth;

  if (ratio > 0.5) return 'round';
  if (ratio < 0.3) return 'hooded';

  const innerCorner = leftEye[0];
  const outerCorner = leftEye[3];
  const topLid = leftEye[1];
  const bottomLid = leftEye[4];

  if (!innerCorner || !outerCorner || !topLid || !bottomLid) return 'almond';

  if (outerCorner.y < innerCorner.y - 3) return 'upturned';
  if (outerCorner.y > innerCorner.y + 3) return 'downturned';

  return 'almond';
}

function determineEyeDistance(measurements: ReturnType<typeof analyzeFaceLandmarks>): EyeDistance {
  const { eyeDistance, faceWidth } = measurements;

  if (faceWidth === 0) return 'normal';

  const ratio = eyeDistance / faceWidth;

  if (ratio < 0.25) return 'close-set';
  if (ratio > 0.35) return 'wide-set';

  return 'normal';
}

function determineEyebrowStyle(landmarks: FaceLandmarks): EyebrowStyle {
  const leftBrow = landmarks.leftEyebrow;

  if (leftBrow.length < 4) return 'straight';

  const innerPoint = leftBrow[0];
  const outerPoint = leftBrow[leftBrow.length - 1];
  const middlePoint = leftBrow[Math.floor(leftBrow.length / 2)];

  if (!innerPoint || !outerPoint || !middlePoint) return 'straight';

  const archHeight = middlePoint.y - Math.min(innerPoint.y, outerPoint.y);

  if (archHeight > 10) return 'arched';
  if (archHeight < 3) return 'straight';

  const browWidth = distance(innerPoint, outerPoint);

  if (browWidth < 50) return 'thin';
  if (browWidth > 70) return 'thick';

  return 'curved';
}

function determineForeheadSize(measurements: ReturnType<typeof analyzeFaceLandmarks>): ForeheadSize {
  const { foreheadHeight, faceHeight } = measurements;

  if (faceHeight === 0) return 'medium';

  const ratio = foreheadHeight / faceHeight;

  if (ratio < 0.2) return 'small';
  if (ratio > 0.35) return 'high';
  if (ratio > 0.28) return 'large';

  return 'medium';
}

function determineSkinTone(imageData: Uint8ClampedArray, startX: number, startY: number, width: number): SkinTone {
  let totalR = 0, totalG = 0, totalB = 0, count = 0;

  for (let i = 0; i < 100; i++) {
    const idx = (startY * width + startX + i) * 4;
    if (idx < imageData.length - 3) {
      totalR += imageData[idx];
      totalG += imageData[idx + 1];
      totalB += imageData[idx + 2];
      count++;
    }
  }

  if (count === 0) return 'medium';

  const avgR = totalR / count;
  const avgG = totalG / count;
  const avgB = totalB / count;
  const brightness = (avgR + avgG + avgB) / 3;

  if (brightness > 200) return 'fair';
  if (brightness > 170) return 'light';
  if (brightness > 130) return 'medium';
  if (brightness > 90) return 'olive';
  if (brightness > 60) return 'brown';

  return 'dark';
}

function determineSkinTexture(imageData: Uint8ClampedArray, startX: number, startY: number, width: number): SkinTexture {
  let variance = 0;
  let prevBrightness = 0;
  let count = 0;

  for (let i = 0; i < 100; i++) {
    const idx = (startY * width + startX + i) * 4;
    if (idx < imageData.length - 3) {
      const brightness = (imageData[idx] + imageData[idx + 1] + imageData[idx + 2]) / 3;
      variance += Math.pow(brightness - prevBrightness, 2);
      prevBrightness = brightness;
      count++;
    }
  }

  if (count === 0) return 'normal';

  const avgVariance = variance / count;

  if (avgVariance < 10) return 'smooth';
  if (avgVariance < 25) return 'normal';
  if (avgVariance < 50) return 'textured';

  return 'oily';
}

function calculateSymmetry(landmarks: FaceLandmarks): FacialSymmetry {
  const leftEye = landmarks.leftEye;
  const rightEye = landmarks.rightEye;
  const leftBrow = landmarks.leftEyebrow;
  const rightBrow = landmarks.rightEyebrow;
  const nose = landmarks.noseBase;
  const lips = landmarks.outerLips;

  const face = landmarks.faceOutline;
  const faceCenter = face.length > 0 ?
    (face.reduce((min, p) => p.x < min.x ? p : min, face[0]).x +
      face.reduce((max, p) => p.x > max.x ? p : max, face[0]).x) / 2 : 0;

  let eyeSymmetry = 100;
  if (leftEye.length >= 4 && rightEye.length >= 4) {
    const leftCenter = midpoint(leftEye[0], leftEye[3]);
    const rightCenter = midpoint(rightEye[0], rightEye[3]);
    const leftDist = Math.abs(leftCenter.x - faceCenter);
    const rightDist = Math.abs(rightCenter.x - faceCenter);
    eyeSymmetry = 100 - Math.abs(leftDist - rightDist) * 2;
  }

  let browSymmetry = 100;
  if (leftBrow.length > 0 && rightBrow.length > 0) {
    const leftCenter = midpoint(leftBrow[0], leftBrow[leftBrow.length - 1]);
    const rightCenter = midpoint(rightBrow[0], rightBrow[rightBrow.length - 1]);
    const leftDist = Math.abs(leftCenter.x - faceCenter);
    const rightDist = Math.abs(rightCenter.x - faceCenter);
    browSymmetry = 100 - Math.abs(leftDist - rightDist) * 2;
  }

  let mouthSymmetry = 100;
  if (lips.length >= 6) {
    const leftCorner = lips[0];
    const rightCorner = lips[lips.length - 2] || lips[lips.length - 1];
    const midpointX = (leftCorner.x + rightCorner.x) / 2;
    mouthSymmetry = 100 - Math.abs(midpointX - faceCenter) * 2;
  }

  let noseSymmetry = 100;
  if (nose.length > 0) {
    const noseCenter = midpoint(nose[0], nose[nose.length - 1]);
    noseSymmetry = 100 - Math.abs(noseCenter.x - faceCenter) * 3;
  }

  const overallScore = (eyeSymmetry + browSymmetry + mouthSymmetry + noseSymmetry) / 4;

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    leftRightSymmetry: Math.max(0, Math.min(100, (browSymmetry + eyeSymmetry) / 2)),
    eyeSymmetry: Math.max(0, Math.min(100, eyeSymmetry)),
    mouthSymmetry: Math.max(0, Math.min(100, mouthSymmetry)),
    noseSymmetry: Math.max(0, Math.min(100, noseSymmetry)),
  };
}

function calculateGoldenRatio(measurements: ReturnType<typeof analyzeFaceLandmarks>): GoldenRatio {
  const {
    faceWidth, faceHeight, foreheadHeight,
    eyeDistance, noseWidth, noseHeight, lipWidth
  } = measurements;

  if (faceWidth === 0 || faceHeight === 0) {
    return {
      overallScore: 70,
      horizontalThirds: 65,
      verticalFifths: 70,
      eyeSpacing: 68,
      noseToLipRatio: 72,
      faceWidthToHeight: 70,
    };
  }

  const phi = 1.618;

  const foreheadRatio = faceHeight / (faceHeight - foreheadHeight);
  const horizontalThirds = calculateGoldenRatioScore(foreheadRatio, phi);

  const idealEyeDist = faceWidth / 5;
  const eyeSpacing = calculateGoldenRatioScore(eyeDistance / idealEyeDist, 1);

  const idealNoseLipRatio = phi;
  const noseLipRatio = lipWidth / (noseWidth || lipWidth * 0.5);
  const noseToLipRatio = calculateGoldenRatioScore(noseLipRatio, idealNoseLipRatio);

  const idealFaceRatio = phi;
  const faceRatio = faceHeight / faceWidth;
  const faceWidthToHeight = calculateGoldenRatioScore(faceRatio, idealFaceRatio);

  const verticalFifths = (eyeSpacing + noseToLipRatio) / 2;

  const overallScore = (horizontalThirds + verticalFifths + eyeSpacing + noseToLipRatio + faceWidthToHeight) / 5;

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    horizontalThirds: Math.max(0, Math.min(100, horizontalThirds)),
    verticalFifths: Math.max(0, Math.min(100, verticalFifths)),
    eyeSpacing: Math.max(0, Math.min(100, eyeSpacing)),
    noseToLipRatio: Math.max(0, Math.min(100, noseToLipRatio)),
    faceWidthToHeight: Math.max(0, Math.min(100, faceWidthToHeight)),
  };
}

function calculateGoldenRatioScore(actual: number, ideal: number): number {
  const deviation = Math.abs(actual - ideal) / ideal;
  return Math.max(0, 100 - deviation * 100);
}

function calculateProportions(measurements: ReturnType<typeof analyzeFaceLandmarks>): FacialProportions {
  const {
    faceWidth, faceHeight, foreheadHeight,
    chinHeight, eyeDistance, noseWidth, lipWidth
  } = measurements;

  if (faceWidth === 0 || faceHeight === 0) {
    return {
      faceWidthToHeight: 0.75,
      foreheadToFaceHeight: 0.3,
      noseToFaceHeight: 0.25,
      chinToFaceHeight: 0.12,
      eyeSpacingToFaceWidth: 0.3,
      mouthWidthToNoseWidth: 1.4,
    };
  }

  return {
    faceWidthToHeight: faceWidth / faceHeight,
    foreheadToFaceHeight: foreheadHeight / faceHeight,
    noseToFaceHeight: (measurements.noseHeight || faceHeight * 0.25) / faceHeight,
    chinToFaceHeight: chinHeight / faceHeight,
    eyeSpacingToFaceWidth: eyeDistance / faceWidth,
    mouthWidthToNoseWidth: noseWidth > 0 ? lipWidth / noseWidth : 1.4,
  };
}

function estimateAge(measurements: ReturnType<typeof analyzeFaceLandmarks>): { min: number; max: number; estimated: number } {
  const { faceHeight, foreheadHeight, chinHeight } = measurements;

  let baseAge = 25;

  if (foreheadHeight / faceHeight > 0.35) {
    baseAge += 5;
  }

  if (chinHeight / faceHeight < 0.1) {
    baseAge -= 3;
  }

  const estimated = Math.max(18, Math.min(75, baseAge + Math.random() * 5));

  return {
    min: Math.max(18, estimated - 8),
    max: Math.min(75, estimated + 8),
    estimated: Math.round(estimated),
  };
}

function calculateAestheticsScore(features: FacialFeatures): number {
  const weights = {
    symmetry: 0.3,
    goldenRatio: 0.25,
    proportions: 0.2,
    harmony: 0.25,
  };

  const symmetryScore = features.symmetry.overallScore;
  const goldenScore = features.goldenRatio.overallScore;

  const idealProportions = {
    faceWidthToHeight: 0.75,
    eyeSpacingToFaceWidth: 0.28,
    mouthWidthToNoseWidth: 1.4,
  };

  let proportionScore = 100;

  if (features.proportions) {
    const faceRatioDiff = Math.abs(features.proportions.faceWidthToHeight - idealProportions.faceWidthToHeight);
    const eyeRatioDiff = Math.abs(features.proportions.eyeSpacingToFaceWidth - idealProportions.eyeSpacingToFaceWidth);
    proportionScore -= faceRatioDiff * 50 + eyeRatioDiff * 100;
  }

  proportionScore = Math.max(0, proportionScore);

  const harmonyScore = calculateHarmonyScore(features);

  const weightedScore =
    symmetryScore * weights.symmetry +
    goldenScore * weights.goldenRatio +
    proportionScore * weights.proportions +
    harmonyScore * weights.harmony;

  return Math.round((weightedScore / 10) * 10) / 10;
}

function calculateHarmonyScore(features: FacialFeatures): number {
  let score = 70;

  const desirableShapes = ['oval', 'heart', 'diamond'];
  if (desirableShapes.includes(features.faceShape)) {
    score += 10;
  }

  if (features.eyeShape === 'almond' || features.eyeShape === 'upturned') {
    score += 5;
  }

  if (features.lipShape === 'full' || features.lipShape === 'bow-shaped') {
    score += 5;
  }

  if (features.jawline === 'angular' || features.jawline === 'strong') {
    score += 5;
  }

  return Math.min(100, score);
}

function generateGroomingSuggestions(features: FacialFeatures): GroomingSuggestion[] {
  const suggestions: GroomingSuggestion[] = [];

  const hairstyleSuggestions = getHairstyleSuggestions(features.faceShape);
  suggestions.push({
    category: 'hairstyle',
    suggestions: hairstyleSuggestions,
    reason: `Based on your ${features.faceShape} face shape, ${hairstyleSuggestions[0].toLowerCase()} would complement your features.`,
  });

  if (features.hasBeard) {
    const beardSuggestions = getBeardSuggestions(features.faceShape, features.jawline);
    suggestions.push({
      category: 'beard',
      suggestions: beardSuggestions,
      reason: `Enhance your jawline definition with a style that balances your ${features.faceShape} shape.`,
    });
  }

  const glassesSuggestions = getGlassesSuggestions(features.faceShape, features.eyeShape);
  suggestions.push({
    category: 'glasses',
    suggestions: glassesSuggestions,
    reason: `Frames that contrast with your ${features.faceShape} face shape will create visual balance.`,
  });

  const makeupSuggestions = getMakeupSuggestions(features);
  suggestions.push({
    category: 'makeup',
    suggestions: makeupSuggestions,
    reason: `Enhance your natural features with subtle techniques that complement your face shape.`,
  });

  const skincareSuggestions = getSkincareSuggestions(features);
  suggestions.push({
    category: 'skincare',
    suggestions: skincareSuggestions,
    reason: `Based on your skin texture analysis, these recommendations can help maintain skin health.`,
  });

  const posingSuggestions = getPosingSuggestions(features);
  suggestions.push({
    category: 'posing',
    suggestions: posingSuggestions,
    reason: `Position your face at angles that flatter your specific features for photos.`,
  });

  return suggestions;
}

function getHairstyleSuggestions(faceShape: FaceShape): string[] {
  const styles: Record<FaceShape, string[]> = {
    oval: ['Layered medium-length cuts', 'Side-swept bangs', 'Textured bobs', 'Most styles work well'],
    round: ['Volume on top', 'Side parts', 'Long layers', 'Asymmetrical cuts'],
    square: ['Soft layers around face', 'Side-swept bangs', 'Wispy textures', 'Rounded styles'],
    diamond: ['Side-swept bangs', 'Chin-length bobs', 'Tousled waves', 'Volume at jawline'],
    heart: ['Side parts', 'Chin-length styles', 'Soft layers', 'Textured ends'],
    rectangle: ['Full fringes', 'Volume on sides', 'Soft layers', 'Avoid height on top'],
    triangle: ['Volume on top', 'Side-swept bangs', 'Layered bobs', 'Tapered sides'],
  };
  return styles[faceShape] || styles.oval;
}

function getBeardSuggestions(faceShape: FaceShape, jawline: JawlineType): string[] {
  const suggestions: string[] = [];

  if (jawline === 'weak') {
    suggestions.push('Full beard to add jawline definition', 'Stubble for subtle enhancement');
  } else if (jawline === 'strong') {
    suggestions.push('Short boxed beard', 'Well-groomed stubble');
  } else {
    suggestions.push('Circle beard', 'Van Dyke style');
  }

  if (faceShape === 'round') {
    suggestions.push('Keep beard longer on bottom to elongate face');
  } else if (faceShape === 'rectangle') {
    suggestions.push('Fuller sides to add width balance');
  }

  return suggestions.slice(0, 4);
}

function getGlassesSuggestions(faceShape: FaceShape, _eyeShape: EyeShape): string[] {
  const suggestions: string[] = [];

  if (faceShape === 'round') {
    suggestions.push('Angular rectangular frames', 'Cat-eye shapes', 'Bold browlines');
  } else if (faceShape === 'square' || faceShape === 'rectangle') {
    suggestions.push('Round or oval frames', 'Aviators', 'Thin rimless styles');
  } else if (faceShape === 'heart') {
    suggestions.push('Bottom-heavy frames', 'Round shapes', 'Light rimless');
  } else if (faceShape === 'diamond') {
    suggestions.push('Oval frames', 'Cat-eye styles', 'Rimless bottoms');
  } else if (faceShape === 'oval') {
    suggestions.push('Most frame shapes work', 'Geometric shapes', 'Oversized styles');
  } else {
    suggestions.push('Round frames', 'Oval shapes', 'Gradient lenses');
  }

  return suggestions.slice(0, 3);
}

function getMakeupSuggestions(features: FacialFeatures): string[] {
  const suggestions: string[] = [];

  if (features.eyeShape === 'hooded') {
    suggestions.push('Apply lighter shade above crease to create depth illusion');
  } else if (features.eyeShape === 'round') {
    suggestions.push('Extend eyeliner slightly past outer corner');
  }

  if (features.eyeDistance === 'close-set') {
    suggestions.push('Highlight inner corners with light shimmer');
  } else if (features.eyeDistance === 'wide-set') {
    suggestions.push('Focus darker shades on inner corners');
  }

  if (features.lipShape === 'thin') {
    suggestions.push('Overline slightly with lip liner for fuller appearance');
  }

  if (features.faceShape === 'round') {
    suggestions.push('Contour temples and jawline to add definition');
  }

  return suggestions;
}

function getSkincareSuggestions(features: FacialFeatures): string[] {
  const suggestions: string[] = [];

  if (features.skinTexture === 'oily') {
    suggestions.push('Use oil-free moisturizer', 'Clay masks weekly', 'Blotting papers for shine control');
  } else if (features.skinTexture === 'dry') {
    suggestions.push('Hydrating serum daily', 'Rich moisturizer', 'Gentle cleanser');
  } else if (features.skinTexture === 'textured') {
    suggestions.push('Exfoliate 2-3 times weekly', 'Retinol treatment', 'Niacinamide for texture');
  } else {
    suggestions.push('Maintain consistent routine', 'Daily sunscreen', 'Gentle cleansing');
  }

  const age = features.estimatedAgeRange.estimated;
  if (age > 35) {
    suggestions.push('Consider antioxidant serum', 'Eye cream for prevention');
  }

  return suggestions;
}

function getPosingSuggestions(features: FacialFeatures): string[] {
  const suggestions: string[] = [];

  if (features.faceShape === 'round') {
    suggestions.push('Angle face slightly to camera for definition', 'Chin slightly forward to elongate');
  } else if (features.faceShape === 'square') {
    suggestions.push('Soft head tilt for angular balance', 'Look up slightly');
  }

  if (features.symmetry.overallScore < 80) {
    const betterSide = features.symmetry.leftRightSymmetry > 50 ? 'left' : 'right';
    suggestions.push(`Turn slightly toward your ${betterSide} side`);
  }

  if (features.foreheadSize === 'large' || features.foreheadSize === 'high') {
    suggestions.push('Lower chin slightly for balanced proportions');
  }

  suggestions.push('Relax jaw and separate teeth slightly', 'Smile with eyes for natural look');

  return suggestions.slice(0, 4);
}

export function analyzeFace(
  landmarks: FaceLandmarks,
  imageData?: Uint8ClampedArray,
  imageWidth?: number
): FaceAnalysisResult {
  const measurements = analyzeFaceLandmarks(landmarks);

  if (measurements.faceWidth === 0 || measurements.faceHeight === 0) {
    return {
      faceDetected: false,
      faceCount: 0,
      features: null,
      aestheticsScore: 0,
      aestheticsExplanation: 'No face detected in the image.',
      groomingSuggestions: [],
      overallHarmony: 0,
      confidence: 0,
    };
  }

  const symmetry = calculateSymmetry(landmarks);
  const goldenRatio = calculateGoldenRatio(measurements);
  const proportions = calculateProportions(measurements);

  let skinTone: SkinTone = 'medium';
  let skinTexture: SkinTexture = 'normal';

  if (imageData && imageWidth) {
    const face = landmarks.faceOutline;
    const centerX = Math.round((face[0]?.x || 0 + face[face.length - 1]?.x || 0) / 2);
    const centerY = Math.round((face[0]?.y || 0 + face[face.length - 1]?.y || 0) / 2);
    skinTone = determineSkinTone(imageData, centerX, centerY, imageWidth);
    skinTexture = determineSkinTexture(imageData, centerX, centerY, imageWidth);
  }

  const features: FacialFeatures = {
    faceShape: determineFaceShape(measurements),
    symmetry,
    goldenRatio,
    proportions,
    jawline: determineJawline(measurements, landmarks),
    chinShape: determineChinShape(measurements, landmarks),
    noseShape: determineNoseShape(landmarks),
    lipShape: determineLipShape(landmarks),
    eyeShape: determineEyeShape(landmarks),
    eyeDistance: determineEyeDistance(measurements),
    eyebrowStyle: determineEyebrowStyle(landmarks),
    foreheadSize: determineForeheadSize(measurements),
    skinTone,
    skinTexture,
    hasSmile: detectSmile(landmarks),
    hasBeard: false,
    hasGlasses: false,
    estimatedAgeRange: estimateAge(measurements),
  };

  const aestheticsScore = calculateAestheticsScore(features);
  const groomingSuggestions = generateGroomingSuggestions(features);
  const overallHarmony = calculateHarmonyScore(features);

  const aestheticsExplanation = generateAestheticsExplanation(aestheticsScore, features);

  return {
    faceDetected: true,
    faceCount: 1,
    features,
    aestheticsScore,
    aestheticsExplanation,
    groomingSuggestions,
    overallHarmony,
    confidence: Math.min(95, 70 + symmetry.overallScore * 0.25),
  };
}

function detectSmile(landmarks: FaceLandmarks): boolean {
  const lips = landmarks.outerLips;

  if (lips.length < 6) return false;

  const leftCorner = lips[0];
  const rightCorner = lips[lips.length - 2] || lips[lips.length - 1];
  const upperLip = lips[2];
  const lowerLip = lips[5];

  if (!leftCorner || !rightCorner || !upperLip || !lowerLip) return false;

  const lipWidth = distance(leftCorner, rightCorner);
  const lipHeight = distance(upperLip, lowerLip);

  return lipWidth > lipHeight * 2.5;
}

function generateAestheticsExplanation(score: number, features: FacialFeatures): string {
  let explanation = '';

  if (score >= 8.5) {
    explanation = 'Your facial features show excellent balance and harmony. ';
  } else if (score >= 7) {
    explanation = 'Your facial features show good overall balance with some areas of notable symmetry. ';
  } else if (score >= 5.5) {
    explanation = 'Your facial features present a balanced appearance with room for enhancement. ';
  } else {
    explanation = 'Your facial features have unique characteristics that create your individual look. ';
  }

  const strengths: string[] = [];
  if (features.symmetry.overallScore > 80) strengths.push('facial symmetry');
  if (features.goldenRatio.overallScore > 75) strengths.push('proportional harmony');
  if (['oval', 'heart'].includes(features.faceShape)) strengths.push('balanced face shape');
  if (features.eyeShape === 'almond') strengths.push('eye shape');

  if (strengths.length > 0) {
    explanation += `Notable strengths include ${strengths.join(', ')}. `;
  }

  explanation += 'Remember: This score is based on measurable facial proportions and symmetry for entertainment purposes only. True beauty encompasses personality, confidence, and individual uniqueness that cannot be measured by algorithms.';

  return explanation;
}

export function compareFaces(
  analysis1: FaceAnalysisResult,
  analysis2: FaceAnalysisResult
): FaceComparisonResult {
  if (!analysis1.features || !analysis2.features) {
    return {
      image1: analysis1,
      image2: analysis2,
      similarity: {
        overall: 0,
        faceShape: 0,
        symmetry: 0,
        goldenRatio: 0,
        jawline: 0,
        eyeShape: 0,
        noseShape: 0,
        lipShape: 0,
        skinTone: 0,
        facialFeatureSimilarity: 0,
      },
      comparison: {
        faceShapeMatch: false,
        eyeShapeMatch: false,
        noseShapeMatch: false,
        lipShapeMatch: false,
        jawlineMatch: false,
        ageSimilarity: 0,
      },
    };
  }

  const f1 = analysis1.features;
  const f2 = analysis2.features;

  const faceShapeSimilarity = f1.faceShape === f2.faceShape ? 100 : 20;
  const eyeShapeSimilarity = f1.eyeShape === f2.eyeShape ? 100 : 25;
  const noseSimilarity = f1.noseShape === f2.noseShape ? 100 : 30;
  const lipSimilarity = f1.lipShape === f2.lipShape ? 100 : 35;
  const jawlineSimilarity = f1.jawline === f2.jawline ? 100 : 40;

  const symmetryScore = 100 - Math.abs(f1.symmetry.overallScore - f2.symmetry.overallScore);
  const goldenRatioScore = 100 - Math.abs(f1.goldenRatio.overallScore - f2.goldenRatio.overallScore);

  const skinToneSimilarity = calculateSkinToneSimilarity(f1.skinTone, f2.skinTone);

  const ageDiff = Math.abs(f1.estimatedAgeRange.estimated - f2.estimatedAgeRange.estimated);
  const ageSimilarity = Math.max(0, 100 - ageDiff * 3);

  const featureWeights = {
    faceShape: 0.15,
    symmetry: 0.12,
    goldenRatio: 0.12,
    jawline: 0.1,
    eyeShape: 0.13,
    nose: 0.13,
    lip: 0.1,
    skinTone: 0.05,
    age: 0.1,
  };

  const overallSimilarity =
    faceShapeSimilarity * featureWeights.faceShape +
    symmetryScore * featureWeights.symmetry +
    goldenRatioScore * featureWeights.goldenRatio +
    jawlineSimilarity * featureWeights.jawline +
    eyeShapeSimilarity * featureWeights.eyeShape +
    noseSimilarity * featureWeights.nose +
    lipSimilarity * featureWeights.lip +
    skinToneSimilarity * featureWeights.skinTone +
    ageSimilarity * featureWeights.age;

  const facialFeatureSimilarity = (
    faceShapeSimilarity +
    eyeShapeSimilarity +
    noseSimilarity +
    lipSimilarity +
    jawlineSimilarity
  ) / 5;

  return {
    image1: analysis1,
    image2: analysis2,
    similarity: {
      overall: Math.round(overallSimilarity),
      faceShape: Math.round(faceShapeSimilarity),
      symmetry: Math.round(symmetryScore),
      goldenRatio: Math.round(goldenRatioScore),
      jawline: Math.round(jawlineSimilarity),
      eyeShape: Math.round(eyeShapeSimilarity),
      noseShape: Math.round(noseSimilarity),
      lipShape: Math.round(lipSimilarity),
      skinTone: Math.round(skinToneSimilarity),
      facialFeatureSimilarity: Math.round(facialFeatureSimilarity),
    },
    comparison: {
      faceShapeMatch: f1.faceShape === f2.faceShape,
      eyeShapeMatch: f1.eyeShape === f2.eyeShape,
      noseShapeMatch: f1.noseShape === f2.noseShape,
      lipShapeMatch: f1.lipShape === f2.lipShape,
      jawlineMatch: f1.jawline === f2.jawline,
      ageSimilarity: Math.round(ageSimilarity),
    },
  };
}

function calculateSkinToneSimilarity(tone1: SkinTone, tone2: SkinTone): number {
  const skinToneScale: SkinTone[] = ['fair', 'light', 'medium', 'olive', 'brown', 'dark'];
  const index1 = skinToneScale.indexOf(tone1);
  const index2 = skinToneScale.indexOf(tone2);

  if (index1 === -1 || index2 === -1) return 50;

  const diff = Math.abs(index1 - index2);

  return Math.max(0, 100 - diff * 20);
}
