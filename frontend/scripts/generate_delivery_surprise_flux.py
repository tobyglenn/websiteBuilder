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
    'a brand new smart home gym machine delivered to a suburban house on a wooden freight pallet, '
    'large boxed fitness equipment with a bench package, front porch and open garage visible, '
    'the scene should clearly show the surprise that a supposedly compact home gym arrived like freight cargo, '
    'realistic pallet straps, cardboard packaging, delivery-day atmosphere, premium product photography, '
    'modern home exterior, natural daylight, cinematic but believable, detailed, no text, no watermark, no logo'
)
negative = 'cartoon, illustration, text, watermark, logo, blurry, low detail, distorted, duplicate objects, extra equipment, deformed pallet'

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
