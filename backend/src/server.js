import { env } from './config/env.js';
import { initSchema } from './config/db.js';
import app from './app.js';

initSchema()
  .then(() => console.log('DB ready'))
  .catch((e) => console.error('DB init failed:', e.message));

app.listen(env.port, () => console.log(`API running on http://localhost:${env.port}`));
