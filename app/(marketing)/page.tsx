'use client';


import { useState, FormEvent } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { buttonClasses } from '@/components/ui/button';

const navLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'SAST Scanner', href: '/dashboard/findings' },
  { label: 'Compliance', href: '/dashboard/policies' },
  { label: 'Reports', href: '/dashboard/reports' },
  { label: 'API Docs', href: '/docs' }
] satisfies Array<{ label: string; href: Route }>;

const sastHighlights = [
  {
    title: 'Next-Gen AI SAST',
    subtitle: 'Powered by adaptive models',
    icon: '🧠',
    stats: [
      { label: 'Detection rate', value: '99.7%' },
      { label: 'False positives', value: '< 0.1%' },
      { label: 'Speed', value: '10x faster' },
      { label: 'Languages', value: '25+' }
    ],
    bullets: [
      'Context-aware vulnerability detection',
      'Automatic fix suggestions generated inline',
      'Learns from your codebase and pipelines',
      'GDPR, POPIA, and regional compliance checks'
    ]
  },
  {
    title: 'Comprehensive SAST Engine',
    subtitle: 'Enterprise-grade depth',
    icon: '⚙️',
    stats: [
      { label: 'Code coverage', value: '100%' },
      { label: 'Scan depth', value: 'Deep' },
      { label: 'Integration', value: 'CI/CD' },
      { label: 'Compliance', value: 'Multi-region' }
    ],
    bullets: [
      'OWASP Top 10 plus African threat intel',
      'Infrastructure as Code scanning baked in',
      'Supply chain dependency analysis',
      'Real-time intelligence and policy updates'
    ]
  }
];

const scanStats = [
  { label: 'Scan time', value: '2.3s' },
  { label: 'Files analysed', value: '147' },
  { label: 'Critical issues', value: '3' },
  { label: 'Auto-fixable', value: '100%' }
];

const marketHighlights = [
  {
    title: 'Local compliance',
    description: 'POPIA, Kenya DPA, Nigeria NDPR and more built-in.',
    icon: '🌍'
  },
  {
    title: 'Mobile-first',
    description: 'Optimised for mobile wallets and African payment rails.',
    icon: '📱'
  },
  {
    title: 'Low bandwidth',
    description: 'Efficient pipelines tuned for distributed teams.',
    icon: '⚡'
  },
  {
    title: 'Flexible pricing',
    description: 'Usage-based plans crafted for regional startups.',
    icon: '💳'
  }
];

const heroBadges = [
  {
    icon: '✨',
    label: 'AI-SAST launch'
  },
  {
    icon: '📊',
    label: 'Continuous posture'
  }
];

