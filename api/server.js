// api/server.js
import express from 'express';
import cors from 'cors';
import { randomBytes, createHash } from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

const TOKEN_PREFIX = 'sl_';
const TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 gün
const TOKEN_PATTERN = /^sl_[A-Za-z0-9+/=]+\.[a-f0-9]{64}$/;

function generateToken(walletAddress) {
  const timestamp = Date.now();
  const randomPart = randomBytes(16).toString('hex');
  const data = `${walletAddress}:${timestamp}:${randomPart}`;
  const hash = createHash('sha256').update(data).digest('hex');
  return `${TOKEN_PREFIX}${Buffer.from(data).toString('base64')}.${hash}`;
}

function validateToken(token) {
  if (!TOKEN_PATTERN.test(token)) return null;
  try {
    const [prefixedData, hash] = token.slice(TOKEN_PREFIX.length).split('.');
    const data = Buffer.from(prefixedData, 'base64').toString();
    const [walletAddress, timestampStr] = data.split(':');
    const timestamp = Number(timestampStr);
    if (Date.now() - timestamp > TOKEN_EXPIRY) return null;
    const expectedHash = createHash('sha256').update(data).digest('hex');
    if (hash !== expectedHash) return null;
    return walletAddress;
  } catch {
    return null;
  }
}

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.post('/api/token/generate', (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress missing' });
  res.json({ token: generateToken(walletAddress) });
});

app.post('/api/token/validate', (req, res) => {
  const { token } = req.body;
  const wallet = validateToken(token);
  if (!wallet) return res.status(400).json({ valid: false });
  res.json({ valid: true, walletAddress: wallet });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
