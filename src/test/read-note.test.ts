import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import JoplinAPIClient from '../lib/joplin-api-client.js';
import { ReadNote } from '../lib/tools/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: resolve(__dirname, '../../.env.test.local') });

describe('ReadNote', () => {
  let client: JoplinAPIClient;
  let readNote: ReadNote;
  let testNoteId: string;

  before(async () => {
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
    
    readNote = new ReadNote(client);
    
    // Create a test note
    const uniqueTitle = `Test Note ${Date.now()}`;
    const note = await client.post<{ id: string }>(
      '/notes', 
      { 
        title: uniqueTitle, 
        body: 'This is a test note for the read note functionality'
      }
    );
    testNoteId = note.id;
  });

  it('returns an error message when no note ID is provided', async () => {
    const result = await readNote.call('');
    assert.strictEqual(result, 'Error: Note ID cannot be empty');
  });

  it('can read a note', async () => {
    const result = await readNote.call(testNoteId);
    
    // Check that the note was read correctly
    assert.ok(result.includes('Note:'), 'Result should include note title');
    assert.ok(result.includes(testNoteId), 'Result should include note ID');
    assert.ok(result.includes('This is a test note for the read note functionality'), 'Result should include the note body');
  });

  it('returns an error for non-existent note ID', async () => {
    const result = await readNote.call('non-existent-id');
    assert.ok(result.includes('not found'), 'Result should indicate note was not found');
  });
});
