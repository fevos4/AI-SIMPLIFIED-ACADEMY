import type { Metadata } from 'next';
import ScrollObserver from '@/components/ScrollObserver';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Simplified Academy',
  description: 'AI Learning Hub: AI Fundamentals, Getting Started with AI, and Prompt Engineering',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ scrollBehavior: 'smooth' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          :root {
            --color-bg: #FFFFFF;
            --color-card-bg: #F7F3EA;
            --color-ink: #191510;
            --color-vermilion: #A63A2C;
            --color-muted: #9A9284;
            --color-body: #55503F;
          }
          html {
            scroll-behavior: smooth !important;
          }
          body {
            font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--color-bg);
            color: var(--color-ink);
            margin: 0;
            padding: 0;
          }
          h1, h2, h3, h4, h5, h6, nav, .font-heading {
            font-family: 'Space Grotesk', sans-serif;
          }

          /* Smooth Scroll Reveal Animations */
          .scroll-reveal {
            opacity: 0;
            transform: translateY(24px);
            transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
            will-change: opacity, transform;
          }
          .scroll-reveal.is-revealed {
            opacity: 1 !important;
            transform: translateY(0) !important;
          }

          /* Global Tactile Button Active / Click Effects */
          button, a[role="button"], input[type="submit"] {
            transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s ease, background-color 0.15s ease, border-color 0.15s ease !important;
          }
          button:active, a[role="button"]:active, input[type="submit"]:active {
            transform: scale(0.97) translateY(1px) !important;
          }

          /* Tactile Card Elevation, Warm Contrast & Rich Shadowing */
          .fidel-card,
          section[style*="border"],
          div[style*="border: 1px solid rgba(25, 21, 16, 0.14)"],
          div[style*="border: 1px solid rgba(25, 21, 16, 0.2)"],
          div[style*="border: 1.5px solid #191510"],
          div[style*="border: 1px solid #191510"] {
            background-color: #F7F3EA !important;
            box-shadow: 0 6px 20px rgba(25, 21, 16, 0.08), 0 2px 4px rgba(25, 21, 16, 0.04) !important;
            transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease !important;
          }

          section[style*="border"]:hover,
          div[style*="border: 1px solid rgba(25, 21, 16, 0.2)"]:hover,
          div[style*="border: 1px solid rgba(25, 21, 16, 0.14)"]:hover,
          div[style*="border: 1.5px solid #191510"]:hover {
            box-shadow: 0 14px 32px rgba(25, 21, 16, 0.12), 0 3px 8px rgba(25, 21, 16, 0.06) !important;
          }

          /* Input Field Depth & Crisp Contrast */
          input[type="text"], input[type="email"], input[type="password"], input[type="number"], select, textarea {
            background-color: #FFFFFF !important;
            border: 1.5px solid #191510 !important;
            box-shadow: inset 0 1.5px 3px rgba(25, 21, 16, 0.06) !important;
            transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
          }
          input[type="text"]:focus, input[type="email"]:focus, input[type="password"]:focus, input[type="number"]:focus, select:focus, textarea:focus {
            box-shadow: inset 0 1.5px 3px rgba(25, 21, 16, 0.06), 0 0 0 2px rgba(25, 21, 16, 0.15) !important;
          }
        `}</style>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'IBM Plex Sans', sans-serif", backgroundColor: '#FFFFFF', color: '#191510' }}>
        <ScrollObserver />
        {children}
      </body>
    </html>
  );
}
