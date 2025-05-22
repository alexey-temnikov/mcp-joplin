import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import path from 'path';

import JoplinAPIClient from '../lib/joplin-api-client.js';
import { ImportMarkdown } from '../lib/tools/index.js';
import { ImportMarkdownInput } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: resolve(__dirname, '../../.env.test.local') });

describe('ImportMarkdown', () => {
  let client: JoplinAPIClient;
  let importMarkdown: ImportMarkdown;
  let testFilePath: string;
  let testFileWithHeadingPath: string;
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
    
    importMarkdown = new ImportMarkdown(client);
    
    // Create temporary test markdown files
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // File without heading
    testFilePath = path.join(tempDir, 'test-import.md');
    fs.writeFileSync(testFilePath, 'This is a test markdown file for import testing.\n\n- Item 1\n- Item 2\n- Item 3');
    
    // File with heading
    testFileWithHeadingPath = path.join(tempDir, 'test-import-with-heading.md');
    fs.writeFileSync(testFileWithHeadingPath, '# Custom Heading Title\n\nThis is a test markdown file with a heading.\n\n## Section\n\nContent here.');
  });

  // Clean up after tests
  after(async () => {
    // Delete created notes
    for (const noteId of createdNoteIds) {
      try {
        await client.delete(`/notes/${noteId}`);
      } catch (error) {
        console.error(`Failed to delete test note ${noteId}:`, error);
      }
    }
    
    // Delete temporary files
    try {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
      if (fs.existsSync(testFileWithHeadingPath)) {
        fs.unlinkSync(testFileWithHeadingPath);
      }
      
      // Try to remove the temp directory
      const tempDir = path.join(__dirname, 'temp');
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir);
      }
    } catch (error) {
      console.error('Failed to clean up temporary test files:', error);
    }
  });

  it('returns an error message when no file path is provided', async () => {
    const args: ImportMarkdownInput = {
      file_path: ''
    };
    const result = await importMarkdown.call(args);
    assert.ok(result.includes('Error: file_path is required'), 'Should return error for missing file path');
  });

  it('returns an error for non-existent file', async () => {
    const args: ImportMarkdownInput = {
      file_path: '/path/to/non-existent-file.md'
    };
    const result = await importMarkdown.call(args);
    assert.ok(result.includes('Error: File not found'), 'Should indicate file not found');
  });

  it('can import a markdown file using filename as title', async () => {
    const args: ImportMarkdownInput = {
      file_path: testFilePath
    };
    
    const result = await importMarkdown.call(args);
    
    // Extract the note ID from the result for cleanup
    const idMatch = result.match(/Note ID: ([a-zA-Z0-9]+)/);
    if (idMatch && idMatch[1]) {
      createdNoteIds.push(idMatch[1]);
    }
    
    // Check that the file was imported correctly
    assert.ok(result.includes('Markdown File Imported Successfully'), 'Should indicate successful import');
    assert.ok(result.includes('test-import'), 'Should use filename as title');
    assert.ok(result.includes('This is a test markdown file'), 'Should include file content');
  });

  it('can import a markdown file using heading as title', async () => {
    const args: ImportMarkdownInput = {
      file_path: testFileWithHeadingPath
    };
    
    const result = await importMarkdown.call(args);
    
    // Extract the note ID from the result for cleanup
    const idMatch = result.match(/Note ID: ([a-zA-Z0-9]+)/);
    if (idMatch && idMatch[1]) {
      createdNoteIds.push(idMatch[1]);
    }
    
    // Check that the file was imported correctly
    assert.ok(result.includes('Markdown File Imported Successfully'), 'Should indicate successful import');
    assert.ok(result.includes('Custom Heading Title'), 'Should use heading as title');
    assert.ok(result.includes('This is a test markdown file with a heading'), 'Should include file content');
  });

  it('can import a markdown file into a specific notebook', async () => {
    // First create a test notebook
    const folderResponse = await client.post<{ id: string }>('/folders', { 
      title: `Test Folder for Import ${Date.now()}`
    });
    const folderId = folderResponse.id;
    
    const args: ImportMarkdownInput = {
      file_path: testFilePath,
      parent_id: folderId
    };
    
    const result = await importMarkdown.call(args);
    
    // Extract the note ID from the result for cleanup
    const idMatch = result.match(/Note ID: ([a-zA-Z0-9]+)/);
    if (idMatch && idMatch[1]) {
      createdNoteIds.push(idMatch[1]);
    }
    
    // Check that the file was imported correctly
    assert.ok(result.includes('Markdown File Imported Successfully'), 'Should indicate successful import');
    assert.ok(result.includes(folderId), 'Should include the parent notebook ID');
    
    // Clean up the test folder
    await client.delete(`/folders/${folderId}`);
  });
});
