import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';

import { docUrls, newTab } from '@/components/DocLinks';
import '@/features/landing/landing.css';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAppearance } from '@/features/preferences/useAppearance';
import { usePreferences } from '@/features/preferences/PreferencesProvider';
import { useDocumentTitle } from '@/hooks';
import { HELLO_EMAIL, HOME_PATH, SUPPORT_EMAIL } from '@/site';

const INTERESTS = [
  'javascript',
  'typescript',
  'python',
  'rust',
  'go',
  'cpp',
  'csharp',
  'java',
  'react',
  'vue',
  'angular',
  'nodejs',
  'fastapi',
  'django',
  'ai',
  'machine-learning',
  'cybersecurity',
  'linux',
  'devops',
  'cloud',
  'databases',
  'game-development',
  'mobile-development',
  'ui-ux',
  'open-source',
];

function Arrow() {
  return (
    <svg
      className="lp-arrow"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function Check() {
  return (
    <svg
      className="lp-check"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  editor: (
    <>
      <path d="M4 5h16v14H4z" />
      <path d="M9 10l-2 2 2 2" />
      <path d="M15 10l2 2-2 2" />
    </>
  ),
  feed: (
    <>
      <rect x="3" y="4" width="18" height="6" rx="2" />
      <rect x="3" y="14" width="18" height="6" rx="2" />
    </>
  ),
  tags: (
    <>
      <path d="M3 12V5h7l11 11-7 7z" />
      <circle cx="7.5" cy="8.5" r="1.4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 6-3 7-3 7h18s-3-1-3-7z" />
      <path d="M10.5 20a2 2 0 0 0 3 0" />
    </>
  ),
  shield: <path d="M12 3l8 4v6c0 4.4-3.4 7.4-8 8-4.6-.6-8-3.6-8-8V7z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9h17M3.5 15h17" />
      <path d="M12 3c2.5 3 2.5 15 0 18-2.5-3-2.5-15 0-18z" />
    </>
  ),
};

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <span className="lp-icon">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        aria-hidden="true"
      >
        {ICONS[name]}
      </svg>
    </span>
  );
}

/** Fades sections in as they scroll into view; skipped when the device asks for less motion. */
function useReveal() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const targets = root.current?.querySelectorAll('.lp-reveal');
    if (!targets?.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return root;
}

