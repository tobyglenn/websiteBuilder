#!/usr/bin/env python3
import json, re, torch
from pathlib import Path
from diffusers import FluxPipeline

OUT = Path('/Users/tobyglennpeters/.openclaw/workspace/websiteBuilder/frontend/public/images/blog/2025-09-09-unbox-the-excitement-the-speediance-2s-delivery-surprise.jpg')
OUT.parent.mkdir(parents=True, exist_ok=True)

cfg = json.load(open(Path.home() / '.openclaw/openclaw.json'))
tokens = list(set(re.findall(r'hf_[A-Za-z0-9]+', json.dumps(cfg))))
hf_token = tokens[0] if tokens else None

pipe = FluxPipeline.from_pretrained(
    'black-forest-labs/FLUX.1-schnell',
    torch_dtype=torch.bfloat16,
    token=hf_token,
)
pipe.enable_sequential_cpu_offload(device='mps')

prompt = (
    'Photorealistic editorial image for a home fitness technology blog post: '
    'a forklift setting down a large shrink-wrapped freight pallet of sealed cardboard boxes far away from a suburban house, '
    'no exercise machine visible, no unpacked equipment visible, just anonymous oversized boxed freight on a wooden pallet, '
    'the house should be clearly visible in the background at a distance so the problem is obvious, '
    'long driveway or curbside drop-off, industrial forklift, inconvenient delivery placement, realistic straps and packaging, '
    'delivery-day frustration, premium realistic photography, natural daylight, cinematic but believable, no text, no watermark, no logo'
)
negative = 'exercise machine, home gym machine, exposed equipment, assembled machine, cartoon, illustration, text, watermark, logo, blurry, low detail, distorted, duplicate objects, deformed pallet, extra forklifts, indoor scene, close-up only'

img = pipe(
    prompt=prompt,
    negative_prompt=negative,
    width=1200,
    height=630,
    num_inference_steps=8,
    guidance_scale=0.0,
    max_sequence_length=256,
).images[0]
img.save(OUT, quality=92)
print(OUT)
