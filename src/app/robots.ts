import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

const base = siteConfig.url.replace(/\/$/, "");

/** 允许搜索引擎抓取全站，并声明 sitemap 位置 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}