import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

const INTEGRATIONS_PATH = path.join(process.cwd(), 'src/integrations');

export type IntegrationPost = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  icon: string;
  badges: string[];
  website?: string;
  pricing?: string;
  terms?: string;
  featured?: boolean;
  published?: string;
  content: string;
};

export function getIntegrationSlugs(): string[] {
  if (!fs.existsSync(INTEGRATIONS_PATH)) return [];
  return fs.readdirSync(INTEGRATIONS_PATH).filter((f) => f.endsWith('.mdx'));
}

export function getIntegrationBySlug(slug: string): IntegrationPost {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = path.join(INTEGRATIONS_PATH, `${realSlug}.mdx`);
  const file = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(file);

  return {
    slug: realSlug,
    title: (data.title ?? '').toString(),
    category: (data.category ?? 'General').toString(),
    summary: (data.summary ?? data.description ?? '').toString(),
    icon: (data.icon ?? '').toString(),
    badges: Array.isArray(data.badges) ? data.badges.map(String) : [],
    website: data.website?.toString(),
    pricing: data.pricing?.toString(),
    terms: data.terms?.toString(),
    featured: Boolean(data.featured),
    published: data.published?.toString(),
    content,
  };
}

export function getAllIntegrations(): IntegrationPost[] {
  return getIntegrationSlugs()
    .map((s) => getIntegrationBySlug(s))
    .sort((a, b) => {
      const da = a.published ? new Date(a.published).getTime() : 0;
      const db = b.published ? new Date(b.published).getTime() : 0;
      return db - da;
    });
}
