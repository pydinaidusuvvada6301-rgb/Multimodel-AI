import { createApp } from './app.js';
import { env } from './config/env.js';
import { initDatabase, pool } from './config/database.js';

async function bootstrap() {
  console.log('🚀 Initializing OmniMind AI Multimodal Intelligence API...');

  // Initialize DB connection or resilient in-memory fallback
  await initDatabase();

  const app = createApp();
  const port = env.PORT;

  const server = app.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`🌟 OmniMind AI Backend running on: http://localhost:${port}`);
    console.log(`🔗 API Base URL: http://localhost:${port}${env.API_BASE_URL}`);
    console.log(`🩺 Health check: http://localhost:${port}/health`);
    console.log(`🤖 Gemini Model: ${env.GEMINI_MODEL}`);
    console.log(`📦 Environment: ${env.NODE_ENV}`);
    console.log(`======================================================\n`);
  });

  // Graceful shutdown
  const handleShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Gracefully terminating OmniMind API server...`);
    server.close(async () => {
      if (pool) {
        await pool.end();
      }
      console.log('✅ Server connections closed cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('💥 Fatal error starting OmniMind API:', err);
  process.exit(1);
});
