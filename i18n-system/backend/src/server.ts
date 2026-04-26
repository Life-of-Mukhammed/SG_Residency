// ─── Express i18n Backend Server ───────────────────────────────────────────
import 'dotenv/config';
import express       from 'express';
import cors          from 'cors';
import helmet        from 'helmet';
import { langDetect }       from './middleware/langDetect';
import { translateRouter }  from './routes/translate';

const app  = express();
const PORT = Number(process.env.PORT ?? 4000);

// ── Security & parsing ───────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '256kb' }));

// ── Language detection middleware (attaches req.detectedLocale) ──────────
app.use(langDetect);

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/translate', translateRouter);

// ── Health check ─────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV ?? 'development',
    googleApi: Boolean(process.env.GOOGLE_TRANSLATE_API_KEY),
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ i18n backend running on http://localhost:${PORT}`);
  console.log(`   Google Translate API: ${process.env.GOOGLE_TRANSLATE_API_KEY ? '✓ configured' : '✗ not set (mock mode)'}`);
});

export default app;
