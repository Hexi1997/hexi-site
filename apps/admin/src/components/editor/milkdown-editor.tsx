import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'

import { autocompletion } from '@codemirror/autocomplete'
import { Crepe } from '@milkdown/crepe'
import { githubLight } from '@uiw/codemirror-theme-github'
import { useCallback, useEffect, useRef, type CSSProperties } from 'react'

import type { PendingImage } from '@/types'

interface EditorProps {
  content?: string
  onChange?: (markdown: string) => void
  onImageAdd?: (image: PendingImage) => void
}

function normalizeMarkdownForSync(markdown: string): string {
  return markdown.replace(/\r\n/g, '\n').trimEnd()
}

function isEditorFocused(root: HTMLDivElement | null): boolean {
  if (!root) return false
  const active = document.activeElement
  return Boolean(active && root.contains(active))
}

export default function MilkdownEditor(props: EditorProps) {
  const { content, onChange, onImageAdd } = props
  const rootRef = useRef<HTMLDivElement | null>(null)
  const crepeRef = useRef<Crepe | null>(null)
  const lastEmittedMarkdownRef = useRef(content ?? '')
  const opIdRef = useRef(0)
  const imageIdCounterRef = useRef(0)
  const milkdownFontVars: CSSProperties = {
    ['--crepe-font-title' as string]: 'var(--font-geist), sans-serif',
    ['--crepe-font-default' as string]: 'var(--font-geist), sans-serif',
    ['--crepe-font-code' as string]: 'var(--font-geist-mono), monospace',
  }

  const uploadImage = useCallback(
    async (file: File) => {
      const id = `img_${++imageIdCounterRef.current}`
      const ext = file.name.split('.').pop() || 'png'
      const filename = `${id}.${ext}`
      const blobUrl = URL.createObjectURL(file)
      onImageAdd?.({ id, file, blobUrl, filename })
      return blobUrl
    },
    [onImageAdd],
  )

  const createCrepe = useCallback(
    async (initialMarkdown: string) => {
      const root = rootRef.current
      if (!root) return null

      root.innerHTML = ''
      const crepe = new Crepe({
        root,
        defaultValue: initialMarkdown,
        featureConfigs: {
          [Crepe.Feature.ImageBlock]: {
            onUpload: uploadImage,
            blockOnUpload: uploadImage,
            inlineOnUpload: uploadImage,
          },
          [Crepe.Feature.CodeMirror]: {
            theme: githubLight,
            extensions: [
              autocompletion({
                activateOnTyping: false,
                override: [],
                defaultKeymap: false,
              }),
            ],
          },
        },
      })

      crepe.on((listener) => {
        listener.markdownUpdated((_ctx, markdown) => {
          lastEmittedMarkdownRef.current = markdown
          onChange?.(markdown)
        })
      })

      await crepe.create()
      return crepe
    },
    [onChange, uploadImage],
  )

  useEffect(() => {
    let active = true
    const opId = ++opIdRef.current

    void (async () => {
      const crepe = await createCrepe(content ?? '')
      if (!crepe) return

      if (!active || opId !== opIdRef.current) {
        await crepe.destroy()
        return
      }

      crepeRef.current = crepe
      lastEmittedMarkdownRef.current = content ?? ''
    })()

    return () => {
      active = false
      opIdRef.current += 1
      const current = crepeRef.current
      crepeRef.current = null
      if (current) {
        void current.destroy()
      }
    }
  }, [createCrepe])

  useEffect(() => {
    const incoming = content ?? ''
    if (
      normalizeMarkdownForSync(incoming) ===
      normalizeMarkdownForSync(lastEmittedMarkdownRef.current)
    ) {
      lastEmittedMarkdownRef.current = incoming
      return
    }

    // While user is actively editing (especially inside code block),
    // never sync from prop back into editor to avoid recreate + scroll jump.
    if (isEditorFocused(rootRef.current)) {
      lastEmittedMarkdownRef.current = incoming
      return
    }

    const current = crepeRef.current
    if (!current) {
      lastEmittedMarkdownRef.current = incoming
      return
    }

    let active = true
    const opId = ++opIdRef.current
    const previousScrollTop = rootRef.current?.scrollTop ?? 0

    void (async () => {
      await current.destroy()
      if (!active || opId !== opIdRef.current) return

      crepeRef.current = null
      const next = await createCrepe(incoming)
      if (!next) return

      if (!active || opId !== opIdRef.current) {
        await next.destroy()
        return
      }

      crepeRef.current = next
      lastEmittedMarkdownRef.current = incoming
      requestAnimationFrame(() => {
        if (!active || opId !== opIdRef.current) return
        if (rootRef.current) {
          rootRef.current.scrollTop = previousScrollTop
        }
      })
    })()

    return () => {
      active = false
    }
  }, [content, createCrepe])

  return (
    <div
      ref={rootRef}
      style={milkdownFontVars}
      className="milkdown blogit-milkdown-editor h-full min-h-36 overflow-visible [&_.ProseMirror]:!overflow-visible [&_.ProseMirror]:!px-0 sm:[&_.ProseMirror]:!px-[120px] [&_.ProseMirror]:!caret-black [&_.ProseMirror_code]:!bg-[#ececec] [&_.ProseMirror_code]:!text-black [&_.ProseMirror_img]:!w-full [&_.ProseMirror_img]:!h-auto [&_.ProseMirror_img]:!rounded-2xl [&_.ProseMirror_hr]:!my-12 [&_.milkdown-image-block]:!my-8 [&_.milkdown-code-block]:!my-6 [&_.milkdown-code-block]:!rounded-[10px] [&_.milkdown-code-block_.tools_.language-button]:!opacity-100 [&_.milkdown-code-block_.tools_.tools-button-group>button]:!opacity-100 [&_.milkdown-code-block_.cm-content]:!caret-black [&_.milkdown-code-block_.cm-cursor]:!border-l-black [&_.milkdown-code-block_.cm-activeLine]:!bg-transparent [&_.milkdown-code-block_.cm-focused_.cm-activeLine]:!bg-[#e3e3e3] [&_.milkdown-code-block_.cm-gutters]:!hidden [&_.milkdown-code-block_.cm-lineNumbers]:!hidden [&_.milkdown-code-block_.cm-gutterElement]:!hidden [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_th]:border [&_td]:border [&_th]:text-left [&_td]:text-left [&_th]:px-2 [&_td]:px-2 [&_table>thead>tr:first-child>th]:!bg-gray-100 [&_table>thead>tr:first-child>td]:!bg-gray-100 [&_table>tbody>tr:first-child>th]:!bg-gray-100 [&_table>tbody>tr:first-child>td]:!bg-gray-100 dark:[&_table>thead>tr:first-child>th]:!bg-gray-800 dark:[&_table>thead>tr:first-child>td]:!bg-gray-800 dark:[&_table>tbody>tr:first-child>th]:!bg-gray-800 dark:[&_table>tbody>tr:first-child>td]:!bg-gray-800"
    />
  )
}
