// Game FPS prediction (Model V2) is trained on 1080p data with the Medium and Ultra presets only.
export const PREDICTION_RESOLUTION = '1920x1080';
export const PREDICTION_PRESETS = ['Medium', 'Ultra'];

export const RESOLUTIONS = [
  { value: '1920x1080', label: '1080p (FHD) — Supported' },
  { value: '2560x1440', label: '1440p (QHD) — Still Developing' },
  { value: '3840x2160', label: '4K (UHD) — Still Developing' },
];

export const QUALITY_PRESETS = PREDICTION_PRESETS.map((value) => ({ value, label: value }));

export const RAM_OPTIONS = [
  { value: '4', label: '4 GB' },
  { value: '8', label: '8 GB' },
  { value: '16', label: '16 GB (Recommended)' },
  { value: '32', label: '32 GB' },
  { value: '64', label: '64 GB' },
];
