import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { common, createLowlight } from "lowlight";
import "highlight.js/styles/github-dark.css";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { useCallback, useRef, useState } from "react";
import type { PendingImage } from "@/types";
import { EditorToolbar } from "./editor-toolbar";
import { Trash2 } from "lucide-react";

interface TipTapEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  onImageAdd: (image: PendingImage) => void;
}

const lowlight = createLowlight(common);

let imageIdCounter = 0;

export function TipTapEditor({
  content,
  onChange,
  onImageAdd,
}: TipTapEditorProps) {
  const initialContentRef = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "underline text-primary" } }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
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

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pos: number } | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!editor) return;

      const target = e.target as HTMLElement;
      if (target.tagName !== "IMG") {
        setContextMenu(null);
        return;
      }

      e.preventDefault();
      const pos = editor.view.posAtDOM(target, 0);
      setContextMenu({ x: e.clientX, y: e.clientY, pos });
    },
    [editor]
  );

  const handleDeleteImage = useCallback(() => {
    if (!editor || !contextMenu) return;
    const node = editor.view.state.doc.nodeAt(contextMenu.pos);
    if (node) {
      editor
        .chain()
        .focus()
        .deleteRange({ from: contextMenu.pos, to: contextMenu.pos + node.nodeSize })
        .run();
    }
    setContextMenu(null);
  }, [editor, contextMenu]);

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

  if (!editor) return null;

  return (
    <div className="relative rounded-lg border bg-card" ref={editorContainerRef}>
      <EditorToolbar editor={editor} onImageUpload={handleImageUploadClick} />
      <div
        className="prose prose-headings:font-bold prose-sm max-w-none p-4 [&_.tiptap]:min-h-[400px] [&_.tiptap]:outline-none [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_img]:w-full [&_.tiptap_img]:h-auto [&_.tiptap_img]:rounded-md [&_.tiptap_img]:my-4 [&_.tiptap_img]:cursor-pointer [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted"
        onContextMenu={handleContextMenu}
        onClick={() => setContextMenu(null)}
      >
        <EditorContent editor={editor} />
      </div>

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 min-w-[140px] rounded-md border bg-popover p-1 shadow-md"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={handleDeleteImage}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
            >
              <Trash2 className="h-4 w-4" />
              Delete image
            </button>
          </div>
        </>
      )}
    </div>
  );
}
