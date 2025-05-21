import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import JoplinAPIClient from '../lib/joplin-api-client.js';
import { ReadMultiNote } from '../lib/tools/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: resolve(__dirname, '../../.env.test.local') });

describe('ReadMultiNote', () => {
  let client: JoplinAPIClient;
  let readMultiNote: ReadMultiNote;
  let testNoteIds: string[] = [];

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
    
    readMultiNote = new ReadMultiNote(client);
    
    // Create test notes
    for (let i = 1; i <= 3; i++) {
      const uniqueTitle = `Test Note ${i} - ${Date.now()}`;
      const note = await client.post<{ id: string }>(
        '/notes', 
        { 
          title: uniqueTitle, 
          body: `This is test note ${i} for the read multi-note functionality`
        }
      );
      testNoteIds.push(note.id);
    }
  });

  it('returns an error message when no note IDs are provided', async () => {
    const result = await readMultiNote.call([]);
    assert.strictEqual(result, 'Error: Note IDs array cannot be empty');
  });

  it('can read multiple notes', async () => {
    const result = await readMultiNote.call(testNoteIds);
    
    // Check that the notes were read correctly
    assert.ok(result.includes(`Reading ${testNoteIds.length} notes`), 'Result should include the number of notes');
    
    for (let i = 0; i < testNoteIds.length; i++) {
      assert.ok(result.includes(testNoteIds[i]), `Result should include note ID ${testNoteIds[i]}`);
      assert.ok(result.includes(`This is test note ${i+1}`), `Result should include the body of note ${i+1}`);
    }
    
    assert.ok(result.includes('Successfully retrieved: 3'), 'Result should indicate all notes were retrieved');
  });

  it('handles non-existent note IDs gracefully', async () => {
    const nonExistentId = 'non-existent-id';
    const mixedIds = [...testNoteIds.slice(0, 1), nonExistentId];
    
    const result = await readMultiNote.call(mixedIds);
    
    // Check that the existing note was read correctly
    assert.ok(result.includes(testNoteIds[0]), 'Result should include the existing note ID');
    assert.ok(result.includes('This is test note 1'), 'Result should include the existing note body');
    
    // Check that the error for non-existent note was handled
    assert.ok(result.includes('Errors'), 'Result should include an Errors section');
    assert.ok(result.includes(nonExistentId), 'Result should mention the non-existent ID');
    assert.ok(result.includes('Successfully retrieved: 1'), 'Result should indicate one note was retrieved');
    assert.ok(result.includes('Failed to retrieve: 1'), 'Result should indicate one note failed');
  });
});
