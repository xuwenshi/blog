import Link from "next/link";

import { GithubIcon, MailIcon } from "@/components/ui/Icons";
import { siteConfig } from "@/lib/site";

/**
 * 页脚（服务端组件）。
 *
 * 版权年份需要读取「当前时间」。在 Cache Components 模式下，这类不稳定值
 * 不能直接出现在预渲染路径上，因此用 `use cache` 把它标记为可缓存：
 * 构建时算一次，之后每次部署自动更新。
 */
export default async function Footer() {
  "use cache";

  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{siteConfig.name}</p>
          <p className="max-w-md text-sm text-muted">{siteConfig.tagline}</p>
          <p className="text-xs text-muted">
            © {year} {siteConfig.author}. 使用 Next.js 构建。
          </p>
        </div>

        <nav aria-label="页脚导航" className="flex flex-col gap-3 md:items-end">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {siteConfig.navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <li>
              <a
                href={siteConfig.github}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-foreground"
              >
                <GithubIcon width={15} height={15} />
                GitHub
              </a>
            </li>
            <li>
              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-foreground"
              >
                <MailIcon width={15} height={15} />
                Email
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}