import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import JoplinAPIClient from '../lib/joplin-api-client.js';
import { DeleteNote } from '../lib/tools/index.js';
import { DeleteNoteInput } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: resolve(__dirname, '../../.env.test.local') });

describe('DeleteNote', () => {
  let client: JoplinAPIClient;
  let deleteNote: DeleteNote;
  let testNoteId: string;
  let permanentTestNoteId: string;

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
    
    deleteNote = new DeleteNote(client);
    
    // Create test notes for deletion
    const note1 = await client.post<{ id: string }>(
      '/notes', 
      { 
        title: `Test Note for Trash ${Date.now()}`, 
        body: 'This note will be moved to trash'
      }
    );
    testNoteId = note1.id;
    
    const note2 = await client.post<{ id: string }>(
      '/notes', 
      { 
        title: `Test Note for Permanent Deletion ${Date.now()}`, 
        body: 'This note will be permanently deleted'
      }
    );
    permanentTestNoteId = note2.id;
  });

  it('returns an error message when no note ID is provided', async () => {
    const args: DeleteNoteInput = {
      note_id: ''
    };
    const result = await deleteNote.call(args);
    assert.ok(result.includes('Error: note_id is required'), 'Should return error for missing note ID');
  });

  it('can move a note to trash (default behavior)', async () => {
    const args: DeleteNoteInput = {
      note_id: testNoteId
    };
    
    const result = await deleteNote.call(args);
    
    // Check that the note was moved to trash correctly
    assert.ok(result.includes('Note Deleted Successfully'), 'Should indicate successful deletion');
    assert.ok(result.includes('Deletion type: Moved to trash'), 'Should indicate note was moved to trash');
    assert.ok(result.includes('can be restored'), 'Should mention note can be restored');
  });

  it('can permanently delete a note', async () => {
    const args: DeleteNoteInput = {
      note_id: permanentTestNoteId,
      permanent: true
    };
    
    const result = await deleteNote.call(args);
    
    // Check that the note was permanently deleted
    assert.ok(result.includes('Note Deleted Successfully'), 'Should indicate successful deletion');
    assert.ok(result.includes('Deletion type: Permanent'), 'Should indicate permanent deletion');
    assert.ok(result.includes('cannot be recovered'), 'Should mention note cannot be recovered');
  });

  it('returns an error for non-existent note ID', async () => {
    const args: DeleteNoteInput = {
      note_id: 'non-existent-id'
    };
    
    const result = await deleteNote.call(args);
    assert.ok(result.includes('Error deleting note:'), 'Should indicate error deleting note. Received: ' + result);
  });
});