/** Solid background on the header once the page has scrolled past the top. */
function useStickyHeader() {
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const onScroll = () => header.current?.classList.toggle('is-stuck', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return header;
}

export default function LandingPage() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const { language } = usePreferences();
  const { setLanguage } = useAppearance();
  const root = useReveal();
  const header = useStickyHeader();
  useDocumentTitle(t('home.metaTitle'));

  // Signed in: straight to the dashboard. Otherwise sign in first, then land there.
  const signedIn = status === 'authenticated';
  const startHref = signedIn ? HOME_PATH : '/login';
  const docs = docUrls(language);

  return (
    <div className="lp" ref={root}>
      <div className="lp-grid" aria-hidden="true" />
      <div className="lp-glow lp-glow-a" aria-hidden="true" />
      <div className="lp-glow lp-glow-b" aria-hidden="true" />

      <header className="lp-header" ref={header}>
        <div className="lp-shell lp-header-inner">
          <a className="lp-logo" href="#top" aria-label="ArabDev">
            <span>Arab</span>Dev
          </a>
          <nav className="lp-nav" aria-label={t('home.navLabel')}>
            <a href="#about">{t('home.navAbout')}</a>
            <a href="#features">{t('home.navFeatures')}</a>
            <a href="#start">{t('home.navStart')}</a>
            <a href="#docs">{t('home.navDocs')}</a>
            <a href="#contact">{t('home.navContact')}</a>
          </nav>
          <div className="lp-header-actions">
            <button
              type="button"
              className="lp-btn lp-btn-ghost lp-hide-sm"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              lang={language === 'ar' ? 'en' : 'ar'}
            >
              {language === 'ar' ? 'English' : 'العربية'}
            </button>
            {signedIn ? (
              <RouterLink className="lp-btn lp-btn-primary" to={HOME_PATH}>
                {t('home.openApp')}
              </RouterLink>
            ) : (
              <>
                <RouterLink className="lp-btn lp-btn-ghost lp-hide-sm" to="/login">
                  {t('common.signIn')}
                </RouterLink>
                <RouterLink className="lp-btn lp-btn-primary" to="/register">
                  {t('common.signUp')}
                </RouterLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="top">
        {/* hero */}
        <section className="lp-shell lp-hero">
          <div className="lp-hero-grid">
            <div>
              <span className="lp-badge">
                <span className="lp-dot" aria-hidden="true" />
                {t('home.badge')} <b>1.0</b>
              </span>
              <h1 className="lp-h1">
                {t('home.heroLine1')} <em>{t('home.heroHighlight')}</em>
                <br />
                {t('home.heroLine2')}
              </h1>
              <p className="lp-lead">{t('home.heroLead')}</p>
              <div className="lp-cta">
                <RouterLink className="lp-btn lp-btn-primary lp-btn-lg" to={startHref}>
                  {signedIn ? t('home.openApp') : t('home.getStarted')}
                  <Arrow />
                </RouterLink>
                <RouterLink className="lp-btn lp-btn-lg" to="/explore">
                  {t('home.browse')}
                </RouterLink>
              </div>
              <p className="lp-meta">
                <span>{t('home.metaFree')}</span>
                <span>{t('home.metaPrivacy')}</span>
                <span>{t('home.metaLangs')}</span>
              </p>
            </div>

            <div className="lp-window lp-reveal">
              <div className="lp-window-bar">
                <i aria-hidden="true" />
                <i aria-hidden="true" />
                <i aria-hidden="true" />
                <span className="lp-window-title">GET /api/v1/posts?tab=for_you</span>
              </div>
              <pre className="lp-code">
                <code>
                  {'{\n  '}
                  <span className="s">"items"</span>: [ … ],{'\n  '}
                  <span className="s">"page"</span>: <span className="n">1</span>,{'   '}
                  <span className="c">// صفحات مرقّمة</span>
                  {'\n  '}
                  <span className="s">"limit"</span>: <span className="n">20</span>,{'\n  '}
                  <span className="s">"total"</span>: <span className="n">143</span>,{'\n  '}
                  <span className="s">"pages"</span>: <span className="n">8</span>
                  {'\n}'}
                  {'\n\n'}
                  <span className="c"># {t('home.codeNote')}</span>
                  {'\n'}
                  <span className="k">curl</span> https://arabdev.site/api/v1/health
                  {'\n'}
                  {'{ '}
                  <span className="s">"status"</span>: <span className="s">"ok"</span>
                  {' }'}
                </code>
              </pre>
            </div>
          </div>
        </section>

        {/* interests marquee */}
        <div className="lp-marquee" aria-hidden="true">
          <div className="lp-marquee-track">
            {[...INTERESTS, ...INTERESTS].map((tag, index) => (
              <span className="lp-chip" key={`${tag}-${index}`}>
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* stats */}
        <section className="lp-shell lp-section">
          <ul className="lp-stats lp-reveal">
            <li className="lp-stat">
              <b>25</b>
              <span>{t('home.stat1')}</span>
            </li>
            <li className="lp-stat">
              <b>20</b>
              <span>{t('home.stat2')}</span>
            </li>
            <li className="lp-stat">
              <b>2</b>
              <span>{t('home.stat3')}</span>
            </li>
            <li className="lp-stat">
              <b>0</b>
              <span>{t('home.stat4')}</span>
            </li>
          </ul>
        </section>

        {/* about */}
        <section className="lp-shell lp-section" id="about">
          <div className="lp-split">
            <div className="lp-reveal">
              <span className="lp-eyebrow">{t('home.aboutEyebrow')}</span>
              <h2 className="lp-h2">{t('home.aboutTitle')}</h2>
              <p className="lp-sub">{t('home.aboutBody1')}</p>
              <p className="lp-sub">{t('home.aboutBody2')}</p>
              <a className="lp-card-link" href={docs.wiki} {...newTab}>
                {t('home.aboutLink')}
                <Arrow />
              </a>
            </div>
            <ul className="lp-list lp-reveal">
              <li>
                <Check />
                <div>
                  <b>{t('home.about1Title')}</b>
                  <p>{t('home.about1Body')}</p>
                </div>
              </li>
              <li>
                <Check />
                <div>
                  <b>{t('home.about2Title')}</b>
                  <p>{t('home.about2Body')}</p>
                </div>
              </li>
              <li>
                <Check />
                <div>
                  <b>{t('home.about3Title')}</b>
                  <p>{t('home.about3Body')}</p>
                </div>
              </li>
              <li>
                <Check />
                <div>
                  <b>{t('home.about4Title')}</b>
                  <p>{t('home.about4Body')}</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* features */}
        <section className="lp-shell lp-section" id="features">
          <div className="lp-reveal">
            <span className="lp-eyebrow">{t('home.featuresEyebrow')}</span>
            <h2 className="lp-h2">{t('home.featuresTitle')}</h2>
            <p className="lp-sub">{t('home.featuresSub')}</p>
          </div>
          <div className="lp-cards lp-cards-3 lp-reveal">
            <article className="lp-card">
              <Icon name="editor" />
              <h3>{t('home.f1Title')}</h3>
              <p>{t('home.f1Body')}</p>
            </article>
            <article className="lp-card">
              <Icon name="feed" />
              <h3>{t('home.f2Title')}</h3>
              <p>{t('home.f2Body')}</p>
            </article>
            <article className="lp-card">
              <Icon name="tags" />
              <h3>{t('home.f3Title')}</h3>
              <p>{t('home.f3Body')}</p>
            </article>
            <article className="lp-card">
              <Icon name="bell" />
              <h3>{t('home.f4Title')}</h3>
              <p>{t('home.f4Body')}</p>
            </article>
            <article className="lp-card">
              <Icon name="shield" />
              <h3>{t('home.f5Title')}</h3>
              <p>{t('home.f5Body')}</p>
            </article>
            <article className="lp-card">
              <Icon name="globe" />
              <h3>{t('home.f6Title')}</h3>
              <p>{t('home.f6Body')}</p>
            </article>
          </div>
        </section>

        {/* steps */}
        <section className="lp-shell lp-section" id="start">
          <div className="lp-reveal">
            <span className="lp-eyebrow">{t('home.stepsEyebrow')}</span>
            <h2 className="lp-h2">{t('home.stepsTitle')}</h2>
          </div>
          <div className="lp-cards lp-cards-3 lp-steps lp-reveal">
            <article className="lp-card lp-step">
              <b>01</b>
              <h3>{t('home.step1Title')}</h3>
              <p>{t('home.step1Body')}</p>
            </article>
            <article className="lp-card lp-step">
              <b>02</b>
              <h3>{t('home.step2Title')}</h3>
              <p>{t('home.step2Body')}</p>
            </article>
            <article className="lp-card lp-step">
              <b>03</b>
              <h3>{t('home.step3Title')}</h3>
              <p>{t('home.step3Body')}</p>
            </article>
          </div>
        </section>

        {/* privacy */}
        <section className="lp-shell lp-section" id="privacy">
          <div className="lp-split">
            <div className="lp-reveal">
              <span className="lp-eyebrow">{t('home.privacyEyebrow')}</span>
              <h2 className="lp-h2">{t('home.privacyTitle')}</h2>
              <p className="lp-sub">{t('home.privacyBody')}</p>
              <a className="lp-card-link" href={docs.privacy} {...newTab}>
                {t('home.privacyLink')}
                <Arrow />
              </a>
            </div>
            <div className="lp-cards lp-cards-2 lp-reveal" style={{ marginBlockStart: 0 }}>
              <article className="lp-card">
                <h3>{t('home.p1Title')}</h3>
                <p>{t('home.p1Body')}</p>
              </article>
              <article className="lp-card">
                <h3>{t('home.p2Title')}</h3>
                <p>{t('home.p2Body')}</p>
              </article>
              <article className="lp-card">
                <h3>{t('home.p3Title')}</h3>
                <p>{t('home.p3Body')}</p>
              </article>
              <article className="lp-card">
                <h3>{t('home.p4Title')}</h3>
                <p>{t('home.p4Body')}</p>
              </article>
            </div>
          </div>
        </section>

        {/* docs */}
        <section className="lp-shell lp-section" id="docs">
          <div className="lp-reveal">
            <span className="lp-eyebrow">{t('home.docsEyebrow')}</span>
            <h2 className="lp-h2">{t('home.docsTitle')}</h2>
            <p className="lp-sub">{t('home.docsSub')}</p>
          </div>
          <div className="lp-cards lp-cards-3 lp-reveal">
            <a className="lp-card" href={docs.wiki} {...newTab}>
              <h3>{t('nav.wiki')}</h3>
              <p>{t('home.docsWiki')}</p>
              <span className="lp-card-link">
                wiki.arabdev.site
                <Arrow />
              </span>
            </a>
            <a className="lp-card" href={docs.privacy} {...newTab}>
              <h3>{t('nav.privacy')}</h3>
              <p>{t('home.docsPrivacy')}</p>
              <span className="lp-card-link">
                privacy.arabdev.site
                <Arrow />
              </span>
            </a>
            <a className="lp-card" href={docs.patchNotes} {...newTab}>
              <h3>{t('nav.patchNotes')}</h3>
              <p>{t('home.docsPatch')}</p>
              <span className="lp-card-link">
                patch.arabdev.site
                <Arrow />
              </span>
            </a>
          </div>
        </section>

        {/* contact */}
        <section className="lp-shell lp-section" id="contact">
          <div className="lp-reveal">
            <span className="lp-eyebrow">{t('home.contactEyebrow')}</span>
            <h2 className="lp-h2">{t('home.contactTitle')}</h2>
            <p className="lp-sub">{t('home.contactSub')}</p>
          </div>
          <div className="lp-contact lp-reveal">
            <article className="lp-card">
              <h3>{t('home.contactSupportTitle')}</h3>
              <p>{t('home.contactSupportBody')}</p>
              <a className="lp-mail" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
            </article>
            <article className="lp-card">
              <h3>{t('home.contactHelloTitle')}</h3>
              <p>{t('home.contactHelloBody')}</p>
              <a className="lp-mail" href={`mailto:${HELLO_EMAIL}`}>
                {HELLO_EMAIL}
              </a>
            </article>
          </div>
        </section>

        {/* final call */}
        <section className="lp-shell lp-section">
          <div className="lp-final lp-reveal">
            <h2 className="lp-h2" style={{ marginBlockStart: 0 }}>
              {t('home.finalTitle')}
            </h2>
            <p className="lp-sub" style={{ marginInline: 'auto' }}>
              {t('home.finalBody')}
            </p>
            <div className="lp-cta">
              <RouterLink className="lp-btn lp-btn-primary lp-btn-lg" to={startHref}>
                {signedIn ? t('home.openApp') : t('home.getStarted')}
                <Arrow />
              </RouterLink>
              <a className="lp-btn lp-btn-lg" href={docs.wiki} {...newTab}>
                {t('home.readWiki')}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-shell">
          <div className="lp-footer-grid">
            <div>
              <a className="lp-logo" href="#top" aria-label="ArabDev">
                <span>Arab</span>Dev
              </a>
              <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.85, maxWidth: 320 }}>
                {t('home.footerAbout')}
              </p>
            </div>
            <div>
              <h4>{t('home.footerPlatform')}</h4>
              <ul>
                <li>
                  <RouterLink to={startHref}>{signedIn ? t('home.openApp') : t('home.getStarted')}</RouterLink>
                </li>
                <li>
                  <RouterLink to="/explore">{t('nav.explore')}</RouterLink>
                </li>
                <li>
                  <a href="#features">{t('home.navFeatures')}</a>
                </li>
              </ul>
            </div>
            <div>
              <h4>{t('home.footerDocs')}</h4>
              <ul>
                <li>
                  <a href={docs.wiki} {...newTab}>
                    {t('nav.wiki')}
                  </a>
                </li>
                <li>
                  <a href={docs.privacy} {...newTab}>
                    {t('nav.privacy')}
                  </a>
                </li>
                <li>
                  <a href={docs.patchNotes} {...newTab}>
                    {t('nav.patchNotes')}
                  </a>
                </li>
                <li>
                  <a href={docs.license} {...newTab}>
                    {t('nav.license')}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4>{t('home.footerContact')}</h4>
              <ul>
                <li>
                  <a href={`mailto:${SUPPORT_EMAIL}`} dir="ltr">
                    {SUPPORT_EMAIL}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${HELLO_EMAIL}`} dir="ltr">
                    {HELLO_EMAIL}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>{t('home.footerRights')}</span>
            <span dir="ltr">arabdev.site</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
