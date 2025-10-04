// lib/templates.js

// ---------- IMAGE TEMPLATE ----------
// Simple still frame with optional logo and a headline.
// format: "1:1" | "9:16" | "16:9"  (default "1:1")
// Output format is PNG (set by /renderImage serve destination).
export function buildImageTemplate({
  headline = 'Hello',
  logoUrl = '',
  paletteColor = '#111827', // slate-900
  format = '1:1',
} = {}) {
  const aspect =
    format === '9:16' ? '9:16' :
    format === '16:9' ? '16:9' : '1:1';

  // We let Shotstack scale; these are just for reference if needed.
  const size =
    aspect === '9:16'  ? { width: 1080, height: 1920 } :
    aspect === '16:9'  ? { width: 1920, height: 1080 } :
                         { width: 1080, height: 1080 };

  return {
    timeline: {
      background: paletteColor || '#111827',
      tracks: [
        {
          clips: [
            // Optional logo (top-left, fade in/out)
            ...(logoUrl ? [{
              asset: { type: 'image', src: logoUrl },
              start: 0, length: 5, fit: 'contain', scale: 0.16,
              position: 'topLeft', offset: { x: 0.06, y: -0.06 },
              transition: { in: 'fade', out: 'fade' },
            }] : []),

            // Headline (center)
            {
              asset: {
                type: 'title',
                text: String(headline || '').slice(0, 80),
                style: 'minimal',
                size: 0.85,
                color: '#ffffff',
                background: null
              },
              start: 0, length: 5,
              position: 'center',
              transition: { in: 'fade', out: 'fade' },
            },
          ],
        },
      ],
    },
    output: {
      format: 'png',
      resolution: aspect === '9:16' ? 'mobile' :
                  aspect === '16:9' ? 'hd' : 'sd',
      aspectRatio: aspect,
    },
  };
}

// ---------- VIDEO TEMPLATE ----------
// Builds a short video from a still image (and optional audio).
// format: "1:1" | "9:16" | "16:9"
export function buildVideoTemplate({
  imageUrl,
  headline = '',
  audioUrl = '',
  format = '1:1',
} = {}) {
  const aspect =
    format === '9:16' ? '9:16' :
    format === '16:9' ? '16:9' : '1:1';

  const clips = [];

  if (imageUrl) {
    clips.push({
      asset: { type: 'image', src: imageUrl },
      start: 0,
      length: 5,
      fit: 'cover',
      transition: { in: 'fade', out: 'fade' },
      effect: 'zoomIn', // small parallax
    });
  }

  // Optional small title overlay (bottom)
  if (headline) {
    clips.push({
      asset: {
        type: 'title',
        text: String(headline).slice(0, 60),
        style: 'minimal',
        size: 0.65,
        color: '#ffffff'
      },
      start: 0.3,
      length: 4.4,
      position: 'bottom',
      transition: { in: 'fade', out: 'fade' },
    });
  }

  const tracks = [{ clips }];

  // Optional audio track
  if (audioUrl) {
    tracks.push({
      clips: [{
        asset: { type: 'audio', src: audioUrl },
        start: 0, length: 5, volume: 1
      }]
    });
  }

  return {
    timeline: { tracks },
    output: {
      format: 'mp4',
      resolution: aspect === '9:16' ? 'mobile' :
                  aspect === '16:9' ? 'hd' : 'sd',
      aspectRatio: aspect,
      fps: 25,
    },
  };
}
