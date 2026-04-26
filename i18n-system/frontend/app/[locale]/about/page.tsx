// ─── About page — demonstrates useTranslation() in a Client Component ──────
'use client';

import { useTranslation } from 'react-i18next';
import LanguageSwitcher   from '@/components/LanguageSwitcher';

const TEAM = [
  { name: 'Aisha Karimova', role: 'Founder & CEO',   avatar: '👩‍💼' },
  { name: 'Dmitri Volkov',  role: 'Head of Product', avatar: '👨‍💻' },
  { name: 'Jamshid Rahimov', role: 'Lead Engineer',  avatar: '🧑‍🔧' },
];

export default function AboutPage() {
  // useTranslation() works in Client Components
  const { t } = useTranslation('about');

  return (
    <div className="space-y-12">
      {/* ── Header ── */}
      <section className="space-y-3">
        <h1 className="text-4xl font-extrabold">{t('title')}</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">{t('description')}</p>
      </section>

      {/* ── Mission / Vision cards ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {(['mission', 'vision'] as const).map((key) => (
          <div key={key} className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 space-y-2">
            <h2 className="font-bold text-lg capitalize">{t(`${key}.title`)}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              {t(`${key}.body`)}
            </p>
          </div>
        ))}
      </div>

      {/* ── Team ── */}
      <section>
        <h2 className="text-2xl font-bold mb-5">{t('team.title')}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {TEAM.map((member) => (
            <div key={member.name}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-center"
            >
              <div className="text-5xl">{member.avatar}</div>
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-gray-400">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Language switcher demo ── */}
      <section className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-6 space-y-3">
        <h2 className="font-bold text-indigo-700 dark:text-indigo-300">{t('langDemo.title')}</h2>
        <p className="text-sm text-indigo-600 dark:text-indigo-400">{t('langDemo.body')}</p>
        <div className="flex flex-wrap gap-3">
          <LanguageSwitcher variant="buttons" />
          <LanguageSwitcher variant="dropdown" />
        </div>
      </section>
    </div>
  );
}
