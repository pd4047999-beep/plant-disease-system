"""
Checks that the model loads and that CLASS_NAMES is in the right order.

Usage (from the backend/ folder, venv active):
    python verify_model.py "C:/Users/YOU/pv-test/raw/color"
"""
import random
import sys
from collections import Counter
from pathlib import Path

from detection.predictor import predict

PER_CLASS = 15
IMAGE_SUFFIXES = {'.jpg', '.jpeg', '.png'}

if len(sys.argv) != 2:
    sys.exit('Usage: python verify_model.py <folder with one sub-folder per class>')

root = Path(sys.argv[1])
random.seed(0)
total = correct = 0

for class_dir in sorted(p for p in root.iterdir() if p.is_dir()):
    images = [f for f in class_dir.iterdir() if f.suffix.lower() in IMAGE_SUFFIXES]
    if not images:
        continue
    sample = random.sample(images, min(PER_CLASS, len(images)))
    predicted = Counter()
    for path in sample:
        predicted[predict(str(path))['class_name']] += 1
    hits = predicted[class_dir.name]
    total += len(sample)
    correct += hits
    print(f"{class_dir.name}: {hits}/{len(sample)} correct")
    if hits < len(sample):
        for name, count in predicted.most_common(3):
            if name != class_dir.name:
                print(f"    also predicted: {name} x{count}")

print(f"\nOverall: {correct}/{total} = {100 * correct / total:.1f}%")
