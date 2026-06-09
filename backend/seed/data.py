"""Static content pools for seeding a Pinterest-like dataset."""

USERS = [
    {
        "email": "alex@demo.com",
        "username": "alexmorgan",
        "full_name": "Alex Morgan",
        "bio": "Design lover · collecting ideas for my dream home 🏡",
    },
    {
        "email": "sara@demo.com",
        "username": "saradesigns",
        "full_name": "Sara Lee",
        "bio": "Interior stylist & plant mom 🌿 sharing cozy corners",
    },
    {
        "email": "mike@demo.com",
        "username": "mikecooks",
        "full_name": "Mike Chen",
        "bio": "Home cook chasing the perfect weeknight dinner 🍜",
    },
    {
        "email": "nina@demo.com",
        "username": "ninatravels",
        "full_name": "Nina Patel",
        "bio": "Wanderer · 30 countries and counting ✈️",
    },
    {
        "email": "leo@demo.com",
        "username": "leostudio",
        "full_name": "Leo Garcia",
        "bio": "Artist & maker. Mostly paint, sometimes pixels.",
    },
]

# topic name -> category label
TOPICS = [
    ("Home Decor", "For you"),
    ("Food and Drink", "Food"),
    ("Fashion", "Style"),
    ("Travel", "Explore"),
    ("Art", "Creative"),
    ("Nature", "Outdoors"),
    ("DIY and Crafts", "Creative"),
    ("Beauty", "Style"),
    ("Architecture", "Design"),
    ("Photography", "Creative"),
    ("Animals", "For you"),
    ("Quotes", "For you"),
]

# category -> (titles, descriptions)
CONTENT = {
    "Home Decor": {
        "titles": [
            "Cozy minimalist living room",
            "Warm neutral bedroom inspo",
            "Scandinavian reading nook",
            "Earthy boho corner",
            "Modern entryway styling",
            "Soft lighting ideas for fall",
        ],
        "desc": "Layered textures, warm tones, and a calm palette to make any space feel like home.",
    },
    "Food and Drink": {
        "titles": [
            "30-minute garlic butter pasta",
            "Cozy autumn soup bowl",
            "Brunch board for two",
            "Matcha latte at home",
            "Weeknight stir-fry bowls",
            "No-bake chocolate tart",
        ],
        "desc": "Simple, comforting recipes you can pull together on a busy weeknight.",
    },
    "Fashion": {
        "titles": [
            "Autumn capsule wardrobe",
            "Neutral street style",
            "Cozy knit layering",
            "Minimalist outfit of the day",
            "Trench coat season",
            "Effortless monochrome look",
        ],
        "desc": "Timeless pieces and easy combinations for an effortless everyday look.",
    },
    "Travel": {
        "titles": [
            "Hidden alleys of Lisbon",
            "Mountain cabin getaway",
            "A slow morning in Kyoto",
            "Coastal road trip stops",
            "Cafés worth the detour",
            "Golden hour in the city",
        ],
        "desc": "Saving this for the next trip — quiet streets, good light, and slow mornings.",
    },
    "Art": {
        "titles": [
            "Abstract color study",
            "Minimal line drawing",
            "Moody still life",
            "Gallery wall layout",
            "Texture & brushwork",
            "Muted palette inspiration",
        ],
        "desc": "Color, composition, and texture studies to keep the sketchbook full.",
    },
    "Nature": {
        "titles": [
            "Misty forest trail",
            "Wildflower meadow",
            "Calm lake reflections",
            "Desert at dusk",
            "Rainy window mood",
            "Sunlit canopy",
        ],
        "desc": "A little reminder to slow down and go outside this weekend.",
    },
    "DIY and Crafts": {
        "titles": [
            "Weekend pottery project",
            "Macramé wall hanging",
            "Hand-poured candles",
            "Upcycled shelf makeover",
            "Pressed flower frames",
            "Simple woodworking build",
        ],
        "desc": "An easy, satisfying make for a slow weekend at home.",
    },
    "Beauty": {
        "titles": [
            "Dewy everyday makeup",
            "Soft glam for autumn",
            "Minimal skincare routine",
            "Effortless waves tutorial",
            "Warm-toned eye look",
            "Glowy no-makeup makeup",
        ],
        "desc": "Clean, glowy, and low-effort — a routine that actually fits real mornings.",
    },
    "Architecture": {
        "titles": [
            "Brutalist concrete forms",
            "Sunlit atrium",
            "Minimal façade study",
            "Curved staircase detail",
            "Glass house in the woods",
            "Quiet courtyard design",
        ],
        "desc": "Light, material, and proportion — details worth stealing for a future build.",
    },
    "Photography": {
        "titles": [
            "Film grain street scene",
            "Soft portrait lighting",
            "Long exposure city lights",
            "Minimal product setup",
            "Moody kitchen light",
            "Golden hour silhouette",
        ],
        "desc": "Notes on light and framing to come back to on the next shoot.",
    },
    "Animals": {
        "titles": [
            "Sleepy golden retriever",
            "Curious tabby cat",
            "Tiny desk companion",
            "Birds at the feeder",
            "Fluffy weekend mood",
            "Best good boy",
        ],
        "desc": "The internet was right — this is exactly the kind of cute we needed today.",
    },
    "Quotes": {
        "titles": [
            "Slow living reminder",
            "Monday motivation",
            "Note to self",
            "Keep it simple",
            "Small steps count",
            "Make space for calm",
        ],
        "desc": "A gentle reminder to keep things slow, simple, and kind.",
    },
}

COMMENTS = [
    "This is gorgeous 😍",
    "Saving this for later!",
    "Where is this from?",
    "Love the colors here.",
    "Such a great idea 🙌",
    "Trying this for sure.",
    "Perfect inspo, thank you!",
    "Obsessed with this.",
]

BOARD_NAMES = {
    "alexmorgan": ["Dream Home", "Living Room Ideas", "Cozy Corners"],
    "saradesigns": ["Interior Inspo", "Plants & Greenery", "Bedroom Goals"],
    "mikecooks": ["Weeknight Dinners", "Brunch Ideas", "Sweet Treats"],
    "ninatravels": ["Travel Bucket List", "City Guides", "Mountain Escapes"],
    "leostudio": ["Studio Inspiration", "Color Palettes", "Gallery Walls"],
}
