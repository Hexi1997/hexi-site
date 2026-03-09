import { useRef } from "react";
import { slugify } from "transliteration";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BlogFrontmatter } from "@/types";

function generateSlug(title: string): string {
  const cleaned = title.replace(/[''\u2019]s\b/gi, "");
  const full = slugify(cleaned, { lowercase: true, separator: "-" })
    .replace(/\./g, "-"); // slug must not contain dots
  return full.split("-").slice(0, 8).join("-");
}

interface FrontmatterFormProps {
  frontmatter: BlogFrontmatter;
  slug: string;
  isNew: boolean;
  onChange: (fm: BlogFrontmatter) => void;
  onSlugChange: (slug: string) => void;
}

export function FrontmatterForm({
  frontmatter,
  slug,
  isNew,
  onChange,
  onSlugChange,
}: FrontmatterFormProps) {
  const slugManuallyEdited = useRef(false);
  const tagsInputRef = useRef<HTMLInputElement>(null);

  function handleTitleChange(title: string) {
    onChange({ ...frontmatter, title });
    if (isNew && !slugManuallyEdited.current) {
      onSlugChange(generateSlug(title));
    }
  }

  function handleSlugChange(value: string) {
    const cleaned = value
      .toLowerCase()
      .replace(/\./g, "") // slug must not contain dots
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
    slugManuallyEdited.current = cleaned.length > 0;
    onSlugChange(cleaned);
  }

  function addTag(rawTag: string) {
    const tag = rawTag.trim();
    if (!tag) return;

    const tags = frontmatter.tags || [];
    const duplicate = tags.some((item) => item.toLowerCase() === tag.toLowerCase());
    if (duplicate) return;

    onChange({ ...frontmatter, tags: [...tags, tag] });
  }

  function removeTag(tagToRemove: string) {
    const tags = (frontmatter.tags || []).filter((tag) => tag !== tagToRemove);
    onChange({ ...frontmatter, tags });
  }

  function commitTagsFromInput() {
    if (!tagsInputRef.current) return;
    const rawValue = tagsInputRef.current.value;
    if (!rawValue.trim()) return;

    const nextTags = rawValue
      .split(/[,\uFF0C]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    for (const tag of nextTags) {
      addTag(tag);
    }
    tagsInputRef.current.value = "";
  }

  function handleTagsKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === "，") {
      e.preventDefault();
      commitTagsFromInput();
      return;
    }

    if (e.key === "Backspace" && tagsInputRef.current?.value === "") {
      const tags = frontmatter.tags || [];
      if (tags.length === 0) return;
      onChange({ ...frontmatter, tags: tags.slice(0, -1) });
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title" className="text-base">Title</Label>
          <Input
            id="title"
            value={frontmatter.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="slug" className="text-base">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder={generateSlug(frontmatter.title)}
            readOnly={!isNew}
            className={`mt-1.5 font-mono text-sm ${!isNew ? "opacity-60" : ""}`}
          />
          {isNew && (
            <p className="mt-1 text-xs text-muted-foreground">
              URL-friendly identifier. Only lowercase letters, numbers, and hyphens.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="date" className="text-base">Date</Label>
          <Input
            id="date"
            type="date"
            value={frontmatter.date}
            onChange={(e) => onChange({ ...frontmatter, date: e.target.value })}
            className="mt-1.5"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="tags" className="text-base">Tags</Label>
          <div className="mt-1.5 rounded-md border border-input bg-transparent px-2 py-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(frontmatter.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-foreground"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Remove tag ${tag}`}
                  >
                    x
                  </button>
                </span>
              ))}
              <Input
                id="tags"
                ref={tagsInputRef}
                className="h-7 min-w-[180px] flex-1 border-0 bg-transparent px-1 py-0 shadow-none focus-visible:ring-0"
                onKeyDown={handleTagsKeyDown}
                onBlur={commitTagsFromInput}
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Press Enter or comma to add tag.
          </p>
        </div>
      </div>
    </div>
  );
}
