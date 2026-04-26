'use client';
// ─── DynamicText ────────────────────────────────────────────────────────────
// Renders text that comes from an API / database and must be translated at
// runtime via the /api/translate route.
//
// Usage:
//   <DynamicText text="New startup accelerator launched" from="en" />
//   <DynamicText text={article.title} from={article.lang} className="font-bold" />

import { useEffect, useState }    from 'react';
import { useDynamicTranslation }  from '@/lib/hooks/useDynamicTranslation';

type Props = {
  text:        string;
  from?:       string;   // source language (default: 'en')
  as?:         keyof JSX.IntrinsicElements;
  className?:  string;
  showSkeleton?: boolean;
};

export default function DynamicText({
  text,
  from       = 'en',
  as: Tag    = 'span',
  className  = '',
  showSkeleton = true,
}: Props) {
  const { translate, currentLocale } = useDynamicTranslation();
  const [output, setOutput]          = useState(text);
  const [loading, setLoading]        = useState(false);

  useEffect(() => {
    if (!text) return;
    let cancelled = false;

    setLoading(true);
    translate(text, from).then((result) => {
      if (!cancelled) {
        setOutput(result);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [text, from, currentLocale, translate]);

  if (loading && showSkeleton) {
    return (
      <span
        className={`inline-block animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`}
        style={{ minWidth: `${Math.min(text.length * 8, 200)}px`, height: '1em' }}
        aria-hidden
      />
    );
  }

  return <Tag className={className}>{output}</Tag>;
}
