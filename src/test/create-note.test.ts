import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import JoplinAPIClient from '../lib/joplin-api-client.js';
import { CreateNote } from '../lib/tools/index.js';
import { CreateNoteInput } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: resolve(__dirname, '../../.env.test.local') });

describe('CreateNote', () => {
  let client: JoplinAPIClient;
  let createNote: CreateNote;
  let createdNoteIds: string[] = [];

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
    
    createNote = new CreateNote(client);
  });

  // Clean up created notes after tests
  after(async () => {
    for (const noteId of createdNoteIds) {
      try {
        await client.delete(`/notes/${noteId}`);
      } catch (error) {
        console.error(`Failed to delete test note ${noteId}:`, error);
      }
    }
  });

  it('returns an error message when no title is provided', async () => {
    const args: CreateNoteInput = {
      title: ''
    };
    const result = await createNote.call(args);
    assert.ok(result.includes('Error: title is required'), 'Should return error for missing title');
  });

  it('can create a basic note', async () => {
    const title = `Test Note ${Date.now()}`;
    const args: CreateNoteInput = {
      title: title,
      body: 'This is a test note created by the test suite'
    };
    
    const result = await createNote.call(args);
    
    // Extract the note ID from the result for cleanup
    const idMatch = result.match(/Note ID: ([a-zA-Z0-9]+)/);
    if (idMatch && idMatch[1]) {
      createdNoteIds.push(idMatch[1]);
    }
    
    // Check that the note was created correctly
    assert.ok(result.includes('Note Created Successfully'), 'Should indicate successful creation');
    assert.ok(result.includes(title), 'Should include the note title');
    assert.ok(result.includes('Type: Regular note'), 'Should indicate it is a regular note');
  });

  it('can create a todo note', async () => {
    const title = `Todo Test ${Date.now()}`;
    const args: CreateNoteInput = {
      title: title,
      body: 'This is a test todo item created by the test suite',
      is_todo: true
    };
    
    const result = await createNote.call(args);
    
    // Extract the note ID from the result for cleanup
    const idMatch = result.match(/Note ID: ([a-zA-Z0-9]+)/);
    if (idMatch && idMatch[1]) {
      createdNoteIds.push(idMatch[1]);
    }
    
    // Check that the note was created correctly
    assert.ok(result.includes('Note Created Successfully'), 'Should indicate successful creation');
    assert.ok(result.includes(title), 'Should include the note title');
    assert.ok(result.includes('Type: Todo item'), 'Should indicate it is a todo item');
  });

  it('can create a note in a specific notebook', async () => {
    // First create a test notebook
    const folderResponse = await client.post<{ id: string }>('/folders', { 
      title: `Test Folder ${Date.now()}`
    });
    const folderId = folderResponse.id;
    
    const title = `Notebook Test ${Date.now()}`;
    const args: CreateNoteInput = {
      title: title,
      body: 'This is a test note in a specific notebook',
      parent_id: folderId
    };
    
    const result = await createNote.call(args);
    
    // Extract the note ID from the result for cleanup
    const idMatch = result.match(/Note ID: ([a-zA-Z0-9]+)/);
    if (idMatch && idMatch[1]) {
      createdNoteIds.push(idMatch[1]);
    }
    
    // Check that the note was created correctly
    assert.ok(result.includes('Note Created Successfully'), 'Should indicate successful creation');
    assert.ok(result.includes(title), 'Should include the note title');
    assert.ok(result.includes(folderId), 'Should include the parent notebook ID');
    
    // Clean up the test folder
    await client.delete(`/folders/${folderId}`);
  });
});
