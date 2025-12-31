import { compileMDX } from 'next-mdx-remote/rsc';

import ZippayBlogPost from '@/components/sections/zippay-blog-post';
import ZippayCtaCard from '@/components/sections/zippay-cta-card';
import { getBlogBySlug, getBlogSlugs } from '@/lib/blog';

export async function generateStaticParams() {
  const slugs = getBlogSlugs();
  return slugs.map((slug) => ({
    slug: slug.replace(/\.mdx$/, ''),
  }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);

  const { content } = await compileMDX<Record<string, unknown>>({
    source: post.content,
    options: { parseFrontmatter: false },
  });

  return (
    <>
      <ZippayBlogPost
        tagline={post.tagline}
        title={post.title}
        intro={post.description}
        image={post.coverImage}
        author={post.author}
        published={post.date}
      >
        {content}
      </ZippayBlogPost>
      <ZippayCtaCard softBg={true} />
    </>
  );
}
