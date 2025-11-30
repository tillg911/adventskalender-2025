import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const fastify = Fastify({
  logger: true
});

// Statische Dateien bereitstellen
await fastify.register(fastifyStatic, {
  root: rootDir,
  prefix: '/',
});

// Root-Route für index.html
fastify.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

// Server starten
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`\n🎄 Adventskalender läuft auf http://localhost:${port}\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
