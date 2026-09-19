import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import type { SxProps, Theme } from '@mui/material/styles';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/features/preferences/PreferencesProvider';
import type { Language } from '@/i18n';
import { DOC_SITES, SUPPORT_EMAIL } from '@/site';

/**
 * The wiki, privacy policy and patch notes are standalone sites on their own subdomains
 * (wiki., privacy. and patch.arabdev.site). They always open in a new tab, in the reader's language.
 */
export function docUrls(language: Language) {
  return {
    wiki: `${DOC_SITES.wiki}${language}/`,
    privacy: `${DOC_SITES.privacy}${language}/`,
    patchNotes: `${DOC_SITES.patchNotes}${language}/`,
    license: '/LICENSE.txt',
    support: `mailto:${SUPPORT_EMAIL}`,
  };
}

export const newTab = { target: '_blank', rel: 'noopener' } as const;

/** A compact row of documentation links for footers. */
export function DocLinks({ sx }: { sx?: SxProps<Theme> }) {
  const { t } = useTranslation();
  const { language } = usePreferences();
  const urls = docUrls(language);
  const links = [
    { href: urls.wiki, label: t('nav.wiki') },
    { href: urls.privacy, label: t('nav.privacy') },
    { href: urls.patchNotes, label: t('nav.patchNotes') },
    { href: urls.license, label: t('nav.license') },
    { href: urls.support, label: t('nav.support') },
  ];
  return (
    <Box
      component="nav"
      aria-label={t('nav.docs')}
      sx={[{ typography: 'caption', color: 'text.secondary' }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {links.map((link, index) => (
        <Fragment key={link.href}>
          {index > 0 && ' · '}
          <Link href={link.href} color="inherit" {...(link.href.startsWith('mailto:') ? {} : newTab)}>
            {link.label}
          </Link>
        </Fragment>
      ))}
    </Box>
  );
}
