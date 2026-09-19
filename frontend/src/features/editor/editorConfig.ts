import { useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Color, FontFamily, FontSize, TextStyle } from '@tiptap/extension-text-style';
import { TableKit } from '@tiptap/extension-table';
import { Placeholder } from '@tiptap/extensions';

import type { PostTextColor } from '@/theme/colors';

/**
 * The editor's controlled vocabulary. The backend sanitizer accepts exactly these values,
 * so what the toolbar offers is what survives publishing.
 */
export const FONT_OPTIONS = ['Tajawal', 'Alexandria', 'Anton'] as const;
export const SIZE_OPTIONS = ['14px', '16px', '18px', '20px', '24px', '30px'] as const;
export const COLOR_OPTIONS: { name: PostTextColor; labelKey: string }[] = [
  { name: 'red', labelKey: 'editor.colorRed' },
  { name: 'crimson', labelKey: 'editor.colorCrimson' },
  { name: 'ink', labelKey: 'editor.colorInk' },
  { name: 'graphite', labelKey: 'editor.colorGraphite' },
  { name: 'muted', labelKey: 'editor.colorMuted' },
];
export const ALIGNMENTS = ['start', 'center', 'end', 'justify'] as const;

export const colorValue = (name: PostTextColor) => `var(--ad-text-${name})`;

const SAFE_PROTOCOLS = ['http', 'https', 'mailto'];

interface EditorOptions {
  content: string;
  placeholder: string;
  label: string;
  onChange: (html: string) => void;
}

export function useArabDevEditor({ content, placeholder, label, onChange }: EditorOptions): Editor | null {
  return useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          protocols: SAFE_PROTOCOLS,
          isAllowedUri: (url, ctx) => {
            try {
              const parsed = new URL(url.includes(':') ? url : `${ctx.defaultProtocol}://${url}`);
              return SAFE_PROTOCOLS.includes(parsed.protocol.replace(':', ''));
            } catch {
              return false;
            }
          },
        },
        codeBlock: { languageClassPrefix: 'language-' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: [...ALIGNMENTS] }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    // Every paragraph picks its own direction: Arabic and English can share a post.
    textDirection: 'auto',
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': label,
        class: 'arabdev-editor',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML()),
  });
}
