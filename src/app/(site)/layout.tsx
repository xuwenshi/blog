import type { ReactNode } from "react";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

/**
 * 「行星内部」的外壳：保留原有的站点外壳与 Light / Dark / System 主题系统。
 *
 * 路由组 (site) 不改变 URL —— /blog、/projects、/about、/resume、/diary、/goals
 * 仍然是原来的地址，只是共用这一层 Navbar + main + Footer。
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}