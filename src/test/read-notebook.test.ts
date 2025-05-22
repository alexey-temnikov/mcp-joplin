import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import JoplinAPIClient from '../lib/joplin-api-client.js';
import { ReadNotebook } from '../lib/tools/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: resolve(__dirname, '../../.env.test.local') });

describe('ReadNotebook', () => {
  let client: JoplinAPIClient;
  let readNotebook: ReadNotebook;
  let testNotebookId: string;

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
    
    readNotebook = new ReadNotebook(client);
    
    // Create a test notebook
    const uniqueTitle = `Test Notebook ${Date.now()}`;
    const notebook = await client.post<{ id: string }>(
      '/folders', 
      { title: uniqueTitle }
    );
    testNotebookId = notebook.id;
    
    // Create a test note in the notebook
    await client.post<{ id: string }>(
      '/notes', 
      { 
        title: 'Test Note in Notebook', 
        body: 'This is a test note for the read notebook functionality',
        parent_id: testNotebookId
      }
    );
  });

  it('returns an error message when no notebook ID is provided', async () => {
    const result = await readNotebook.call('');
    assert.strictEqual(result, 'Error: Notebook ID cannot be empty');
  });

  it('can read a notebook', async () => {
    const result = await readNotebook.call(testNotebookId);
    
    // Check that the notebook was read correctly
    assert.ok(result.includes('Notebook:'), 'Result should include notebook title');
    assert.ok(result.includes(testNotebookId), 'Result should include notebook ID');
    assert.ok(result.includes('Test Note in Notebook'), 'Result should include the note title. Received: ' + result);
  });

  it('returns an error for non-existent notebook ID', async () => {
    const result = await readNotebook.call('non-existent-id');
    assert.ok(result.includes('not found'), 'Result should indicate notebook was not found');
  });
});
