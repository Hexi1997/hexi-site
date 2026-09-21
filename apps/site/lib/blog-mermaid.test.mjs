import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("blog pipeline preserves Mermaid source for the client without breaking code highlighting", async () => {
  const cwd = process.cwd();
  const directory = mkdtempSync(join(tmpdir(), "blog-mermaid-test-"));
  try {
    mkdirSync(join(directory, "posts", "fixture"), { recursive: true });
    writeFileSync(join(directory, "posts", "fixture", "index.md"), [
      "---", "title: Test", "date: '2026-09-21'", "tags: [AI]", "---",
      "```mermaid", 'flowchart LR', 'A["<script> & 文本"] --> B', "```",
      "```js", "const answer = 42;", "```",
      "```mermaid", "not a valid diagram", "```",
    ].join("\n"));
    process.chdir(directory);
    const { getBlogPostBySlug } = await import("./blog.ts");
    const post = await getBlogPostBySlug("fixture");
    assert.ok(post);
    assert.equal((post.content.match(/data-mermaid=""/g) ?? []).length, 2);
    assert.match(post.content, /&#x3C;script> &#x26; 文本/);
    assert.match(post.content, /not a valid diagram/);
    assert.equal((post.content.match(/class="shiki /g) ?? []).length, 1);
    assert.doesNotMatch(post.content, /<script>/);
  } finally {
    process.chdir(cwd);
    rmSync(directory, { recursive: true, force: true });
  }
});
