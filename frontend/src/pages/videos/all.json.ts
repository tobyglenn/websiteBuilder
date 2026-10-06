import type { APIRoute } from 'astro';
import { VIDEOS } from '../../data/mock.js';

// Full video catalog backing the /videos/ "Load more" grid. The page renders
// only the first page server-side to keep the initial HTML small; the grid
// fetches this endpoint client-side for the remaining videos.
export const GET: APIRoute = () => {
  return new Response(JSON.stringify({ videos: VIDEOS }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
