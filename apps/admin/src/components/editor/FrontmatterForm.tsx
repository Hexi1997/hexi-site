import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BlogFrontmatter } from "@/types";

interface FrontmatterFormProps {
  frontmatter: BlogFrontmatter;
  slug: string;
  isNew: boolean;
  onChange: (fm: BlogFrontmatter) => void;
  onSlugChange: (slug: string) => void;
}

const CATEGORIES = ["Product", "Company", "Engineering", "Community", "Tutorial"];

export function FrontmatterForm({
  frontmatter,
  slug,
  isNew,
  onChange,
  onSlugChange,
}: FrontmatterFormProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={frontmatter.title}
            onChange={(e) => onChange({ ...frontmatter, title: e.target.value })}
            placeholder="Blog post title"
            className="mt-1.5"
          />
        </div>

        {isNew && (
          <div className="sm:col-span-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) =>
                onSlugChange(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, "")
                )
              }
              placeholder="my-blog-post"
              className="mt-1.5 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              URL-friendly identifier. Only lowercase letters, numbers, and hyphens.
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={frontmatter.category}
            onChange={(e) => onChange({ ...frontmatter, category: e.target.value })}
            className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="date">Date</Label>
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
