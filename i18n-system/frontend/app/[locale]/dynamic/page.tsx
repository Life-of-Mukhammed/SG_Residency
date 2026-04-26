'use client';
// ─── Dynamic Translation Demo ───────────────────────────────────────────────
// Shows translateBatch() and the client-side cache hit indicator.

import { useState, useEffect } from 'react';
import { useDynamicTranslation } from '@/lib/hooks/useDynamicTranslation';
import { useTranslation }        from 'react-i18next';
import DynamicText               from '@/components/DynamicText';

const SAMPLE_TEXTS = [
  'Artificial intelligence is transforming the global economy.',
  'Startup ecosystems are thriving across Central Asia.',
  'Renewable energy solutions are becoming more accessible.',
  'Remote work has permanently changed how teams collaborate.',
  'Blockchain technology enables trustless financial transactions.',
];

export default function DynamicDemoPage() {
  const { t }                                = useTranslation('common');
  const { translateBatch, isLoading, currentLocale } = useDynamicTranslation();

  const [customText, setCustomText]   = useState('');
  const [translated, setTranslated]   = useState<string[]>([]);
  const [customResult, setCustomResult] = useState('');
  const [cacheHit, setCacheHit]       = useState(false);

  // Translate the sample batch on locale change
  useEffect(() => {
    let cancelled = false;
    const start = performance.now();
    translateBatch(SAMPLE_TEXTS).then((results) => {
      if (cancelled) return;
      const elapsed = performance.now() - start;
      setCacheHit(elapsed < 5); // very fast = came from cache
      setTranslated(results);
    });
    return () => { cancelled = true; };
  }, [currentLocale, translateBatch]);

  const handleCustomTranslate = async () => {
    if (!customText.trim()) return;
    const result = await translateBatch([customText]);
    setCustomResult(result[0]);
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold mb-2">Dynamic Translation Demo</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Content below comes from a &quot;database&quot; (always in English).
          Change the language to see it auto-translated via Google Cloud API.
        </p>
      </div>

      {/* ── Status bar ── */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm">
        <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
        <span>
          {isLoading ? 'Translating...' : 'Ready'} ·
          Locale: <strong>{currentLocale}</strong> ·
          {cacheHit
            ? <span className="text-green-600 dark:text-green-400 ml-1">⚡ Cache hit</span>
            : <span className="text-indigo-600 dark:text-indigo-400 ml-1">🌐 API call</span>
          }
        </span>
      </div>

      {/* ── Batch translation ── */}
      <section>
        <h2 className="text-xl font-bold mb-4">Batch Translation (5 strings, 1 API call)</h2>
        <div className="space-y-3">
          {SAMPLE_TEXTS.map((text, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Original (EN)</p>
                <p className="text-gray-700 dark:text-gray-300">{text}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Translated ({currentLocale.toUpperCase()})</p>
                <p className="font-medium">
                  {translated[i]
                    ? translated[i]
                    : <span className="inline-block animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-48" />
                  }
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Custom text translator ── */}
      <section className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-xl font-bold">Try it yourself</h2>
        <div className="flex gap-3">
          <input
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomTranslate()}
            placeholder="Type any English text..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleCustomTranslate}
            disabled={isLoading || !customText.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Translate
          </button>
        </div>
        {customResult && (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs text-indigo-400 uppercase tracking-wide mb-1">Result ({currentLocale})</p>
            <p className="font-semibold text-indigo-700 dark:text-indigo-300">{customResult}</p>
          </div>
        )}
      </section>

      {/* ── DynamicText component demo ── */}
      <section>
        <h2 className="text-xl font-bold mb-4">&lt;DynamicText /&gt; component</h2>
        <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3 text-sm">
          <p className="text-gray-400">Code: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{`<DynamicText text="Hello world" from="en" />`}</code></p>
          <p>Output: <DynamicText text="Hello world" from="en" className="font-bold text-indigo-600" /></p>

          <p className="text-gray-400">Code: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{`<DynamicText text="We build great products" as="h3" />`}</code></p>
          <DynamicText text="We build great products" from="en" as="h3" className="font-bold text-lg" />
        </div>
      </section>
    </div>
  );
}
