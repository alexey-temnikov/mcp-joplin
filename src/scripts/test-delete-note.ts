import dotenv from 'dotenv';
import JoplinAPIClient from '../lib/joplin-api-client.js';
import { SearchNotes, DeleteNote, CreateNote } from '../lib/tools/index.js';
import { DeleteNoteInput, CreateNoteInput } from '../types/index.js';

// Load environment variables
dotenv.config();

// Check for required environment variables
const requiredEnvVars = ['JOPLIN_PORT', 'JOPLIN_TOKEN'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} environment variable is required`);
    process.exit(1);
  }
}

// Create the Joplin API client
const apiClient = new JoplinAPIClient({
  port: parseInt(process.env.JOPLIN_PORT || '41184', 10),
  token: process.env.JOPLIN_TOKEN as string
});

// Create the tools
const searchNotes = new SearchNotes(apiClient);
const deleteNote = new DeleteNote(apiClient);
const createNote = new CreateNote(apiClient);

// Test the delete note functionality
async function testDeleteNote(): Promise<void> {
  try {
    // Check if Joplin is available
    const available = await apiClient.serviceAvailable();
    if (!available) {
      console.error('Error: Joplin service is not available');
      process.exit(1);
    }
    
    // Get note ID from command line arguments
    let noteId = process.argv[2];
    const permanent = process.argv[3] === 'permanent';
    
    // If no note ID is provided, create a test note to delete
    if (!noteId) {
      console.log('No note ID provided. Creating a test note to delete...');
      
      // Create a test note
      const createParams: CreateNoteInput = {
        title: `Test Note for Deletion ${new Date().toISOString()}`,
        body: 'This note was created for testing the delete functionality.'
      };
      
      const createResult = await createNote.call(createParams);
      console.log(createResult);
      
      // Extract the note ID from the result
      const idMatch = createResult.match(/Note ID: ([a-zA-Z0-9]+)/);
      if (idMatch && idMatch[1]) {
        noteId = idMatch[1];
        console.log(`\nCreated test note with ID: ${noteId}`);
      } else {
        console.error('Failed to extract note ID from create result');
        process.exit(1);
      }
    }
    
    // Delete the specified note
    console.log(`\nDeleting note with ID: "${noteId}"`);
    console.log(`Deletion type: ${permanent ? 'Permanent' : 'Move to trash'}`);
    
    const deleteParams: DeleteNoteInput = {
      note_id: noteId,
      permanent: permanent
    };
    
    const result = await deleteNote.call(deleteParams);
    console.log(result);
  } catch (error) {
    console.error('Error testing delete note:', error);
  }
}

testDeleteNote();
