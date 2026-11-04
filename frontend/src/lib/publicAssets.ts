import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { podcastAsset } from './podcastAssets.mjs';

const PUBLIC_ROOT = new URL('../../public/', import.meta.url);

export function resolvePublicAsset(candidates: string[], fallback: string): string {
  for (const candidate of candidates) {
    if (!candidate.startsWith('/')) continue;
    if (podcastAsset(candidate)) return candidate;
    const assetUrl = new URL(`.${candidate}`, PUBLIC_ROOT);
    if (existsSync(fileURLToPath(assetUrl))) return candidate;
  }
  return fallback;
}
