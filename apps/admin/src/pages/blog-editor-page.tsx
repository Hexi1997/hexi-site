import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { getBlog, saveBlog } from "@/lib/github";
import type { BlogFrontmatter, PendingImage } from "@/types";
import { TipTapEditor } from "@/components/editor/tiptap-editor";
import { FrontmatterForm } from "@/components/editor/frontmatter-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export function BlogEditorPage() {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const isNew = paramSlug === "new";
  const { token } = useAuth();
  const navigate = useNavigate();

  const [slug, setSlug] = useState(isNew ? "" : paramSlug || "");
  const [frontmatter, setFrontmatter] = useState<BlogFrontmatter>({
    title: "",
    category: "Product",
    date: new Date().toISOString().slice(0, 10),
  });
  const [content, setContent] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Map: display URL -> relative path (for save-time replacement)
  const urlMapRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (isNew || !token || !paramSlug) return;
    setLoading(true);

    getBlog(token, paramSlug)
      .then((blog) => {
        setFrontmatter(blog.frontmatter);

        // Replace relative asset paths (assets/xxx or ./assets/xxx) with GitHub raw URLs
        const rawBase = `https://raw.githubusercontent.com/Hexi1997/hexi-site/main/apps/site/blogs/${paramSlug}`;
        const displayContent = blog.content.replace(
          /(?<!\/)(?:\.\/)?assets\/([^\s)]+)/g,
          (_match, filename) => {
            const rawUrl = `${rawBase}/assets/${filename}`;
            urlMapRef.current.set(rawUrl, `assets/${filename}`);
            return rawUrl;
          }
        );
        setContent(displayContent);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isNew, token, paramSlug]);

  const handleImageAdd = useCallback((image: PendingImage) => {
    setPendingImages((prev) => [...prev, image]);
    urlMapRef.current.set(image.blobUrl, `assets/${image.filename}`);
  }, []);

  const handleContentChange = useCallback((md: string) => {
    setContent(md);
  }, []);

  async function handleSave() {
    if (!token) return;

    if (!slug.trim()) {
      setError("Slug is required");
      return;
    }
    if (!frontmatter.title.trim()) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Replace all display URLs (blob URLs + GitHub raw URLs) back to relative paths
      let finalContent = content;
      for (const [displayUrl, relativePath] of urlMapRef.current.entries()) {
        finalContent = finalContent.replaceAll(displayUrl, relativePath);
      }

      await saveBlog(token, slug, frontmatter, finalContent, pendingImages, isNew);

      // Clear pending images after successful save
      for (const img of pendingImages) {
        URL.revokeObjectURL(img.blobUrl);
      }
      setPendingImages([]);
      urlMapRef.current.clear();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      if (isNew) {
        navigate(`/editor/${slug}`, { replace: true });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <p className="text-sm text-green-600">Saved successfully!</p>
          )}
          {pendingImages.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {pendingImages.length} image{pendingImages.length > 1 ? "s" : ""}{" "}
              to upload
            </span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isNew ? "Publish" : "Save"}
          </Button>
        </div>
      </div>

      <FrontmatterForm
        frontmatter={frontmatter}
        slug={slug}
        isNew={isNew}
        onChange={setFrontmatter}
        onSlugChange={setSlug}
      />

      <TipTapEditor
        content={content}
        onChange={handleContentChange}
        onImageAdd={handleImageAdd}
      />
    </div>
  );
}
