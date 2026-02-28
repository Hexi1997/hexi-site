import { useRef } from "react";
import { slugify } from "transliteration";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BlogFrontmatter } from "@/types";

function generateSlug(title: string): string {
  const cleaned = title.replace(/[''\u2019]s\b/gi, "");
  const full = slugify(cleaned, { lowercase: true, separator: "-" });
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

  function handleTitleChange(title: string) {
    onChange({ ...frontmatter, title });
    if (isNew && !slugManuallyEdited.current) {
      onSlugChange(generateSlug(title));
    }
  }

  function handleSlugChange(value: string) {
    const cleaned = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
    slugManuallyEdited.current = cleaned.length > 0;
    onSlugChange(cleaned);
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
      </div>
    </div>
  );
}
