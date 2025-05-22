import dotenv from 'dotenv';
import JoplinAPIClient from '../lib/joplin-api-client.js';
import { SearchNotes, UpdateNote } from '../lib/tools/index.js';
import { UpdateNoteInput } from '../types/index.js';

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
const updateNote = new UpdateNote(apiClient);

// Test the update note functionality
async function testUpdateNote(): Promise<void> {
  try {
    // Check if Joplin is available
    const available = await apiClient.serviceAvailable();
    if (!available) {
      console.error('Error: Joplin service is not available');
      process.exit(1);
    }
    
    // If no note ID is provided, search for notes first
    const noteId = process.argv[2];
    if (!noteId) {
      console.log('No note ID provided. Searching for a sample note:');
      const searchQuery = process.argv[3] || 'todo'; // Default search term if none provided
      const searchResults = await searchNotes.call(searchQuery);
      console.log(searchResults);
      console.log('\nPlease run again with a note ID from the search results above.');
      console.log('Example: npx tsx src/scripts/test-update-note.ts your-note-id "New Title" "New content"');
      process.exit(0);
    }
    
    // Get the new title and content from command line arguments
    const newTitle = process.argv[3] || `Updated Title ${new Date().toISOString()}`;
    const newContent = process.argv[4] || `This note was updated by the test script at ${new Date().toISOString()}`;
    
    // Create update parameters
    const updateParams: UpdateNoteInput = {
      note_id: noteId,
      title: newTitle,
      body: newContent
    };
    
    // Update the specified note
    console.log(`Updating note with ID: "${noteId}"`);
    console.log(`New title: "${newTitle}"`);
    console.log(`New content: "${newContent}"`);
    
    const result = await updateNote.call(updateParams);
    console.log(result);
  } catch (error) {
    console.error('Error testing update note:', error);
  }
}

testUpdateNote();
