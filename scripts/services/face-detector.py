#!/usr/bin/env python3
import base64
import json
import os
import subprocess
import sys
import tempfile
import urllib.request

PACKAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "face-detector-python"))
if os.path.isdir(PACKAGE_DIR):
    sys.path.insert(0, PACKAGE_DIR)

MODEL_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
MODEL_NAME = "face_detection_yunet_2023mar.onnx"
VERSION = "yunet-v1"

def emit(face_zone=None):
    sys.stdout.write(json.dumps({"faceZone": face_zone}, ensure_ascii=True))

def ensure_model(model_dir):
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, MODEL_NAME)
    if os.path.exists(model_path) and os.path.getsize(model_path) > 1024:
        return model_path
    temp_path = model_path + ".download"
    try:
        urllib.request.urlretrieve(MODEL_URL, temp_path)
        if os.path.getsize(temp_path) <= 1024:
            raise RuntimeError("invalid model")
        os.replace(temp_path, model_path)
        return model_path
    except Exception:
        try:
            if os.path.exists(temp_path): os.remove(temp_path)
        except Exception:
            pass
        return None

def zone_from_face(face, width, height, payload):
    x, y, w, h = [float(value) for value in face[:4]]
    score = float(face[-1]) if len(face) else 0.0
    fx, fy, fw, fh = x / width, y / height, w / width, h / height
    px, py = max(.045, fw * .18), max(.045, fh * .14)
    safe_x, safe_y = max(0.0, fx - px), max(0.0, fy - py)
    safe_w, safe_h = min(1.0 - safe_x, fw + px * 2), min(1.0 - safe_y, fh + py * 2)
    cx = fx + fw / 2
    return {"faceX": round(fx, 4), "faceY": round(fy, 4), "faceW": round(fw, 4), "faceH": round(fh, 4), "safeX": round(safe_x, 4), "safeY": round(safe_y, 4), "safeW": round(safe_w, 4), "safeH": round(safe_h, 4), "faceArea": "left" if cx < .34 else "right" if cx > .66 else "center", "confidence": round(score, 4), "detectorVersion": VERSION, "sourceFingerprint": payload.get("sourceFingerprint", ""), "beatStart": payload.get("beatStart"), "beatEnd": payload.get("beatEnd"), "sampledAt": payload.get("sampledAt")}

def main():
    try:
        payload = json.loads(sys.stdin.read() or "{}")
        import cv2
        import numpy as np
        model = ensure_model(payload.get("modelDir") or os.path.join(os.getcwd(), "data", "models"))
        if not model: return emit()
        image_bytes = base64.b64decode(payload.get("frameBase64", "")) if payload.get("frameBase64") else b""
        if not image_bytes:
            command = [payload.get("ffmpegPath") or "ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", str(payload.get("sampledAt", 0)), "-i", payload.get("videoPath", ""), "-vframes", "1", "-f", "image2pipe", "-vcodec", "mjpeg", "pipe:1"]
            image_bytes = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=18, check=False).stdout
        if not image_bytes: return emit()
        image = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
        if image is None: return emit()
        height, width = image.shape[:2]
        detector = cv2.FaceDetectorYN.create(model, "", (width, height), .82, .3, 5000)
        _, faces = detector.detect(image)
        if faces is None or len(faces) == 0: return emit()
        face = max(faces, key=lambda row: float(row[2]) * float(row[3]))
        return emit(zone_from_face(face, width, height, payload))
    except Exception:
        return emit()

if __name__ == "__main__":
    main()
