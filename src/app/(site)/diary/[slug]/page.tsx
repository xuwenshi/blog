import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CosmicLink from "@/components/cosmic/CosmicLink";
import { Chip } from "@/components/ui/Badge";
import { ArrowLeftIcon, CalendarIcon } from "@/components/ui/Icons";
import { getDiaryEntry, getDiarySlugs } from "@/lib/diary";
import { formatDate } from "@/lib/format";
import { siteConfig } from "@/lib/site";

type DiaryEntryPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * 构建期枚举全部日记，生成静态页面。
 * 内容目录里始终保留至少一篇占位日记 —— Next 16 的 `generateStaticParams`
 * 不接受空数组。
 */
export function generateStaticParams() {
  return getDiarySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: DiaryEntryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getDiaryEntry(slug);
  if (!entry) return { title: "记录不存在" };

  return {
    title: entry.title,
    description: entry.summary,
    alternates: { canonical: `/diary/${entry.slug}` },
    openGraph: {
      type: "article",
      title: entry.title,
      description: entry.summary,
      url: `${siteConfig.url}/diary/${entry.slug}`,
      publishedTime: entry.date,
    },
  };
}

export default async function DiaryEntryPage({ params }: DiaryEntryPageProps) {
  const { slug } = await params;
  const entry = await getDiaryEntry(slug);

  if (!entry) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <CosmicLink
        href="/diary"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon width={15} height={15} />
        返回日记时间轴
      </CosmicLink>

      <article className="mt-6">
        <header className="cosmic-enter border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon width={13} height={13} />
              <time dateTime={entry.date}>{formatDate(entry.date)}</time>
            </span>
            {entry.mood ? <span>心情 · {entry.mood}</span> : null}
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {entry.title}
          </h1>

          <p className="mt-4 text-base leading-relaxed text-muted">{entry.summary}</p>

          {entry.tags.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <li key={tag}>
                  <Chip>{tag}</Chip>
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        <div
          className="prose prose-slate mt-8 max-w-none"
          dangerouslySetInnerHTML={{ __html: entry.html }}
        />
      </article>
    </div>
  );
}