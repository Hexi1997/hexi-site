import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { useCallback, useEffect, useRef } from "react";
import type { PendingImage } from "@/types";
import { EditorToolbar } from "./EditorToolbar";

interface TipTapEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  onImageAdd: (image: PendingImage) => void;
  existingAssets?: Array<{ name: string; download_url: string }>;
}

let imageIdCounter = 0;

export function TipTapEditor({
  content,
  onChange,
  onImageAdd,
  existingAssets = [],
}: TipTapEditorProps) {
  const initialContentRef = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: "Start writing your blog post..." }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: initialContentRef.current,
    onUpdate: ({ editor: ed }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const md = (ed.storage as any).markdown.getMarkdown() as string;
      onChange(md);
    },
    editorProps: {
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        event.preventDefault();
        const pos = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });

        for (const file of Array.from(files)) {
          if (!file.type.startsWith("image/")) continue;
          handleImageFile(file, pos?.pos);
        }
        return true;
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of Array.from(items)) {
          if (!item.type.startsWith("image/")) continue;
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            handleImageFile(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  const handleImageFile = useCallback(
    (file: File, pos?: number) => {
      if (!editor) return;

      const id = `img_${++imageIdCounter}`;
      const ext = file.name.split(".").pop() || "png";
      const filename = `${id}.${ext}`;
      const blobUrl = URL.createObjectURL(file);

      const pending: PendingImage = { id, file, blobUrl, filename };
      onImageAdd(pending);

      if (pos !== undefined) {
        editor
          .chain()
          .focus()
          .insertContentAt(pos, {
            type: "image",
            attrs: { src: blobUrl, alt: filename },
          })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .setImage({ src: blobUrl, alt: filename })
          .run();
      }
    },
    [editor, onImageAdd]
  );

  const handleImageUploadClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = () => {
      if (!input.files) return;
      for (const file of Array.from(input.files)) {
        handleImageFile(file);
      }
    };
    input.click();
  }, [handleImageFile]);

  // Replace existing asset URLs for preview in the editor
  useEffect(() => {
    if (!editor || !existingAssets.length) return;
    // The markdown content already has relative references like assets/image.png
    // For rendering preview in editor, we don't need to transform — tiptap-markdown handles it
  }, [editor, existingAssets]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border bg-card">
      <EditorToolbar editor={editor} onImageUpload={handleImageUploadClick} />
      <div className="prose prose-sm max-w-none p-4 [&_.tiptap]:min-h-[400px] [&_.tiptap]:outline-none [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_img]:max-w-full [&_.tiptap_img]:rounded-md [&_.tiptap_img]:my-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
