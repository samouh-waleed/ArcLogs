import ZippayBlogFeaturedPosts from '@/components/sections/zippay-blog-featured-posts';
import ZippayBlogGrid, {
  BlogCard,
} from '@/components/sections/zippay-blog-grid';
import ZippayBlogHero from '@/components/sections/zippay-blog-header';
import ZippayCtaCard from '@/components/sections/zippay-cta-card';
import type { BlogPost } from '@/lib/blog';
import { getAllBlogs } from '@/lib/blog';

function extractChip(post: BlogPost): string {
  const fromTagline =
    typeof post.tagline === 'string' ? post.tagline.trim() : '';
  const fromTags =
    Array.isArray(post.tags) && typeof post.tags[0] === 'string'
      ? post.tags[0].trim()
      : '';
  return fromTagline || fromTags || 'General';
}

export default function BlogPage() {
  const allPosts = getAllBlogs();

  const featuredPosts = allPosts.filter((p) => p.featured);

  const gridPosts: BlogCard[] = allPosts.map((p) => {
    const chip = extractChip(p);
    return {
      slug: p.slug,
      title:
        (typeof p.title === 'string' ? p.title.trim() : '') ||
        p.slug.replace(/-/g, ' '),
      tagline: chip,
      category: chip,
      intro: p.description ?? '',
    };
  });

  return (
    <>
      <ZippayBlogHero />
      {!!featuredPosts.length && (
        <ZippayBlogFeaturedPosts posts={featuredPosts} />
      )}
      <ZippayBlogGrid posts={gridPosts} />
      <ZippayCtaCard softBg />
    </>
  );
}
