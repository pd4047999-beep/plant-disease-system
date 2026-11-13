"""
Class names and care information for the plant disease model.

IMPORTANT: CLASS_NAMES must be in exactly the same order the model was trained with
(alphabetical order of the PlantVillage class folders). If this order is wrong,
the app will show wrong diagnoses. Part E of the guide shows how to verify it.
"""

CLASS_NAMES = [
    'Apple___Apple_scab',
    'Apple___Black_rot',
    'Apple___Cedar_apple_rust',
    'Apple___healthy',
    'Blueberry___healthy',
    'Cherry_(including_sour)___Powdery_mildew',
    'Cherry_(including_sour)___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
    'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight',
    'Corn_(maize)___healthy',
    'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)',
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
    'Grape___healthy',
    'Orange___Haunglongbing_(Citrus_greening)',
    'Peach___Bacterial_spot',
    'Peach___healthy',
    'Pepper,_bell___Bacterial_spot',
    'Pepper,_bell___healthy',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy',
    'Raspberry___healthy',
    'Soybean___healthy',
    'Squash___Powdery_mildew',
    'Strawberry___Leaf_scorch',
    'Strawberry___healthy',
    'Tomato___Bacterial_spot',
    'Tomato___Early_blight',
    'Tomato___Late_blight',
    'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy',
]

SPECIES_DISPLAY = {
    'Cherry_(including_sour)': 'Cherry',
    'Corn_(maize)': 'Corn',
    'Pepper,_bell': 'Bell Pepper',
}

HEALTHY_TEXT = (
    "No disease detected. Keep up regular watering, sunlight, pruning "
    "and routine monitoring."
)

