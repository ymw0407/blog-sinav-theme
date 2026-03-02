import { z } from 'zod';
import YAML from 'yaml';
import raw from '../../config/site.yml?raw';

const categorySchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/i, 'category.key must be alphanumeric (and -)'),
  label: z.string().min(1),
  description: z.string().optional(),
  accent: z.string().optional(),
  nav: z.boolean().optional(),
  landing: z.boolean().optional(),
  timeline: z.boolean().optional()
});

const socialSchema = z.object({
  icon: z.enum(['github', 'instagram', 'linkedin', 'website', 'email']).optional(),
  label: z.string().min(1),
  url: z.string().url()
});

const siteSchema = z.object({
  site: z.object({
    name: z.string().min(1),
    heroTitle: z.string().min(1),
    heroSubtitle: z.string().min(1),
    kicker: z.string().optional()
  }),
  categories: z.array(categorySchema).min(1),
  social: z.array(socialSchema).optional()
});

export type SiteConfig = z.infer<typeof siteSchema>;
export type SiteCategory = z.infer<typeof categorySchema>;
export type SocialLink = z.infer<typeof socialSchema>;

let cached: (SiteConfig & { categoryMap: Map<string, SiteCategory> }) | null = null;

export function getSiteConfig() {
  if (cached) return cached;
  const parsed = YAML.parse(raw) as unknown;
  const cfg = siteSchema.parse(parsed);
  const categoryMap = new Map<string, SiteCategory>();
  for (const c of cfg.categories) categoryMap.set(c.key, c);
  cached = { ...cfg, categoryMap };
  return cached;
}

export function listNavCategories() {
  return getSiteConfig().categories.filter((c) => c.nav !== false);
}

export function listLandingCategories() {
  return getSiteConfig().categories.filter((c) => c.landing !== false);
}

export function listTimelineCategories() {
  return getSiteConfig().categories.filter((c) => c.timeline !== false);
}

export function resolveCategory(key: string | null | undefined) {
  if (!key) return null;
  return getSiteConfig().categoryMap.get(key) ?? null;
}

