import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import { EditorContent } from '@tiptap/react';
import { useTranslation } from 'react-i18next';

import { postContentStyles } from '@/features/posts/PostContent';
import { layout } from '@/theme/tokens';
import { headingFont } from '@/theme/typography';

import { useArabDevEditor } from './editorConfig';
import { EditorToolbar } from './EditorToolbar';

interface PostEditorProps {
  title: string;
  onTitleChange: (title: string) => void;
  initialHtml: string;
  onHtmlChange: (html: string) => void;
  contentError?: string | null;
}

/** Title + toolbar + rich text body. The toolbar sticks under the app bar on long posts. */
export function PostEditor({ title, onTitleChange, initialHtml, onHtmlChange, contentError }: PostEditorProps) {
  const { t } = useTranslation();
  const editor = useArabDevEditor({
    content: initialHtml,
    placeholder: t('editor.bodyPlaceholder'),
    label: t('editor.bodyLabel'),
    onChange: onHtmlChange,
  });

  return (
    <Box
      sx={{
        border: 1,
        borderColor: contentError ? 'error.main' : 'divider',
        borderRadius: 3,
        bgcolor: 'background.paper',
        '&:focus-within': { borderColor: contentError ? 'error.main' : 'surface.borderStrong' },
      }}
    >
      <InputBase
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder={t('editor.titlePlaceholder')}
        fullWidth
        multiline
        slotProps={{ input: { 'aria-label': t('editor.titleLabel'), maxLength: 200, dir: 'auto' } }}
        sx={{
          px: { xs: 2, sm: 3 },
          pt: 2.5,
          pb: 1.5,
          fontFamily: headingFont,
          fontWeight: 700,
          fontSize: { xs: '1.5rem', sm: '1.875rem' },
          lineHeight: 1.35,
        }}
      />
      {editor && (
        <Box sx={{ position: 'sticky', top: layout.appBarHeight, zIndex: 2 }}>
          <EditorToolbar editor={editor} />
        </Box>
      )}
      <Box
        sx={[
          postContentStyles,
          {
            px: { xs: 2, sm: 3 },
            py: 2,
            '& .arabdev-editor': { minHeight: 320, outline: 'none' },
            '& .arabdev-editor p.is-editor-empty:first-of-type::before': {
              content: 'attr(data-placeholder)',
              color: 'text.disabled',
              float: 'left',
              height: 0,
              pointerEvents: 'none',
            },
            '& .arabdev-editor table': { display: 'table', width: '100%', tableLayout: 'fixed' },
            '& .arabdev-editor .selectedCell': { bgcolor: 'accent.subtle' },
            '& .arabdev-editor .tableWrapper': { overflowX: 'auto', my: 1.5 },
          },
        ]}
      >
        <EditorContent editor={editor} />
      </Box>
      {contentError && (
        <Box role="alert" sx={{ px: 3, pb: 1.5, color: 'error.main', fontSize: '0.875rem' }}>
          {contentError}
        </Box>
      )}
    </Box>
  );
}
