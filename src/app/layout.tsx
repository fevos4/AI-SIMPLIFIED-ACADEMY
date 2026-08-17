import type { Metadata } from 'next';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          :root {
            --color-bg: #fdf9f2;
            --color-ink: #24201a;
            --color-pink: #e94f6b;
            --color-mint: #05b98a;
            --color-yellow: #ffd166;
            --color-muted: #6b6151;
            --color-muted-tan: #9a8e73;
            --border: 1px solid #ecdfc4;
            --radius-btn: 8px;
            --radius-card: 14px;
            --shadow-rest: 0 1px 2px rgba(36, 32, 26, 0.04);
            --shadow-hover: 0 8px 24px rgba(36, 32, 26, 0.08);
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--color-bg);
            color: var(--color-ink);
            margin: 0;
            padding: 0;
          }
          h1, h2, h3, h4, h5, h6, button, nav, .font-heading {
            font-family: 'Space Grotesk', sans-serif;
          }
        `}</style>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Inter', sans-serif", backgroundColor: '#fdf9f2', color: '#24201a' }}>
        {children}
      </body>
    </html>
  );
}
