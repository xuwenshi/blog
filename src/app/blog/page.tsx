import type { Metadata } from "next";

import PostList from "@/components/blog/PostList";
import PageHeader from "@/components/ui/PageHeader";
import { getAllCategories, getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "博客",
  description: "机器学习、数据挖掘、RAG 与工程实践的技术文章，记录问题、原理、实现与踩坑。",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <PageHeader
        eyebrow="Blog"
        title="博客"
        description="记录机器学习、数据挖掘、RAG 与工程实践中的问题、原理、实验和踩坑。所有文章都尽量给出可复现的代码与数据。"
      >
        <p className="text-sm text-muted">
          共 <span className="font-medium text-foreground">{posts.length}</span> 篇文章，
          <span className="font-medium text-foreground">{categories.length}</span> 个分类
        </p>
      </PageHeader>

      <div className="mt-8">
        <PostList posts={posts} />
      </div>
    </div>
  );
}