# class name -> (condition shown to the user, severity, care recommendation)
# Severity values must be one of: healthy, mild, moderate, severe.
# NOTE: the model only predicts the class. Severity and recommendations below are
# OUR simplified, general-purpose assignments (not produced by the model).
DISEASES = {
    'Apple___Apple_scab': (
        'Apple Scab', 'moderate',
        'Rake up and destroy fallen leaves, prune for better airflow, and ask your '
        'local agriculture office about a suitable fungicide program.'),
    'Apple___Black_rot': (
        'Black Rot', 'severe',
        'Prune out cankered branches and remove mummified fruit, destroy them away '
        'from the plant, and seek local advice on treatment.'),
    'Apple___Cedar_apple_rust': (
        'Cedar Apple Rust', 'moderate',
        'Remove nearby juniper or cedar plants where practical, clear infected leaves, '
        'and ask local experts about protective sprays in spring.'),
    'Cherry_(including_sour)___Powdery_mildew': (
        'Powdery Mildew', 'mild',
        'Prune to improve airflow, avoid overhead watering and excess nitrogen '
        'fertilizer, and consider a locally recommended fungicide if it spreads.'),
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': (
        'Gray Leaf Spot', 'moderate',
        'Remove crop residue after harvest, rotate crops, and choose resistant '
        'varieties next season. Use fungicide only if advised locally.'),
    'Corn_(maize)___Common_rust_': (
        'Common Rust', 'mild',
        'Usually mild. Monitor how fast it spreads and plant resistant varieties '
        'next season.'),
    'Corn_(maize)___Northern_Leaf_Blight': (
        'Northern Leaf Blight', 'moderate',
        'Remove crop residue, rotate crops, and use resistant varieties. Ask a local '
        'expert about fungicide if the infection is heavy.'),
    'Grape___Black_rot': (
        'Black Rot', 'severe',
        'Remove and destroy infected leaves and shriveled fruit, improve airflow '
        'through pruning, and seek local advice on fungicide timing.'),
    'Grape___Esca_(Black_Measles)': (
        'Esca (Black Measles)', 'severe',
        'There is no quick cure. Remove severely affected wood in dry weather, '
        'disinfect pruning tools, and consult a local expert.'),
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': (
        'Leaf Blight (Isariopsis Leaf Spot)', 'moderate',
        'Remove infected leaves, improve airflow, avoid wetting foliage, and ask '
        'locally about fungicide options.'),
    'Orange___Haunglongbing_(Citrus_greening)': (
        'Citrus Greening (Huanglongbing)', 'severe',
        'There is no cure. Report suspected cases to your local agriculture '
        'authority, remove infected trees as advised, and control psyllid insects.'),
    'Peach___Bacterial_spot': (
        'Bacterial Spot', 'moderate',
        'Prune for airflow, avoid overhead watering, and ask a local expert about '
        'copper-based treatments.'),
    'Pepper,_bell___Bacterial_spot': (
        'Bacterial Spot', 'moderate',
        'Remove infected leaves, avoid handling wet plants, rotate crops, and ask a '
        'local expert about copper-based sprays.'),
    'Potato___Early_blight': (
        'Early Blight', 'moderate',
        'Remove infected lower leaves, avoid overhead watering, rotate crops, and '
        'consider a recommended fungicide if it spreads.'),
    'Potato___Late_blight': (
        'Late Blight', 'severe',
        'Act quickly: remove and destroy infected plants, avoid wet foliage, and seek '
        'local fungicide advice. It spreads fast in humid weather.'),
    'Squash___Powdery_mildew': (
        'Powdery Mildew', 'mild',
        'Improve airflow, water at the base of the plant, remove badly affected '
        'leaves, and use a locally recommended fungicide if needed.'),
    'Strawberry___Leaf_scorch': (
        'Leaf Scorch', 'mild',
        'Remove infected leaves, avoid overhead watering, give plants space for '
        'airflow, and renew old beds.'),
    'Tomato___Bacterial_spot': (
        'Bacterial Spot', 'moderate',
        'Remove infected leaves, avoid overhead watering, do not handle wet plants, '
        'and ask a local expert about copper-based sprays.'),
    'Tomato___Early_blight': (
        'Early Blight', 'moderate',
        'Remove affected lower leaves, mulch to stop soil splash, water at the base, '
        'and rotate crops.'),
    'Tomato___Late_blight': (
        'Late Blight', 'severe',
        'Act quickly: remove and destroy infected plants or leaves, avoid wet '
        'foliage, and seek local fungicide advice. It spreads fast in humid weather.'),
    'Tomato___Leaf_Mold': (
        'Leaf Mold', 'mild',
        'Increase airflow, reduce humidity, avoid wetting leaves, and remove '
        'affected leaves.'),
    'Tomato___Septoria_leaf_spot': (
        'Septoria Leaf Spot', 'moderate',
        'Remove infected leaves, mulch, water at the base, avoid working among wet '
        'plants, and rotate crops.'),
    'Tomato___Spider_mites Two-spotted_spider_mite': (
        'Spider Mites', 'moderate',
        'Rinse leaves with water, remove heavily infested leaves, avoid dusty dry '
        'conditions, and use insecticidal soap if needed.'),
    'Tomato___Target_Spot': (
        'Target Spot', 'moderate',
        'Remove infected leaves, improve airflow, avoid overhead watering, and '
        'rotate crops.'),
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus': (
        'Yellow Leaf Curl Virus', 'severe',
        'There is no cure. Remove and destroy infected plants, control the whiteflies '
        'that spread the virus, and use resistant varieties.'),
    'Tomato___Tomato_mosaic_virus': (
        'Tomato Mosaic Virus', 'severe',
        'There is no cure. Remove infected plants, wash hands and disinfect tools, '
        'and keep new plants away from infected ones.'),
}


def species_of(class_name):
    raw = class_name.split('___')[0]
    return SPECIES_DISPLAY.get(raw, raw.replace('_', ' '))


def describe(class_name):
    """Turn a raw model class name into the fields our app stores and shows."""
    species = species_of(class_name)
    if class_name.endswith('___healthy'):
        return {
            'species_name': species,
            'detected_condition': 'Healthy',
            'severity': 'healthy',
            'recommendation': HEALTHY_TEXT,
        }
    condition, severity, recommendation = DISEASES[class_name]
    return {
        'species_name': species,
        'detected_condition': condition,
        'severity': severity,
        'recommendation': recommendation,
    }
