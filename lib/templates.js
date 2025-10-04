// lib/templates.js

// Map tone → palette color (simple baseline you can refine later)
function toneToColor(tone = 'friendly') {
  const map = {
    friendly: '#111827',   // slate-900
    bold: '#111111',
    professional: '#0f172a', // navy-ish
    playful: '#1f2937',     // gray-800
  };
  return map[tone] || '#111827';
}

// Size map by format/aspect
function aspectToSize(format = '1:1') {
  if (format === '9:16') return { width: 1080, height: 1920 };
  if (format === '16:9') return { width: 1920, height: 1080 };
  return { width: 1080, height: 1080 }; // 1:1 default
}

/**
 * Build an IMAGE Edit payload
 * Produces PNG via output.format = 'png'
 */
export function buildImageTemplate({
  headline = 'Hello from Flows Alpha',
  logoUrl = '',
  tone = 'friendly',
  format = '1:1',
}) {
  const bg = toneToColor(tone);
  const { width, height } = aspectToSize(format);

  return {
    timeline: {
      background: bg,
      tracks: [
        // Optional logo top-left
        ...(logoUrl
          ? [
              {
                clips: [
                  {
                    asset: { type: 'image', src: logoUrl },
                    start: 0,
                    length: 5,
                    fit: 'contain',
                    scale: 0.18,
                    position: 'topLeft',
                    offset: { x: 0.06, y: -0.06 },
                    transition: { in: 'fade', out: 'fade' },
                  },
                ],
              },
            ]
          : []),
        // Headline centered
        {
          clips: [
            {
              asset: {
                type: 'title',
                text: String(headline).slice(0, 80),
                style: 'minimal',
                size: 'small', // quick/readable baseline
                color: '#ffffff',
                background: null,
              },
              start: 0,
              length: 5,
              position: 'center',
              transition: { in: 'fade', out: 'fade' },
            },
          ],
        },
      ],
    },
    output: {
      format: 'png',           // ← IMPORTANT: makes it a still image
      resolution: width >= 1920 || height >= 1920 ? 'hd' : 'sd',
      aspectRatio: format === '9:16' ? '9:16' : format === '16:9' ? '16:9' : '1:1',
      size: { width, height }, // respected by serve destination
    },
  };
}

/**
 * Build a VIDEO Edit payload
 * Uses the still image, adds optional audio VO, overlays headline again.
 */
export function buildVideoTemplate({
  imageUrl,
  headline = 'Hello from Flows Alpha',
  audioUrl = '',
  tone = 'friendly',
  format = '1:1',
}) {
  const bg = toneToColor(tone);
  const { width, height } = aspectToSize(format);

  const tracks = [
    // Background color (so letterboxing looks consistent)
    {
      clips: [
        {
          asset: { type: 'title', text: ' ', style: 'minimal', size: 'xxsmall', color: bg, background: bg },
          start: 0,
          length: 3,
        },
      ],
    },
  ];

  // Main still image filling the frame
  if (imageUrl) {
    tracks.push({
      clips: [
        {
          asset: { type: 'image', src: imageUrl },
          start: 0,
          length: 3,
          fit: 'cover',
          transition: { in: 'fade', out: 'fade' },
        },
      ],
    });
  }

  // Headline overlay
  tracks.push({
    clips: [
      {
        asset: {
          type: 'title',
          text: String(headline).slice(0, 80),
          style: 'minimal',
          size: 'small',
          color: '#ffffff',
          background: null,
        },
        start: 0.2,
        length: 2.6,
        position: 'center',
      },
    ],
  });

  // Optional VO
  if (audioUrl) {
    tracks.push({
      clips: [
        {
          asset: { type: 'audio', src: audioUrl },
          start: 0,
          length: 3,
          volume: 1.0,
        },
      ],
    });
  }

  return {
    timeline: { background: bg, tracks },
    output: {
      format: 'mp4',
      resolution:
        format === '9:16' || format === '16:9'
          ? 'hd'
          : 'sd',
      aspectRatio: format === '9:16' ? '9:16' : format === '16:9' ? '16:9' : '1:1',
      size: { width, height },
      fps: 30,
    },
  };
}
