from pathlib import Path

import torch
from PIL import Image
from torch import nn
from torchvision import models, transforms

from .disease_info import CLASS_NAMES, describe

MODEL_PATH = Path(__file__).resolve().parent / 'ml' / 'mobilenetv2_plant.pth'

# Below this confidence (in percent) we say "not sure" instead of guessing.
CONFIDENCE_THRESHOLD = 60.0

_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

_model = None


def _build_model():
    # Same architecture the model author describes in the model card.
    model = models.mobilenet_v2(weights=None)
    model.classifier[1] = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(model.classifier[1].in_features, len(CLASS_NAMES)),
    )
    state = torch.load(MODEL_PATH, map_location='cpu', weights_only=True)
    model.load_state_dict(state)
    model.eval()
    return model


def get_model():
    """Load the model once, the first time it is needed, then reuse it."""
    global _model
    if _model is None:
        _model = _build_model()
    return _model


def predict(image_file, top_k=3):
    """
    image_file: a file path or an open file object.
    Always returns 'class_name' and 'confidence_score' (percent).
    """
    image = Image.open(image_file).convert('RGB')
    batch = _transform(image).unsqueeze(0)

    with torch.no_grad():
        probs = torch.softmax(get_model()(batch), dim=1)[0]

    top_probs, top_idx = probs.topk(top_k)
    guesses = []
    for p, i in zip(top_probs.tolist(), top_idx.tolist()):
        info = describe(CLASS_NAMES[i])
        guesses.append({
            'class_name': CLASS_NAMES[i],
            'label': f"{info['species_name']} - {info['detected_condition']}",
            'confidence_score': round(p * 100, 1),
        })

    best = guesses[0]
    result = {
        'class_name': best['class_name'],
        'confidence_score': best['confidence_score'],
        'uncertain': best['confidence_score'] < CONFIDENCE_THRESHOLD,
        'alternatives': guesses,
    }
    if not result['uncertain']:
        result.update(describe(best['class_name']))
    return result
