import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import JoplinAPIClient from '../lib/joplin-api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: resolve(__dirname, '../../.env.test.local') });

describe('JoplinAPIClient', () => {
  let client: JoplinAPIClient;

  before(() => {
    // Check for required environment variables
    const requiredEnvVars = ['JOPLIN_PORT', 'JOPLIN_TOKEN'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`Error: ${envVar} environment variable is required for tests`);
        process.exit(1);
      }
    }

    client = new JoplinAPIClient({
      port: parseInt(process.env.JOPLIN_PORT || '41184', 10),
      token: process.env.JOPLIN_TOKEN as string
    });
  });

  it('knows the service is available', async () => {
    const available = await client.serviceAvailable();
    assert.strictEqual(available, true);
  });

  it('can create a note', async () => {
    const note = await client.post<{ id: string; title: string; body: string }>(
      '/notes', 
      { title: 'Test Note', body: 'This is a test note' }
    );

    const retrievedNote = await client.get<{ id: string; title: string; body: string }>(
      `/notes/${note.id}`, 
      { query: { fields: 'id,title,body' } }
    );

    assert.strictEqual(note.id, retrievedNote.id);
    assert.strictEqual(note.title, retrievedNote.title);
    assert.strictEqual(note.body, retrievedNote.body);
  });

  it('can list all notebooks', async () => {
    interface Notebook {
      id: string;
      title: string;
    }

    const notebooks = await client.getAllItems<Notebook>(
      '/folders', 
      { query: { fields: 'id,title' } }
    );

    assert(Array.isArray(notebooks));
    assert(notebooks.every(notebook => typeof notebook === 'object'));
    assert(notebooks.every(notebook => 
      Object.keys(notebook).includes('id') && 
      Object.keys(notebook).includes('title')
    ));
  });
});
