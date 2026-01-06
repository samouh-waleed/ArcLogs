import { compileMDX } from 'next-mdx-remote/rsc';

import ZippayCtaCard from '@/components/sections/zippay-cta-card';
import ZippayIntegrationPost from '@/components/sections/zippay-integration-post';
import { getIntegrationBySlug, getIntegrationSlugs } from '@/lib/integrations';

export async function generateStaticParams() {
  return getIntegrationSlugs().map((slug) => ({
    slug: slug.replace(/\.mdx$/, ''),
  }));
}

export default async function IntegrationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getIntegrationBySlug(slug);

  const { content } = await compileMDX<Record<string, unknown>>({
    source: post.content,
    options: { parseFrontmatter: false },
  });

  return (
    <>
      <ZippayIntegrationPost
        title={post.title}
        category={post.category}
        summary={post.summary}
        icon={post.icon}
        badges={post.badges}
        website={post.website}
        pricing={post.pricing}
        terms={post.terms}
      >
        {content}
      </ZippayIntegrationPost>

      <ZippayCtaCard />
    </>
  );
}
