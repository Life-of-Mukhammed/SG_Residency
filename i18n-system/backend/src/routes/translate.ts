// ─── /translate routes ──────────────────────────────────────────────────────
import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { translateTexts, detectLanguage } from '../services/googleTranslate';
import { translationCache }               from '../services/cache';
import { isValidLocale }                  from '../types';

export const translateRouter = Router();

// ── Rate limiter: 60 req / minute per IP ──────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max:      60,
  message:  { error: 'Too many requests. Try again in a minute.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── POST /translate ───────────────────────────────────────────────────────
// Body: { text: string | string[], from?: string, to: Locale }
translateRouter.post('/', limiter, async (req: Request, res: Response) => {
  const { text, from = 'en', to } = req.body;

  if (!text) {
    return res.status(400).json({ error: '"text" is required' });
  }
  if (!to || !isValidLocale(to)) {
    return res.status(400).json({ error: '"to" must be en | ru | uz' });
  }

  const texts = Array.isArray(text) ? text : [text];

  if (texts.length > 128) {
    return res.status(400).json({ error: 'Max 128 strings per request' });
  }
  if (texts.some((t) => typeof t !== 'string')) {
    return res.status(400).json({ error: '"text" must be string or string[]' });
  }

  try {
    const translations = await translateTexts(texts, String(from), to);
    return res.json({ translations });
  } catch (err: any) {
    console.error('[/translate]', err.message);
    return res.status(502).json({ error: 'Translation service error' });
  }
});

// ── POST /translate/batch — explicit batch endpoint ────────────────────────
// Same as POST / but makes the batch intent explicit in the URL.
translateRouter.post('/batch', limiter, async (req: Request, res: Response) => {
  const { texts, from = 'en', to } = req.body;

  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: '"texts" must be a non-empty array' });
  }
  if (!to || !isValidLocale(to)) {
    return res.status(400).json({ error: '"to" must be en | ru | uz' });
  }

  try {
    const translations = await translateTexts(texts, String(from), to);
    return res.json({ translations, count: translations.length });
  } catch (err: any) {
    return res.status(502).json({ error: 'Translation service error' });
  }
});

// ── GET /translate/detect?text=Hello ─────────────────────────────────────
translateRouter.get('/detect', async (req: Request, res: Response) => {
  const text = req.query.text;
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: '"text" query param required' });
  }

  try {
    const language = await detectLanguage(text);
    return res.json({ language, text });
  } catch {
    return res.status(502).json({ error: 'Language detection failed' });
  }
});

// ── GET /translate/cache/stats ────────────────────────────────────────────
translateRouter.get('/cache/stats', (_req, res) => {
  res.json(translationCache.stats());
});
