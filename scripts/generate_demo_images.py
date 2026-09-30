import os
from PIL import Image, ImageDraw, ImageFont

out_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'demo')
os.makedirs(out_dir, exist_ok=True)

def draw_pill_pack(filename, title, subtitle, details, bg_color=(235, 243, 245), foil_color=(200, 220, 225), is_expired=False):
    width = 800
    height = 500
    img = Image.new('RGB', (width, height), color=(245, 248, 250))
    draw = ImageDraw.Draw(img)

    # Blister pack background with rounded corners
    pack_rect = [40, 30, width - 40, height - 30]
    draw.rounded_rectangle(pack_rect, radius=28, fill=bg_color, outline=(140, 175, 180), width=3)

    # Metallic foil lines / texture
    for x in range(60, width - 60, 40):
        draw.line([(x, 40), (x, height - 40)], fill=foil_color, width=1)
    for y in range(50, height - 50, 40):
        draw.line([(50, y), (width - 50, y)], fill=foil_color, width=1)

    # Blister pockets (10 tablets: 2 rows of 5)
    pill_centers = []
    for row in range(2):
        y = 120 + row * 160
        for col in range(5):
            x = 110 + col * 140
            # Draw blister cavity
            draw.ellipse([x - 45, y - 35, x + 45, y + 35], fill=(255, 255, 255), outline=(150, 185, 190), width=2)
            draw.ellipse([x - 36, y - 28, x + 36, y + 28], fill=(240, 246, 248))
            # Pill capsule shape
            draw.rounded_rectangle([x - 28, y - 16, x + 28, y + 16], radius=16, fill=(255, 255, 255), outline=(180, 205, 210), width=2)

    # Printed label overlay band
    band_y1 = 330
    band_y2 = 460
    draw.rectangle([50, band_y1, width - 50, band_y2], fill=(255, 255, 255, 230), outline=(12, 77, 84), width=2)

    # Header text
    draw.text((70, 340), title, fill=(10, 54, 59))
    draw.text((70, 365), subtitle, fill=(14, 130, 120))

    # Details: Batch, Mfg, Exp, Mfd by
    y_off = 390
    for key, val in details.items():
        color = (180, 20, 20) if is_expired and key == 'EXP' else (30, 40, 45)
        text = f"{key}: {val}"
        draw.text((70, y_off), text, fill=color)
        y_off += 20

    # Barcode representation on the right
    bx = width - 190
    for i, w in enumerate([2, 4, 1, 3, 2, 5, 2, 3, 1, 4, 2, 5, 3, 2, 4, 1, 3]):
        bx += w + 3
        draw.line([(bx, 345), (bx, 425)], fill=(15, 23, 42), width=w)
    draw.text((width - 180, 430), "8901234567890", fill=(100, 116, 139))

    # Fictional watermark banner
    draw.text((60, 40), "[FICTIONAL DEMO PACK — FOR SYSTEM TESTING ONLY]", fill=(120, 140, 145))

    out_path = os.path.join(out_dir, filename)
    img.save(out_path)
    print(f"Generated {out_path}")

# 1. Verified sample
draw_pill_pack(
    'sample-verified.png',
    'PARACETAMOL TABLETS IP 500 mg',
    'Brand: DemoPar 500 — Analgesic & Antipyretic',
    {
        'Batch No': 'PC123456',
        'MFG': '03/2026',
        'EXP': '02/2028',
        'Mfd by': 'Demo Pharma Laboratories Ltd., Okhla Phase-III, New Delhi',
        'Lic No': 'DL-2024-9988'
    }
)

# 2. Needs Verification sample (missing batch / unknown manufacturer)
draw_pill_pack(
    'sample-needs-review.png',
    'DEMO MEDICINE 250 mg',
    'Herbal & General Health Formula',
    {
        'Batch No': '--- (UNREADABLE SMUDGE) ---',
        'MFG': '01/2026',
        'EXP': '12/2027',
        'Mfd by': 'Local Health Remedies (Unregistered Unit)',
        'Lic No': 'Lic: NONE'
    },
    bg_color=(245, 242, 230),
    foil_color=(220, 215, 190)
)

# 3. Suspicious sample (Mismatch manufacturer + Recalled batch)
draw_pill_pack(
    'sample-suspicious.png',
    'AMOXICILLIN CAPSULES IP 500 mg',
    'Broad Spectrum Antibiotic',
    {
        'Batch No': 'RC998877 [CDSCO ALERT BATCH]',
        'MFG': '05/2025',
        'EXP': '04/2027',
        'Mfd by': 'Mismatch Pharma Trading Co., Solan, HP',
        'Lic No': 'HP-9922-MISMATCH'
    },
    bg_color=(254, 238, 238),
    foil_color=(235, 205, 205)
)

# 4. Expired sample
draw_pill_pack(
    'sample-expired.png',
    'ATORVASTATIN TABLETS IP 10 mg',
    'Cardiovascular Health Formula',
    {
        'Batch No': 'AT445566',
        'MFG': '01/2022',
        'EXP': '12/2023 (EXPIRED PRODUCT)',
        'Mfd by': 'Zydus Life Care, Ahmedabad',
        'Lic No': 'GJ-2021-1122'
    },
    bg_color=(245, 240, 240),
    foil_color=(225, 215, 215),
    is_expired=True
)

print('All demo pack images generated!')
