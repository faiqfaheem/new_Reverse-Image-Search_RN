from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any

app = FastAPI(
    title="Reverse Image Search API",
    description="Backend API for Reverse Image Search React Native App",
    version="1.0.0",
)

# ── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 1. Text-to-Image 16 Universal Styles Dataset ────────────────────────────
TEXT_TO_IMAGE_STYLES: List[Dict[str, Any]] = [
    {
        "id": "3d-model",
        "name": "3D Model",
        "stylePrompt": "3d-model",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_3D_MODEL",
    },
    {
        "id": "analog-film",
        "name": "Analog Film",
        "stylePrompt": "analog-film",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_ANALOG_FILM",
    },
    {
        "id": "anime",
        "name": "Anime",
        "stylePrompt": "anime",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_ANIME",
    },
    {
        "id": "cinematic",
        "name": "Cinematic",
        "stylePrompt": "cinematic",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_CINEMATIC",
    },
    {
        "id": "comic-book",
        "name": "Comic Book",
        "stylePrompt": "comic-book",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_COMIC_BOOK",
    },
    {
        "id": "digital-art",
        "name": "Digital Art",
        "stylePrompt": "digital-art",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_DIGITAL_ART",
    },
    {
        "id": "enhance",
        "name": "Enhance",
        "stylePrompt": "enhance",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_ENHANCE_LINE_ART",
    },
    {
        "id": "fantasy-art",
        "name": "Fantasy Art",
        "stylePrompt": "fantasy-art",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_FANTASY_ART",
    },
    {
        "id": "isometric",
        "name": "Isometric",
        "stylePrompt": "isometric",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_ISOMETRIC",
    },
    {
        "id": "line-art",
        "name": "Line Art",
        "stylePrompt": "line-art",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_LINE_ART",
    },
    {
        "id": "low-poly",
        "name": "Low Poly",
        "stylePrompt": "low-poly",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_LOW_POLY",
    },
    {
        "id": "modeling-compound",
        "name": "Modeling Compound",
        "stylePrompt": "modeling-compound",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_MODELING_COMPOUND",
    },
    {
        "id": "neon-punk",
        "name": "Neon Punk",
        "stylePrompt": "neon-punk",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_NEON_PUNK",
    },
    {
        "id": "origami",
        "name": "Origami",
        "stylePrompt": "origami",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_ORIGAMI",
    },
    {
        "id": "photographic",
        "name": "Photographic",
        "stylePrompt": "photographic",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_PHOTOGRAPHIC",
    },
    {
        "id": "pixel-art",
        "name": "Pixel Art",
        "stylePrompt": "pixel-art",
        "imageUrl": "YOUR_SENIOR_SERVER_URL_FOR_PIXEL_ART",
    },
]

