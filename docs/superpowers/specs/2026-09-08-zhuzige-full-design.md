# Zhuzige Full Remake Design

## Goal

Render a 7 minute 22 second, 1920x1080 talking-head remake that uses the source `zhuzigeceo` audio and transcript timing, repeats `public/test.mp4` as its background, and applies the proven JasonWu information-graphic treatment.

## Inputs

- Audio: `out/zhuzigeceo-audio.wav`
- Transcript timing: `out/zhuzigeceo-whisper.vtt`
- Source text: `out/zhuzigeceo-whisper.txt`
- Background video: `public/test.mp4`

## Composition

- Add `ZhuzigeFull` at 30 fps, 1920x1080, and 13,279 frames.
- The background loops through the source test video for the entire composition.
- The source WAV is the only audible track.
- Six section cues cover: succession, hardware record, product recovery, leadership and organization, future hardware and AI, and final viewpoint.
- Existing JasonWu scene modules are reused, with longer cue data rather than a new visual system.

## Subtitle Rules

- Render exactly two lines: Chinese above English.
- Chinese may use the existing restrained keyword emphasis.
- English is neutral `rgba(255,255,255,0.88)` only; it must not use blue, gold, green, glow, or animated keyword colors.
- Use source VTT timings. Translate each caption cue into concise English that fits a single supporting line.

## Rendering

- Render six adjacent frame ranges using Remotion h264, `crf=20`, `yuv420p`, `--concurrency=75%`, and `--x264-preset=veryfast`.
- Concatenate with the Remotion ffmpeg binary and `-c copy`, so no segment is re-encoded.
- Produce `out/zhuzigeceo-remake-full.mp4`.
- Verify TypeScript, segment output existence, final duration, and stills at the opening, middle, and closing sections.

## Constraints

- Do not alter AI Link model endpoints, ports, base URLs, API bases, or API keys.
- Do not add runtime dependencies.
- Preserve unrelated working-tree changes.

