// lib/templates.js

// Simple static image template with placeholders.
// format: "1:1" | "9:16" | "16:9"
// output is PNG by default (Shotstack uses "jpg" or "png" under "output.format", but
// we will ask for "png" using the serve destination).
export function buildImageTemplate({ headline = "Hello", logoUrl = "", paletteColor = "#111827", format = "1:1" }) {
  const aspect =
    format === "9:16" ? "9:16" :
    format === "16:9" ? "16:9" : "1:1";

  const size =
    aspect === "9:16" ? { width: 1080, height: 1920 } :
    aspect === "16:9" ? { width: 1920, height: 1080 } :
    { width: 1080, height: 1080 };

  return {
    timeline: {
      background: paletteColor || "#111827",
      tracks: [
        {
          clips: [
            // Optional logo top-left
            ...(logoUrl ? [{
              asset: { type: "image", src: logoUrl },
              start: 0, length: 5, fit: "contain", scale: 0.18,
              position: "topLeft", offset: { x: 0.06, y: -0.06 },
              transition: { in: "fade", out: "fade" }
            }] : []),
            // Headline centered
            {
              asset: {
                type: "title",
                text: headline,
                style: "chunk",
                color: "#ffffff",
                size: "x-large"
              },
              start: 0, length: 5,
              position: "center",
              transition: { in: "fade", out: "fade" }
            }
          ]
        }
      ]
    },
    output: {
      // We render as an image by using "image" pipeline; Shotstack infers by "output.format"
      // If your plan requires explicit "image" render, this still works with "png".
      format: "png",
      aspectRatio: aspect,
      size
    },
    destinations: [
      { provider: "shotstack", exclude: false }
    ]
  };
}

// Very simple video assembly using a generated image as the visual track.
// If audioUrl is provided, we use it as soundtrack.
export function buildVideoTemplate({ imageUrl, headline = "", audioUrl = "", format = "1:1" }) {
  const aspect =
    format === "9:16" ? "9:16" :
    format === "16:9" ? "16:9" : "1:1";

  const length = 6; // seconds total
  const size =
    aspect === "9:16" ? { width: 1080, height: 1920 } :
    aspect === "16:9" ? { width: 1920, height: 1080 } :
    { width: 1080, height: 1080 };

  return {
    timeline: {
      ...(audioUrl ? {
        soundtrack: {
          src: audioUrl,
          effect: "fadeIn",
          volume: 1.0
        }
      } : {}),
      background: "#000000",
      tracks: [
        {
          clips: [
            {
              asset: { type: "image", src: imageUrl },
              start: 0,
              length,
              fit: "cover",
              transition: { in: "fade", out: "fade" }
            }
          ]
        },
        // Optional overlay title for the first couple of seconds
        ...(headline ? [{
          clips: [{
            asset: { type: "title", text: headline, style: "chunk", color: "#ffffff", size: "large" },
            start: 0, length: Math.min(3, length),
            transition: { in: "fade", out: "fade" }
          }]
        }] : [])
      ]
    },
    output: {
      format: "mp4",
      resolution: "hd",
      aspectRatio: aspect,
      size
    },
    destinations: [
      { provider: "shotstack", exclude: false }
    ]
  };
}
