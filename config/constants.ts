export const APP_CONFIG = {
  name: 'Face Analysis AI',
  description: 'Advanced AI-powered facial analysis and comparison tool',
  version: '1.0.0',
};

export const FACE_SHAPES = {
  oval: { label: 'Oval', description: 'Well-balanced proportions, slightly wider cheekbones than forehead and jaw' },
  round: { label: 'Round', description: 'Soft features with similar width and height' },
  square: { label: 'Square', description: 'Strong jawline with similar width across forehead, cheeks, and jaw' },
  diamond: { label: 'Diamond', description: 'Narrow forehead and jaw with wide cheekbones' },
  heart: { label: 'Heart', description: 'Wider forehead tapering to a narrow chin' },
  rectangle: { label: 'Rectangle', description: 'Longer face with similar width throughout' },
  triangle: { label: 'Triangle', description: 'Narrow forehead widening to a broader jawline' },
} as const;

export const JAWLINE_TYPES = {
  strong: { label: 'Strong', description: 'Well-defined angular jawline' },
  soft: { label: 'Soft', description: 'Gentle curved jawline' },
  rounded: { label: 'Rounded', description: 'Smooth rounded jaw' },
  angular: { label: 'Angular', description: 'Sharp defined angles' },
  weak: { label: 'Weak', description: 'Less pronounced jawline' },
} as const;

export const CHIN_SHAPES = {
  pointed: { label: 'Pointed', description: 'Narrow tapering chin' },
  rounded: { label: 'Rounded', description: 'Soft rounded chin' },
  square: { label: 'Square', description: 'Flat broad chin' },
  cleft: { label: 'Cleft', description: 'Chin with a distinct groove' },
  projected: { label: 'Projected', description: 'Forward-projecting chin' },
  receding: { label: 'Receding', description: 'Chin that slopes backward' },
} as const;

export const NOSE_SHAPES = {
  straight: { label: 'Straight', description: 'Classic straight bridge' },
  aquiline: { label: 'Aquiline', description: 'Slight downward curve or hook' },
  button: { label: 'Button', description: 'Small rounded tip' },
  upturned: { label: 'Upturned', description: 'Tip angles upward' },
  flat: { label: 'Flat', description: 'Wider, flatter bridge' },
  roman: { label: 'Roman', description: 'Prominent bridge with slight curve' },
  nubian: { label: 'Nubian', description: 'Wider base with straight bridge' },
} as const;

export const LIP_SHAPES = {
  full: { label: 'Full', description: 'Well-defined, voluminous lips' },
  thin: { label: 'Thin', description: 'Narrow lips with less volume' },
  wide: { label: 'Wide', description: 'Horizontally extended lips' },
  'heart-shaped': { label: 'Heart-Shaped', description: 'Prominent cupid\'s bow' },
  uneven: { label: 'Uneven', description: 'Asymmetrical upper and lower lip' },
  'bow-shaped': { label: 'Bow-Shaped', description: 'Distinct cupid\'s bow curve' },
} as const;

export const EYE_SHAPES = {
  almond: { label: 'Almond', description: 'Classic tapered eye shape' },
  round: { label: 'Round', description: 'Wide, circular eye shape' },
  hooded: { label: 'Hooded', description: 'Eyelid crease less visible' },
  upturned: { label: 'Upturned', description: 'Outer corners lift upward' },
  downturned: { label: 'Downturned', description: 'Outer corners angle downward' },
  monolid: { label: 'Monolid', description: 'Minimal crease, smooth lid' },
  protruding: { label: 'Protruding', description: 'Eyes that extend outward' },
} as const;

export const EYE_DISTANCES = {
  'close-set': { label: 'Close-Set', description: 'Eyes positioned closer together' },
  normal: { label: 'Normal', description: 'Average eye spacing' },
  'wide-set': { label: 'Wide-Set', description: 'Eyes positioned farther apart' },
} as const;

export const EYEBROW_STYLES = {
  arched: { label: 'Arched', description: 'High defined arch' },
  straight: { label: 'Straight', description: 'Minimal arch across brow' },
  curved: { label: 'Curved', description: 'Soft gentle curve' },
  angular: { label: 'Angular', description: 'Sharp defined angles' },
  thick: { label: 'Thick', description: 'Full substantial brows' },
  thin: { label: 'Thin', description: 'Delicate narrow brows' },
} as const;

export const FOREHEAD_SIZES = {
  small: { label: 'Small', description: 'Compact forehead area' },
  medium: { label: 'Medium', description: 'Average-sized forehead' },
  large: { label: 'Large', description: 'Prominent forehead' },
  high: { label: 'High', description: 'Extended vertical forehead' },
} as const;

export const SKIN_TONES = {
  fair: { label: 'Fair', description: 'Light, often burns easily' },
  light: { label: 'Light', description: 'Light with some warm tones' },
  medium: { label: 'Medium', description: 'Balanced warm/cool tones' },
  olive: { label: 'Olive', description: 'Greenish-golden undertones' },
  brown: { label: 'Brown', description: 'Warm medium to deep tones' },
  dark: { label: 'Dark', description: 'Deep rich tones' },
} as const;

export const SKIN_TEXTURES = {
  smooth: { label: 'Smooth', description: 'Even texture with minimal variation' },
  normal: { label: 'Normal', description: 'Balanced, healthy texture' },
  oily: { label: 'Oily', description: 'Excess shine and oil production' },
  dry: { label: 'Dry', description: 'Flaky or tight-feeling skin' },
  textured: { label: 'Textured', description: 'Uneven surface with bumps' },
} as const;
