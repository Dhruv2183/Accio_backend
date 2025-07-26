import sys
import os
import torch
import cv2
from transformers import BlipProcessor, BlipForConditionalGeneration

# Load BLIP model and processor
device = "cuda" if torch.cuda.is_available() else "cpu"
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(device)

def extract_frames(video_path, frame_interval=60):
    frames = []
    vidcap = cv2.VideoCapture(video_path)
    success, image = vidcap.read()
    count = 0
    while success:
        if count % frame_interval == 0:
            frames.append(image)
        success, image = vidcap.read()
        count += 1
    return frames

def generate_caption(image):
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    inputs = processor(images=image_rgb, return_tensors="pt").to(device)
    out = model.generate(**inputs)
    return processor.decode(out[0], skip_special_tokens=True)

def main(video_path):
    if not os.path.exists(video_path):
        print("⚠️ Video file not found.")
        return

    frames = extract_frames(video_path, frame_interval=60)  # Adjust interval for density
    if not frames:
        print("⚠️ No frames extracted.")
        return

    captions = []
    for i, frame in enumerate(frames):
        try:
            caption = generate_caption(frame)
            captions.append(f"[Frame {i}] {caption}")
        except Exception as e:
            captions.append(f"[Frame {i}] Caption failed: {str(e)}")

    result = "\n".join(captions)
    print(result)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Usage: python caption_video.py <video_path>")
    else:
        main(sys.argv[1])