# ── 2. Image-to-Image / Face-Swap Templates Dataset ────────────────────────
IMAGE_TO_IMAGE_TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "monster-hunter",
        "name": "Monster Hunter",
        "stylePrompt": (
            "Cinematic medium close-up portrait of a legendary white-haired monster hunter warrior "
            "with a fully visible, weathered face, intense focused amber-gold eyes, stubble, and "
            "detailed skin textures. Wearing intricate dark studded leather armor plates, layered "
            "heavy fabrics, and silver steel sword hilts visible across his back. Standing in a "
            "gloomy medieval forest at dusk with atmospheric fog, glowing embers, and moody fantasy "
            "lighting. Epic cinematic lighting, highly detailed textures, photorealistic, 8k "
            "resolution, Unreal Engine 5 render, blockbuster dark fantasy movie aesthetic."
        ),
        "templateUrl": "YOUR_SENIOR_SERVER_URL_FOR_TEMPLATE_1",
    },
    {
        "id": "japanese-samurai",
        "name": "Japanese Samurai",
        "stylePrompt": (
            "Cinematic medium shot portrait of a fearless Japanese samurai warrior with a fully "
            "visible, determined facial expression, sharp features, traditional top-knot hairstyle, "
            "and subtle battle scars. Wearing intricate layered traditional samurai armor plating "
            "(yoroi) tied with silk cords, under-kimono fabric textures, and a traditional katana "
            "sword strapped at the waist. Standing in an atmospheric bamboo forest during a misty "
            "morning with soft fog and glowing sun rays filtering through the tall green stalks. "
            "Epic cinematic lighting, highly detailed textures, photorealistic, 8k resolution, "
            "Unreal Engine 5 render, blockbuster historical epic movie aesthetic."
        ),
        "templateUrl": "YOUR_SENIOR_SERVER_URL_FOR_TEMPLATE_2",
    },
    {
        "id": "historical-gladiator",
        "name": "Historical Gladiator",
        "stylePrompt": (
            "Cinematic medium close-up portrait of a fierce historical gladiator warrior with a "
            "fully visible, weathered face, intense focused expression, short trimmed hair, and "
            "light dust and sweat textures on the skin. Wearing detailed metallic roman plate armor, "
            "leather straps, studded bracers, and a crimson cloth tunic. Standing inside a dusty "
            "ancient colosseum arena under the bright sun, holding an ornate gladius sword. Epic "
            "cinematic lighting, volumetric dust particles, dramatic shadows, photorealistic textures, "
            "8k resolution, Unreal Engine 5 render, blockbuster historical epic movie aesthetic."
        ),
        "templateUrl": "YOUR_SENIOR_SERVER_URL_FOR_TEMPLATE_3",
    },
    {
        "id": "pirate-captain",
        "name": "Pirate Captain",
        "stylePrompt": (
            "Cinematic medium shot portrait of an eccentric pirate captain with a fully visible, "
            "weathered face, braided dreadlocks, beads, and a classic weathered leather tricorn hat "
            "decorated with feathers. Wearing layered vintage pirate attire with distressed leather "
            "coats, linen shirts, and ornate belts. Standing on the wooden deck of an antique pirate "
            "ship during sunset, holding a vintage compass or flintlock pistol. Warm golden hour "
            "lighting, dramatic smoke, ocean waves in the background, photorealistic, 8k resolution, "
            "Unreal Engine 5 render, blockbuster adventure movie aesthetic."
        ),
        "templateUrl": "YOUR_SENIOR_SERVER_URL_FOR_TEMPLATE_4",
    },
    {
        "id": "young-ninja",
        "name": "Young Ninja",
        "stylePrompt": (
            "Dynamic high-energy close-up anime portrait of a young ninja with spiky blonde hair, "
            "bright blue eyes, and three distinctive whisker-like markings on each cheek. Wearing a "
            "high-collared orange and black combat uniform with a metal forehead protector headband "
            "featuring a spiral engraved symbol. Energetic swirling chakra aura effects around him, "
            "intense focused expression, vibrant cel-shaded coloring, clean crisp line art, studio "
            "masterpiece visual aesthetics, dynamic expressive lighting, 8k resolution, high-end "
            "animation render."
        ),
        "templateUrl": "YOUR_SENIOR_SERVER_URL_FOR_TEMPLATE_5",
    },
    {
        "id": "professional-hitman",
        "name": "Professional Hitman",
        "stylePrompt": (
            "Cinematic medium shot portrait of a professional hitman with a fully visible, "
            "clean-shaved face, intense focused expression, and long dark slicked-back hair. Wearing "
            "a sharp, tailored black three-piece suit, crisp white dress shirt, and a black silk tie. "
            "Standing in a dimly lit rainy neon-lit alleyway or luxury hotel lobby at night, holding "
            "a sleek tactical firearm. Moody atmospheric smoke, dramatic rim lighting, reflection on "
            "wet pavement, photorealistic, 8k resolution, Unreal Engine 5 render, blockbuster action "
            "movie aesthetic."
        ),
        "templateUrl": "YOUR_SENIOR_SERVER_URL_FOR_TEMPLATE_6",
    },
    {
        "id": "tech-savvy-hero",
        "name": "Tech-Savvy Hero",
        "stylePrompt": (
            "Cinematic close-up portrait of a tech-savvy hero with face fully visible and uncovered, "
            "wearing a high-tech crimson and gold metallic armor suit. Intricate mechanical panel "
            "lines, polished chrome alloy reflections, glowing cyan arc-reactor core on the chest "
            "casting vibrant light. Dark sci-fi workshop background, atmospheric haze, dramatic studio "
            "rim lighting, photorealistic textures, 8k resolution, Unreal Engine 5 render, blockbuster "
            "movie aesthetic, with a good hairstyle."
        ),
        "templateUrl": "YOUR_SENIOR_SERVER_URL_FOR_TEMPLATE_7",
    },
    {
        "id": "cybernetic-warrior",
        "name": "Cybernetic Warrior",
        "stylePrompt": (
            "Cinematic close-up portrait of a powerful cybernetic human warrior with advanced "
            "mechanical exoskeleton armor integrated into the body. Intricate metallic plating, "
            "glowing cybernetic blue neon optic eye, exposed high-tech electronic circuits, "
            "fiber-optic wires, and chrome alloy components. Dark sci-fi laboratory background with "
            "atmospheric smoke, dramatic cyan and orange rim lighting, hyper-realistic reflections, "
            "8k resolution, Unreal Engine 5 render style, photorealistic blockbuster aesthetic."
        ),
        "templateUrl": "YOUR_SENIOR_SERVER_URL_FOR_TEMPLATE_8",
    },
    {
        "id": "superman-hero",
        "name": "Superman Hero",
        "stylePrompt": (
            "Cinematic close-up portrait of Superman flying forward with powerful momentum, heroic "
            "expression, dynamic heroic angle. Detailed blue and red superhero suit with textured "
            "fabric weave, iconic metallic 'S' shield emblem on the chest with gold and red accents. "
            "Majestic red cape flowing dramatically in the wind behind him. Epic cinematic lighting, "
            "volumetric light rays, dramatic shadows, realistic textures, highly detailed, "
            "photorealistic, 8k resolution, Unreal Engine 5 render, sharp focus, blockbuster movie "
            "aesthetic."
        ),
        "templateUrl": "YOUR_SENIOR_SERVER_URL_FOR_TEMPLATE_9",
    },
]


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    """Health check root endpoint."""
    return {"status": "ok", "message": "Reverse Image Search API is running."}


@app.get("/api/text-to-image-styles", response_model=List[Dict[str, Any]])
def get_text_to_image_styles():
    """
    Returns the list of 16 text-to-image generation styles.
    Each item contains:
      - id           : unique string identifier
      - name         : human-readable style name
      - stylePrompt  : AI prompt string describing the visual style
      - imageUrl     : placeholder URL for style card image
    """
    return TEXT_TO_IMAGE_STYLES


@app.get("/api/image-to-image-templates", response_model=List[Dict[str, Any]])
def get_image_to_image_templates():
    """
    Returns the list of image-to-image / face-swap templates.
    Each item contains:
      - id           : unique string identifier
      - name         : human-readable template name
      - stylePrompt  : detailed prompt description for template creation
      - templateUrl  : placeholder URL for template asset
    """
    return IMAGE_TO_IMAGE_TEMPLATES


# Backward compatibility alias endpoint
@app.get("/api/templates", response_model=List[Dict[str, Any]])
def get_templates():
    """Returns image-to-image templates for backward compatibility."""
    return IMAGE_TO_IMAGE_TEMPLATES