const featureBullet = '🛡️';
const liveScanIcon = '💻';

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const contactDetails = [
    {
      title: 'Talk to sales',
      value: 'sales@shomarsec.com',
      href: 'mailto:sales@shomarsec.com',
      helper: 'We respond within one business day.'
    },
    {
      title: 'Call our team',
      value: '+27 10 500 1234',
      href: 'tel:+27105001234',
      helper: 'Available 9am – 6pm SAST, Monday to Friday.'
    },
    {
      title: 'Headquarters',
      value: 'Cape Town, South Africa',
      helper: 'Serving customers across Africa and beyond.'
    }
  ];
  const footerSections = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features', type: 'anchor' as const },
        { label: 'Pricing', href: '#pricing', type: 'anchor' as const },
        { label: 'SAST Scanner', href: '/dashboard/findings' as Route },
        { label: 'Compliance', href: '/dashboard/policies' as Route }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' as Route },
        { label: 'Careers', href: '/careers' as Route },
        { label: 'Trust Center', href: '/trust' as Route },
        { label: 'Contact', href: '/contact' as Route }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Docs', href: '/docs' as Route },
        { label: 'Blog', href: '/blog' as Route },
        { label: 'Status', href: '/status' as Route },
        { label: 'Guides', href: '/guides' as Route }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' as Route },
        { label: 'Terms of Service', href: '/legal' as Route },
        { label: 'Security', href: '/security' as Route },
        { label: 'Responsible Disclosure', href: '/responsible-disclosure' as Route }
      ]
    }
  ] satisfies Array<{
    title: string;
    links: Array<
      | { label: string; href: Route }
      | { label: string; href: `#${string}`; type: 'anchor' }
    >;
  }>;
  const socialLinks = [
    { label: 'Twitter', href: 'https://twitter.com/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
    { label: 'GitHub', href: 'https://github.com/' }
  ];
  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };
  const inputClasses =
    'w-full rounded-xl border border-[rgba(187,194,217,0.45)] bg-white px-4 py-3 text-sm text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
  const labelClasses =
    'mb-2 block text-xs font-medium uppercase tracking-wide text-foreground/60';

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-white to-surface-lighter px-4 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,255,0.18),transparent_60%)]" />
      <div className="pointer-events-none absolute -left-16 top-1/4 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/2 h-80 w-80 rounded-full bg-primary-dark/15 blur-3xl" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="fixed top-0 left-0 right-0 z-20 border-b border-white/40 bg-white/70 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Link href="/" className="text-xl font-semibold text-primary">
              Shomar
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-foreground/70 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href={'/auth/login' as Route}
                className={buttonClasses({
                  variant: 'secondary',
                  size: 'lg',
                  className: 'hidden px-6 md:inline-flex'
                })}
              >
                Sign in
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-full border border-primary/40 bg-white/80 p-2 text-primary transition hover:bg-primary/10 md:hidden"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
              >
                <span className="sr-only">Toggle navigation</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          {menuOpen && (
            <div className="md:hidden" id="mobile-menu">
              <div className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
                <nav className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-white/90 p-4 text-sm text-foreground/80 shadow-lg backdrop-blur">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-xl px-3 py-2 transition hover:bg-primary/10 hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href={'/auth/login' as Route}
                    onClick={() => setMenuOpen(false)}
                    className={buttonClasses({
                      variant: 'secondary',
                      size: 'lg',
                      className: 'w-full justify-center'
                    })}
                  >
                    Sign in
                  </Link>
                </nav>
              </div>
            </div>
          )}
        </header>

        <section className="flex flex-col gap-12 pb-20 pt-28 sm:pt-36">
          <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-white/50 bg-white/60 px-6 py-12 text-center shadow-[0_30px_60px_-45px_rgba(0,0,0,0.35)] backdrop-blur sm:px-12 sm:py-16">
            <div className="absolute inset-0 " />
            <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {heroBadges.map((badge) => (
                  <span
                    key={badge.label}
              className="animate-glow inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary"
                  >
                    <span aria-hidden>{badge.icon}</span>
                    {badge.label}
                  </span>
                ))}
              </div>
              <p className="text-balance text-2xl font-semibold text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
                Next-generation security built for Africa&apos;s digital future
              </p>
              <p className="text-sm text-foreground/70 sm:text-base">
                Introducing revolutionary AI-SAST technology tailored for African developers and enterprises
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href={'/auth/signup' as Route}
                  className={buttonClasses({
                    size: 'lg',
                    className: 'w-full justify-center gap-2 px-8 text-white sm:w-auto'
                  })}
                >
                  Start free trial <span aria-hidden>-&gt;</span>
                </Link>
                <Link
                  href={'/book-demo' as Route}
                  className={buttonClasses({
                    variant: 'secondary',
                    size: 'lg',
                    className: 'w-full justify-center px-8 sm:w-auto'
                  })}
                >
                Request Demo
                </Link>
              </div>
            </div>
          </div>

          <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2">
            {sastHighlights.map((highlight) => (
              <article
                key={highlight.title}
                className="relative flex w-full overflow-hidden rounded-3xl border border-[rgba(187,194,217,0.65)] bg-white p-6 shadow-[0_35px_65px_-50px_rgba(15,23,42,0.45)] transition duration-300 hover:-translate-y-1 hover:border-primary/50 sm:p-8"
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,255,0.08),rgba(255,255,255,0))]" />
                <div className="w-full flex flex-col relative z-10 space-y-6">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-lg">
                      <span aria-hidden>{highlight.icon}</span>
                    </span>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{highlight.title}</h2>
                      <p className="text-sm text-foreground/60">{highlight.subtitle}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {highlight.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-[rgba(187,194,217,0.45)] bg-primary-light/15 p-4 transition hover:border-primary/40 hover:bg-primary-light/30"
                      >
                        <p className="text-xs uppercase tracking-wide text-foreground/50">
                          {stat.label}
                        </p>
                    <p className="mt-2 text-lg font-semibold text-primary">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <ul className="grid gap-3 text-sm text-foreground/70">
                    {highlight.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <span aria-hidden className="mt-0.5 flex-shrink-0 text-primary">
                          {featureBullet}
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </section>

          <section className="flex flex-col gap-10">
            <div className="mx-auto w-full max-w-6xl rounded-3xl border border-[rgba(187,194,217,0.5)] bg-white/75 p-6 shadow-[0_35px_65px_-55px_rgba(15,23,42,0.55)] backdrop-blur sm:p-8 lg:p-12">
              <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">See AI-SAST in action</h2>
                  <p className="text-sm text-foreground/60">
                    Real-time scans with in-context remediation guidance.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/20 px-4 py-1 text-xs font-medium uppercase tracking-[0.25em] text-primary">
                  <span aria-hidden>{liveScanIcon}</span>
                  Live scan
                </span>
              </header>

              <div className="relative mt-6 w-full overflow-hidden rounded-2xl bg-white/80 p-5 shadow-inner">
                <div className="animate-scan absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
                <div className="space-y-4 font-mono text-xs text-foreground/70">
                  <span className="text-primary">// scanning payment integration...</span>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words text-foreground/70">
                  {`const processPayment = (amount, cardNumber) => {
                    console.log(cardNumber); // logging sensitive data
                    return fetch('/api/payment', {
                      method: 'POST',
                      body: JSON.stringify({ amount, cardNumber })
                    });
                  };`}
                  </pre>
                  <div className="rounded-xl border-l-4 border-critical bg-critical/10 p-4 text-sm text-critical">
                    <p className="font-semibold">
                      Critical - PCI-DSS violation - sensitive card data logged in plaintext
                    </p>
                    <p className="mt-1 text-foreground">
                      AI fix suggestion: replace with tokenisation via{' '}
                      <code>useTokenizedCard(cardNumber)</code>.
                    </p>
                  </div>
                </div>
              </div>

            </div>
              <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 rounded-3xl border border-[rgba(187,194,217,0.4)] bg-white/70 px-6 py-8 text-center shadow-[0_35px_65px_-55px_rgba(15,23,42,0.45)] sm:grid-cols-2 lg:grid-cols-4">
                {scanStats.map((stat) => (
                  <div key={stat.label} className="space-y-2">
                    <p className="text-4xl font-semibold text-primary">{stat.value}</p>
                    <p className="text-lg uppercase tracking-wide text-foreground/50">{stat.label}</p>
                  </div>
                ))}
              </div>
          </section>
          <div className="w-full">
            <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-4 text-center sm:px-6">
              <h2 className="text-lg font-semibold text-foreground">Why teams choose Shomar</h2>
              <p className="text-sm text-foreground/70 sm:text-base">
                Purpose-built for the African market with enterprise-grade rigor and developer-first
                workflows.
              </p>
            </div>
            <div className="mx-auto mt-6 grid w-full max-w-6xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
              {marketHighlights.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-[rgba(187,194,217,0.45)] bg-white/80 p-6 text-center transition hover:-translate-y-1 hover:border-primary/40 hover:bg-primary-light/15 sm:p-7"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-lg">
                    <span aria-hidden>{item.icon}</span>
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                    <p className="text-xs text-foreground/60 sm:text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <section
            id="contact"
            className="mx-auto mt-16 w-full max-w-6xl rounded-3xl border border-[rgba(187,194,217,0.5)] bg-white/80 p-6 shadow-[0_45px_90px_-65px_rgba(15,23,42,0.5)] backdrop-blur sm:p-8 lg:p-12"
          >
            <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
              <div className="space-y-6">
                <span className="inline-flex w-fit items-center rounded-full bg-primary/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
                  Contact
                </span>
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                    Let&apos;s talk about securing your pipeline
                  </h2>
                  <p className="text-sm text-foreground/70 sm:text-base">
                    Tell us about your environment and we&apos;ll tailor a demo and rollout plan built for your team.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {contactDetails.map((detail) => (
                    <div
                      key={detail.title}
                      className="rounded-2xl border border-[rgba(187,194,217,0.4)] bg-white/70 p-4"
                    >
                      <p className="text-xs uppercase tracking-wide text-foreground/50">{detail.title}</p>
                      {detail.href ? (
                        <a
                          href={detail.href}
                          className="mt-1 block text-sm font-semibold text-primary transition hover:text-primary-dark"
                        >
                          {detail.value}
                        </a>
                      ) : (
                        <p className="mt-1 text-sm font-semibold text-foreground">{detail.value}</p>
                      )}
                      <p className="mt-2 text-xs text-foreground/60">{detail.helper}</p>
                    </div>
                  ))}
                </div>
              </div>
              <form
                onSubmit={handleContactSubmit}
                className="space-y-4 rounded-2xl border border-[rgba(187,194,217,0.45)] bg-white/90 p-6 shadow-inner"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className={labelClasses}>
                      Full name
                    </label>
                    <input id="contact-name" name="name" type="text" placeholder="Ada Lovelace" className={inputClasses} />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className={labelClasses}>
                      Work email
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      placeholder="team@company.com"
                      className={inputClasses}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-company" className={labelClasses}>
                      Company
                    </label>
                    <input
                      id="contact-company"
                      name="company"
                      type="text"
                      placeholder="Shomar Security"
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-size" className={labelClasses}>
                      Team size
                    </label>
                    <select id="contact-size" name="size" className={inputClasses} defaultValue="">
                      <option value="" disabled>
                        Select a range
                      </option>
                      <option value="1-10">1-10 engineers</option>
                      <option value="11-50">11-50 engineers</option>
                      <option value="51-200">51-200 engineers</option>
                      <option value="200+">200+ engineers</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-message" className={labelClasses}>
                    How can we help?
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={4}
                    placeholder="Share details about your stack, dev workflows, and compliance requirements."
                    className={`${inputClasses} resize-none`}
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="submit"
                    className={buttonClasses({
                      size: 'lg',
                      className: 'w-full justify-center gap-2 text-white px-8 sm:w-auto'
                    })}
                  >
                    Book a conversation
                  </button>
                  <p className="text-xs text-foreground/60">
                    We never share your details. See our{' '}
                    <Link href={'/privacy' as Route} className="text-primary hover:underline">
                      privacy policy
                    </Link>
                    .
                  </p>
                </div>
              </form>
            </div>
          </section>

          <div className="mx-auto mt-10 flex w-full max-w-6xl justify-center">
            <Link
              href={'/contact' as Route}
              className={buttonClasses({
                variant: 'outline',
                size: 'lg',
                className: 'w-full max-w-sm justify-center gap-2 px-8'
              })}
            >
              Start free trial - no card required
            </Link>
          </div>
        </section>

        <footer className="border-t border-[rgba(187,194,217,0.5)] bg-white/95 backdrop-blur">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <div className="grid gap-10 text-sm text-foreground/70 md:grid-cols-3 lg:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))]">
              <div className="space-y-5">
                <Link href="/" className="inline-flex items-center text-2xl font-semibold text-primary">
                  Shomar
                </Link>
                <p>
                  AI-assisted SAST and DAST built for fast-moving engineering teams across Africa. Ship every release with confidence.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
                    >
                      <span className="sr-only">{link.label}</span>
                      {link.label.slice(0, 2)}
                    </a>
                  ))}
                </div>
              </div>
              {footerSections.map((section) => (
                <div key={section.title} className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                    {section.title}
                  </p>
                  <ul className="space-y-3 text-sm">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        {'type' in link && link.type === 'anchor' ? (
                          <a
                            href={link.href}
                            className="text-foreground/70 transition hover:text-primary"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            href={link.href as Route}
                            className="text-foreground/70 transition hover:text-primary"
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-3 border-t border-white/60 pt-6 text-xs text-foreground/60 sm:flex-row sm:items-center sm:justify-between">
              <span>&copy; {new Date().getFullYear()} Shomar Security. All rights reserved.</span>
              <div className="flex flex-wrap items-center gap-4">
                <Link href={'/privacy' as Route} className="hover:text-foreground">
                  Privacy
                </Link>
                <Link href={'/legal' as Route} className="hover:text-foreground">
                  Terms
                </Link>
                <Link href={'/trust' as Route} className="hover:text-foreground">
                  Trust Center
                </Link>
                <Link href={'/docs' as Route} className="hover:text-foreground">
                  Docs
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
