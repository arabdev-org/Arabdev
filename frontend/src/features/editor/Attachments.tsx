import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { errorMessage } from '@/api/errors';
import { discoveryApi, mediaApi } from '@/api/misc';
import { queryKeys } from '@/api/queryKeys';
import type { Image } from '@/types/api';

export const MAX_TAGS = 5;

function normalizeTag(tag: string) {
  return tag.trim().replace(/^#+/, '').replace(/\s+/g, '-').slice(0, 30);
}

export function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const { t } = useTranslation();
  const { data: popular } = useQuery({
    queryKey: queryKeys.popularTags,
    queryFn: () => discoveryApi.popularTags(20),
    staleTime: 5 * 60_000,
  });
  const { data: interests } = useQuery({
    queryKey: queryKeys.interests,
    queryFn: discoveryApi.interests,
    staleTime: Infinity,
  });
  const options = useMemo(() => {
    const all = new Set<string>([...(popular ?? []).map((tag) => tag.slug), ...(interests ?? []).map((i) => i.slug)]);
    return [...all];
  }, [popular, interests]);

  const update = (tags: string[]) => {
    const unique: string[] = [];
    for (const raw of tags.flatMap((tag) => tag.split(','))) {
      const tag = normalizeTag(raw);
      if (tag && !unique.some((existing) => existing.toLowerCase() === tag.toLowerCase())) unique.push(tag);
    }
    onChange(unique.slice(0, MAX_TAGS));
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      options={options}
      value={value}
      onChange={(_, next) => update(next as string[])}
      filterSelectedOptions
      autoHighlight
      disabled={false}
      getOptionDisabled={() => value.length >= MAX_TAGS}
      renderValue={(tags, getItemProps) =>
        tags.map((tag, index) => {
          const { key, ...itemProps } = getItemProps({ index });
          return <Chip key={key} label={`#${tag}`} size="small" {...itemProps} />;
        })
      }
      renderOption={(props, option) => {
        const { key, ...rest } = props;
        return (
          <li key={key} {...rest}>
            #{option}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('editor.tags')}
          placeholder={value.length < MAX_TAGS ? t('editor.tagsPlaceholder') : undefined}
          helperText={`${t('editor.tagsHelp')} (${value.length}/${MAX_TAGS})`}
          slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps.htmlInput, dir: 'auto', maxLength: 30 } }}
        />
      )}
    />
  );
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ImageAttachment({
  image,
  onChange,
  onUploaded,
}: {
  image: Image | null;
  onChange: (image: Image | null) => void;
  onUploaded?: (id: number) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(null);
    if (!ACCEPTED.includes(file.type)) return setError(t('errors.file_type_not_allowed'));
    if (file.size > 5 * 1024 * 1024) return setError(t('errors.file_too_large'));
    setProgress(0);
    try {
      const media = await mediaApi.upload(file, setProgress);
      onUploaded?.(media.id);
      onChange({ id: media.id, url: media.url, width: media.width, height: media.height });
    } catch (uploadError) {
      setError(errorMessage(uploadError, t));
    } finally {
      setProgress(null);
    }
  };

  return (
    <Box>
      <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} hidden onChange={(event) => void onFile(event)} />
      {image ? (
        <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
          <Box
            component="img"
            src={image.url}
            alt={t('post.attachedImage')}
            sx={{ display: 'block', width: '100%', maxHeight: 280, objectFit: 'cover' }}
          />
          <Tooltip title={t('editor.removeImage')}>
            <IconButton
              onClick={() => onChange(null)}
              aria-label={t('editor.removeImage')}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <ButtonBase
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          sx={{
            width: '100%',
            py: 2.5,
            px: 2,
            gap: 1.5,
            justifyContent: 'flex-start',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'surface.borderStrong',
            color: 'text.secondary',
            textAlign: 'start',
            '&:hover': { borderColor: 'primary.main', color: 'text.primary', bgcolor: 'accent.subtle' },
          }}
        >
          <AddPhotoAlternateOutlinedIcon />
          <Box>
            <Typography sx={{ fontWeight: 700 }} color="text.primary">
              {progress !== null ? t('editor.uploading') : t('editor.addImage')}
            </Typography>
            <Typography variant="caption">{t('editor.imageHelp')}</Typography>
          </Box>
        </ButtonBase>
      )}
      {progress !== null && <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, borderRadius: 1 }} />}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

export function LinkAttachment({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}) {
  const { t } = useTranslation();
  return (
    <TextField
      label={t('editor.attachLink')}
      placeholder="https://github.com/…"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      fullWidth
      error={Boolean(error)}
      helperText={error ?? t('editor.attachLinkHelp')}
      slotProps={{
        htmlInput: { dir: 'ltr', inputMode: 'url', maxLength: 500 },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <LinkIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export function isValidLink(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
