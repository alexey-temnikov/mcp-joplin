import dotenv from 'dotenv';
import JoplinAPIClient from '../lib/joplin-api-client.js';
import { CreateNote } from '../lib/tools/index.js';
import { CreateNoteInput } from '../types/index.js';

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

// Create the tool
const createNote = new CreateNote(apiClient);

// Test the create note functionality
async function testCreateNote(): Promise<void> {
  try {
    // Check if Joplin is available
    const available = await apiClient.serviceAvailable();
    if (!available) {
      console.error('Error: Joplin service is not available');
      process.exit(1);
    }
    
    // Get title and content from command line arguments or use defaults
    const title = process.argv[2] || `Test Note ${new Date().toISOString()}`;
    const content = process.argv[3] || `This is a test note created at ${new Date().toISOString()}`;
    const isTodo = process.argv[4] === 'todo';
    
    // Create note parameters
    const createParams: CreateNoteInput = {
      title: title,
      body: content,
      is_todo: isTodo
    };
    
    // Create the note
    console.log(`Creating a new ${isTodo ? 'todo' : 'regular'} note:`);
    console.log(`Title: "${title}"`);
    console.log(`Content: "${content}"`);
    
    const result = await createNote.call(createParams);
    console.log(result);
  } catch (error) {
    console.error('Error testing create note:', error);
  }
}

testCreateNote();
