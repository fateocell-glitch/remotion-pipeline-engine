#!/usr/bin/env python
import argparse
import json
import os
import sys
from pathlib import Path

from faster_whisper import WhisperModel


ZH_PROMPT = (
    "这是一段数码科技产品评测视频，请保持完整标点符号（逗号，句号。问号？感叹号！），"
    "包含专业词汇：钛金属、折痕、iPhone Duo、纳米纹理玻璃、Apple Pencil、Magsafe、IP68、A20 Pro。"
)
EN_PROMPT = (
    "Tech product review video. Include proper punctuation (commas, periods, question marks). "
    "Key terms: iPhone Duo, titanium, crease, nano-texture glass."
)


def load_model(model_size, cpu_threads):
    try:
        model = WhisperModel(model_size, device="cuda", compute_type="float16")
        print("TRANSCRIBE_MODEL " + json.dumps({"model": model_size, "device": "cuda", "compute_type": "float16"}), flush=True)
        return model
    except Exception as error:
        threads = max(1, int(cpu_threads or 1))
        print(
            "TRANSCRIBE_MODEL_FALLBACK "
            + json.dumps({"model": model_size, "from": "cuda", "to": "cpu", "compute_type": "int8", "cpu_threads": threads, "error": str(error)}),
            flush=True,
        )
        model = WhisperModel(model_size, device="cpu", compute_type="int8", cpu_threads=threads)
        print("TRANSCRIBE_MODEL " + json.dumps({"model": model_size, "device": "cpu", "compute_type": "int8", "cpu_threads": threads}), flush=True)
        return model

def caption_row(index, segment):
    text = " ".join(str(segment.text or "").split()).strip()
    return {
        "id": f"subtitle-{index:03d}",
        "start": round(float(segment.start), 2),
        "end": round(float(segment.end), 2),
        "text": text,
    }


def main():
    parser = argparse.ArgumentParser(description="Transcribe audio with faster-whisper for the video studio pipeline.")
    parser.add_argument("--audio", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--language", default="zh", choices=["zh", "en"])
    parser.add_argument("--task", default="transcribe", choices=["transcribe", "translate"])
    parser.add_argument("--model", default=os.environ.get("FASTER_WHISPER_MODEL", "medium"))
    parser.add_argument("--beam-size", type=int, default=int(os.environ.get("FASTER_WHISPER_BEAM_SIZE", "1")))
    parser.add_argument("--cpu-threads", type=int, default=int(os.environ.get("FASTER_WHISPER_CPU_THREADS", str(min(8, os.cpu_count() or 8)))))
    args = parser.parse_args()

    audio_path = Path(args.audio)
    output_path = Path(args.output)
    if not audio_path.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    model = load_model(args.model, args.cpu_threads)
    prompt = EN_PROMPT if args.task == "translate" or args.language == "en" else ZH_PROMPT
    segments, _info = model.transcribe(
        str(audio_path),
        language=args.language,
        task=args.task,
        initial_prompt=prompt,
        beam_size=max(1, int(args.beam_size)),
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 500},
    )

    captions = []
    for segment in segments:
        row = caption_row(len(captions) + 1, segment)
        if not row["text"] or row["end"] <= row["start"]:
          continue
        captions.append(row)
        print("TRANSCRIBE_PROGRESS " + json.dumps({"count": len(captions), "start": row["start"], "end": row["end"], "text": row["text"]}, ensure_ascii=False), flush=True)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(captions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("TRANSCRIBE_DONE " + json.dumps({"count": len(captions), "output": str(output_path)}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("TRANSCRIBE_ERROR " + json.dumps({"error": str(error)}, ensure_ascii=False), file=sys.stderr, flush=True)
        raise



