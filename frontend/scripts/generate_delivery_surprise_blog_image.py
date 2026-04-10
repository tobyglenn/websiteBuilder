from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
from pathlib import Path

W, H = 1200, 630
OUT = Path('/Users/tobyglennpeters/.openclaw/workspace/websiteBuilder/frontend/public/images/blog/2025-09-09-unbox-the-excitement-the-speediance-2s-delivery-surprise.jpg')
SRC = Path('/Users/tobyglennpeters/.openclaw/workspace/websiteBuilder/frontend/public/images/gear/speediance-gym-monster-2s.jpg')

bg = Image.new('RGB', (W, H), '#0b0d12')
d = ImageDraw.Draw(bg)

# layered background
for y in range(H):
    t = y / H
    r = int(11 + 35*t)
    g = int(13 + 18*t)
    b = int(18 + 8*t)
    d.line((0, y, W, y), fill=(r, g, b))

# accent glows
for box, color in [((40,40,520,590),(185,80,255,80)), ((680,40,1180,590),(255,120,60,70))]:
    glow = Image.new('RGBA', (W,H), (0,0,0,0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle(box, radius=42, fill=color)
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    bg = Image.alpha_composite(bg.convert('RGBA'), glow).convert('RGB')

# load product
prod = Image.open(SRC).convert('RGB')
prod = ImageOps.contain(prod, (560, 520))
# subtle card behind product
card = Image.new('RGBA', (620, 540), (18,20,28,220))
cd = ImageDraw.Draw(card)
cd.rounded_rectangle((0,0,619,539), radius=34, outline=(110,130,255,120), width=2)
card = card.filter(ImageFilter.GaussianBlur(0))
bg.paste(card, (610, 50), card)
# product shadow
shadow = Image.new('RGBA', (prod.width+80, prod.height+80), (0,0,0,0))
sd = ImageDraw.Draw(shadow)
sd.ellipse((40, prod.height+10, prod.width+40, prod.height+55), fill=(0,0,0,140))
shadow = shadow.filter(ImageFilter.GaussianBlur(18))
bg.paste(shadow, (650, 90), shadow)
bg.paste(prod, (640, 65))

# left panel overlays
panel = Image.new('RGBA', (560, 550), (8,10,14,150))
pd = ImageDraw.Draw(panel)
pd.rounded_rectangle((0,0,559,549), radius=36, fill=(8,10,14,165), outline=(255,255,255,18), width=1)
bg.paste(panel, (40, 40), panel)

font_bold = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
font_reg = '/System/Library/Fonts/Supplemental/Arial.ttf'
small = ImageFont.truetype(font_bold, 28)
kicker = ImageFont.truetype(font_bold, 30)
title1 = ImageFont.truetype(font_bold, 74)
title2 = ImageFont.truetype(font_bold, 64)
body = ImageFont.truetype(font_reg, 30)
badge = ImageFont.truetype(font_bold, 24)

# top kicker
kcol = (255, 167, 64)
d.rounded_rectangle((68, 66, 255, 106), radius=20, fill=(255,167,64,28), outline=(255,167,64,100), width=2)
d.text((88, 73), 'NEW DELIVERY', font=badge, fill=kcol)

# headline
x = 68
d.text((x, 140), 'SPEEDIANCE 2S', font=title2, fill=(245,247,255))
d.text((x, 214), 'DELIVERY', font=title1, fill=(255,167,64))
d.text((x, 300), 'SURPRISE', font=title1, fill=(164,203,255))

# subhead
sub = "What actually shows up, how big it is,\nand why the first impression matters."
d.multiline_text((x, 402), sub, font=body, fill=(210,218,232), spacing=10)

# bottom tag
for i, txt in enumerate(['PALLET DROP', 'FIRST LOOK', 'REAL USER']):
    bx = x + i*155
    d.rounded_rectangle((bx, 515, bx+138, 553), radius=18, fill=(255,255,255,18), outline=(255,255,255,42), width=1)
    d.text((bx+16, 524), txt, font=small, fill=(236,240,248))

# subtle arrows / pallet motif
for yy in [120, 170, 220]:
    d.line((560, yy, 605, yy), fill=(255,255,255,35), width=3)
    d.polygon([(598, yy-8), (618, yy), (598, yy+8)], fill=(255,255,255,35))

# vignette
vig = Image.new('RGBA', (W,H), (0,0,0,0))
vd = ImageDraw.Draw(vig)
vd.rectangle((0,0,W,H), fill=(0,0,0,0))
for i in range(40):
    alpha = int(110 * (i/40))
    vd.rounded_rectangle((i*8, i*6, W-i*8, H-i*6), radius=42, outline=(0,0,0,alpha), width=8)
bg = Image.alpha_composite(bg.convert('RGBA'), vig).convert('RGB')

bg = bg.filter(ImageFilter.UnsharpMask(radius=1, percent=130, threshold=3))
OUT.parent.mkdir(parents=True, exist_ok=True)
bg.save(OUT, quality=92)
print(OUT)
