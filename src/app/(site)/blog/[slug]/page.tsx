import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PostCard from "@/components/blog/PostCard";
import PostToc from "@/components/blog/PostToc";
import CosmicLink from "@/components/cosmic/CosmicLink";
import { Chip } from "@/components/ui/Badge";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  FolderIcon,
} from "@/components/ui/Icons";
import { formatDate } from "@/lib/format";
import {
  getAdjacentPosts,
  getAllPosts,
  getPost,
  getRelatedPosts,
} from "@/lib/posts";
import { siteConfig } from "@/lib/site";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

/** 构建期枚举全部文章，生成静态页面 */
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "文章不存在" };

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `${siteConfig.url}/blog/${post.slug}`,
      publishedTime: post.date,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(slug);
  const related = getRelatedPosts(slug, 2);

  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: "zh-CN",
    keywords: post.tags.join(", "),
    author: { "@type": "Person", name: siteConfig.author, url: siteConfig.url },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/blog/${post.slug}`,
    },
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <CosmicLink
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon width={15} height={15} />
        返回博客列表
      </CosmicLink>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0">
          <article>
            <header className="border-b border-border pb-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon width={13} height={13} />
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FolderIcon width={13} height={13} />
                  {post.category}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon width={13} height={13} />
                  约 {post.readingTime} 分钟
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
                {post.title}
              </h1>

              <p className="mt-4 text-base leading-relaxed text-muted">
                {post.description}
              </p>

              {post.tags.length > 0 ? (
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <li key={tag}>
                      <Chip>{tag}</Chip>
                    </li>
                  ))}
                </ul>
              ) : null}

              {/* frontmatter 里的 cover 作为文章头图展示 */}
              {post.cover ? (
                // 用原生 img 而不是 next/image：图片路径写在 Markdown / frontmatter 里，
                // 无法预知尺寸，交给浏览器按原始比例渲染反而更简单
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.cover}
                  alt={post.title}
                  className="mt-6 w-full rounded-xl border border-border"
                />
              ) : null}
            </header>

            <div
              className="prose prose-slate mt-8 max-w-none"
              dangerouslySetInnerHTML={{ __html: post.html }}
            />
          </article>

          {/* 上一篇 / 下一篇 */}
          <nav
            aria-label="文章导航"
            className="mt-12 grid gap-3 border-t border-border pt-8 sm:grid-cols-2"
          >
            {prev ? (
              <CosmicLink
                href={`/blog/${prev.slug}`}
                className="group rounded-xl border border-border bg-elevated p-4 transition-colors hover:border-accent/50"
              >
                <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <ArrowLeftIcon width={13} height={13} />
                  上一篇
                </span>
                <span className="mt-1.5 block text-sm font-medium text-foreground">
                  {prev.title}
                </span>
              </CosmicLink>
            ) : (
              <span aria-hidden />
            )}

            {next ? (
              <CosmicLink
                href={`/blog/${next.slug}`}
                className="group rounded-xl border border-border bg-elevated p-4 transition-colors hover:border-accent/50 sm:text-right"
              >
                <span className="inline-flex items-center gap-1.5 text-xs text-muted sm:justify-end">
                  下一篇
                  <ArrowRightIcon width={13} height={13} />
                </span>
                <span className="mt-1.5 block text-sm font-medium text-foreground">
                  {next.title}
                </span>
              </CosmicLink>
            ) : null}
          </nav>

          {related.length > 0 ? (
            <section className="mt-12 border-t border-border pt-8">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                相关文章
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map((item) => (
                  <PostCard key={item.slug} post={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* 目录：移动端隐藏，避免占用首屏；服务端渲染，无客户端开销 */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <PostToc items={post.headings} />
          </div>
        </aside>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }}
      />
    </div>
  );
}