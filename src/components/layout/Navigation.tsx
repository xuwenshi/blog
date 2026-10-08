"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { CloseIcon, MenuIcon } from "@/components/ui/Icons";
import type { NavLink } from "@/lib/site";

/**
 * 导航链接（客户端组件）。
 * 只有「当前路由高亮」和「移动端菜单开合」需要浏览器交互，
 * 因此把这部分单独抽成客户端组件，导航栏本身仍然是服务端组件。
 */
export default function Navigation({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const desktopLinkClass = (href: string) =>
    [
      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
      isActive(href)
        ? "text-foreground"
        : "text-muted hover:text-foreground hover:bg-surface",
    ].join(" ");

  const mobileLinkClass = (href: string) =>
    [
      "block rounded-md px-3 py-2.5 text-base font-medium transition-colors",
      isActive(href)
        ? "bg-surface text-foreground"
        : "text-muted hover:bg-surface hover:text-foreground",
    ].join(" ");

  return (
    <>
      {/* 桌面端导航 */}
      <nav aria-label="主导航" className="hidden md:block">
        <ul className="flex items-center gap-1">
          {links.map((link) => (
            <li key={link.href}>
              {link.external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={desktopLinkClass(link.href)}
                >
                  {link.label}
                </a>
              ) : (
                <Link href={link.href} className={desktopLinkClass(link.href)}>
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* 移动端菜单按钮 */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "关闭菜单" : "打开菜单"}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted transition-colors hover:bg-surface hover:text-foreground md:hidden"
      >
        {open ? <CloseIcon width={18} height={18} /> : <MenuIcon width={18} height={18} />}
      </button>

      {/* 移动端展开面板 */}
      {open ? (
        <nav
          id="mobile-nav"
          aria-label="移动端导航"
          className="absolute inset-x-0 top-full border-b border-border bg-background p-3 shadow-lg md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.href}>
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={mobileLinkClass(link.href)}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className={mobileLinkClass(link.href)}
                    // 点击后立即收起菜单，比监听路由变化再同步状态更直接
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </>
  );
}