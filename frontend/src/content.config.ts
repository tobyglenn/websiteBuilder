import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

const videos = defineCollection({
  loader: file('src/data/videos.json', {
    parser: (text) => JSON.parse(text).videos,
  }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    full_description: z.string().optional(),
    thumbnail: z.string(),
    publishedAt: z.string().optional(),
    published_at: z.string().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    key_takeaways: z.array(z.string()).default([]),
    chapters: z
      .array(
        z.object({
          time: z.string(),
          seconds: z.number(),
          title: z.string(),
        })
      )
      .default([]),
    transcript_file: z.string().nullable().optional(),
    has_transcript: z.boolean().default(false),
    word_count: z.number().default(0),
    duration_formatted: z.string().nullable().optional(),
    duration_iso: z.string().nullable().optional(),
    viewCount: z.number().default(0),
    views: z.string().default('0'),
    is_short: z.boolean().default(false),
    is_live: z.boolean().default(false),
    comments: z.array(z.any()).default([]),
  }),
});

export const collections = { videos };
