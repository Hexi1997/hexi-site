"use client";

import Giscus from "@giscus/react";

const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

const isConfigured = repo && repoId && category && categoryId;

export function GiscusComments() {
  if (!isConfigured) return null;

  return (
    <div className="mt-12 pt-8 border-t border-neutral-100">
      <Giscus
        repo={repo as `${string}/${string}`}
        repoId={repoId}
        category={category}
        categoryId={categoryId}
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme="light"
        loading="lazy"
      />
    </div>
  );
}
