import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import JoplinAPIClient from '../lib/joplin-api-client.js';
import { UpdateNote } from '../lib/tools/index.js';
import { UpdateNoteInput } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: resolve(__dirname, '../../.env.test.local') });

describe('UpdateNote', () => {
  let client: JoplinAPIClient;
  let updateNote: UpdateNote;
  let testNoteId: string;
  let originalTitle: string;

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
    
    updateNote = new UpdateNote(client);
    
    // Create a test note
    originalTitle = `Test Note for Update ${Date.now()}`;
    const note = await client.post<{ id: string }>(
      '/notes', 
      { 
        title: originalTitle, 
        body: 'This is a test note for the update note functionality'
      }
    );
    testNoteId = note.id;
  });

  it('returns an error message when no note ID is provided', async () => {
    const args: UpdateNoteInput = {
      note_id: '',
      title: 'Updated Title'
    };
    const result = await updateNote.call(args);
    assert.ok(result.includes('Error: note_id is required'), 'Should return error for missing note ID');
  });

  it('returns an error when no update fields are provided', async () => {
    const args: UpdateNoteInput = {
      note_id: testNoteId
    };
    const result = await updateNote.call(args);
    assert.ok(result.includes('Error: At least one update field'), 'Should return error when no update fields provided');
  });

  it('can update a note title', async () => {
    const newTitle = `Updated Title ${Date.now()}`;
    const args: UpdateNoteInput = {
      note_id: testNoteId,
      title: newTitle
    };
    
    const result = await updateNote.call(args);
    
    // Check that the note was updated correctly
    assert.ok(result.includes('Note Updated Successfully'), 'Should indicate successful update');
    assert.ok(result.includes(newTitle), 'Should include the new title');
    assert.ok(result.includes(`"${originalTitle}" → "${newTitle}"`), 'Should show title change');
  });

  it('can update a note body', async () => {
    const newBody = 'This is the updated content of the test note';
    const args: UpdateNoteInput = {
      note_id: testNoteId,
      body: newBody
    };
    
    const result = await updateNote.call(args);
    
    // Check that the note was updated correctly
    assert.ok(result.includes('Note Updated Successfully'), 'Should indicate successful update');
    assert.ok(result.includes('Content was updated'), 'Should indicate content was updated');
  });

  it('can update a note todo status', async () => {
    const args: UpdateNoteInput = {
      note_id: testNoteId,
      is_todo: true
    };
    
    const result = await updateNote.call(args);
    
    // Check that the note was updated correctly
    assert.ok(result.includes('Note Updated Successfully'), 'Should indicate successful update');
    assert.ok(result.includes('Todo status:'), 'Should indicate todo status was updated');
  });

  it('returns an error for non-existent note ID', async () => {
    const args: UpdateNoteInput = {
      note_id: 'non-existent-id',
      title: 'This should fail'
    };
    
    const result = await updateNote.call(args);
    assert.ok(result.includes('Error updating note:'), 'Should indicate error updating note');
  });
});
