import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const medienSchema = z.object({
  typ: z.enum(['bild', 'audio', 'video']),
  datei: z.string(),
  alt_de: z.string().optional(),
  alt_en: z.string().optional(),
  schicht: z.string().optional(),
  position: z.string().optional(),
  autoplay: z.boolean().optional(),
  loop: z.boolean().optional(),
});

const stueckSchema = z.object({
  pfad: z.string(),
  register: z.enum(['spurweite', 'passage', 'ankunft']),
  datum: z.coerce.date(),
  title: z.object({
    de: z.string(),
    en: z.string().optional(),
  }),
  bezuege: z.array(z.string()).default([]),
  schichten: z.array(z.enum(['kern', 'annotation', 'werkstatt', 'quellen'])).default(['kern']),
  sprachen: z.array(z.enum(['de', 'en'])).default(['de']),
  medien: z.array(medienSchema).default([]),
  layout: z.string().optional(),
});

// Expliziter glob()-Loader pro Register — vermeidet Duplicate-ID-Warnings
const spurweite = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/spurweite' }),
  schema: stueckSchema,
});
const passage = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/passage' }),
  schema: stueckSchema,
});
const ankunft = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/ankunft' }),
  schema: stueckSchema,
});

export const collections = { spurweite, passage, ankunft };
