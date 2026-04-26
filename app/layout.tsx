import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/Providers';
import { ThemeInitializer } from '@/components/ThemeInitializer';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'SG Residency — Accelerator Platform',
  description: 'Manage your startup accelerator program with ease',
  icons: {
    icon: [
      { url: '/sg-logo.png', type: 'image/png', sizes: '512x512' },
      { url: '/sg-mark.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/sg-logo.png',
    apple: '/sg-logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <div id="google_translate_element" className="hidden" />
        <Providers>
          <ThemeInitializer />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </Providers>
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            window.__setGoogleTranslateLanguage = function (lang) {
              // When lang is 'uz' (page language), reset translation
              const targetLang = lang === 'uz' ? '' : lang;

              const apply = () => {
                const combo = document.querySelector('.goog-te-combo');
                if (!combo) return false;
                combo.value = targetLang;
                combo.dispatchEvent(new Event('change'));
                return true;
              };

              if (apply()) return;
              let tries = 0;
              const timer = setInterval(() => {
                tries += 1;
                if (apply() || tries > 30) clearInterval(timer);
              }, 300);
            };

            window.googleTranslateElementInit = function () {
              new window.google.translate.TranslateElement(
                {
                  pageLanguage: 'uz',
                  includedLanguages: 'uz,ru,en',
                  autoDisplay: false,
                  layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
                },
                'google_translate_element'
              );

              // Restore saved language after widget loads
              const savedLang = window.localStorage.getItem('residency_lang') || 'uz';
              if (savedLang !== 'uz') {
                setTimeout(() => {
                  window.__setGoogleTranslateLanguage(savedLang);
                }, 600);
              }
            };
          `}
        </Script>
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
