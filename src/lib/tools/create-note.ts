import JoplinAPIClient from '../joplin-api-client.js';
import { JoplinNote, CreateNoteInput } from '../../types/index.js';
import logger from '../logger.js';

/**
 * Tool to create a new note in Joplin
 */
class CreateNote {
  private apiClient: JoplinAPIClient;

  constructor(apiClient: JoplinAPIClient) {
    this.apiClient = apiClient;
  }

  /**
   * Create a new note in Joplin
   * 
   * @param args - Create note parameters
   * @returns Formatted response string
   */
  async call(args: CreateNoteInput): Promise<string> {
    try {
      // Check if Joplin is available
      const available = await this.apiClient.serviceAvailable();
      if (!available) {
        return 'Error: Joplin service is not available. Please make sure Joplin is running and the Web Clipper service is enabled.';
      }

      // Validate required fields
      if (!args.title) {
        return 'Error: title is required';
      }

      // Prepare note data
      const noteData: Record<string, any> = {
        title: args.title,
        body: args.body || '',
        is_todo: args.is_todo ? 1 : 0
      };

      if (args.parent_id) {
        noteData.parent_id = args.parent_id;
      }

      // Create the note
      const createdNote = await this.apiClient.post<JoplinNote>('/notes', noteData);
      
      // Format the response
      let response = `# Note Created Successfully\n\n`;
      response += `Note ID: ${createdNote.id}\n`;
      response += `Title: ${createdNote.title}\n`;
      
      if (createdNote.is_todo) {
        response += `Type: Todo item\n`;
      } else {
        response += `Type: Regular note\n`;
      }
      
      if (createdNote.parent_id) {
        try {
          const notebook = await this.apiClient.get<{ title: string }>(`/folders/${createdNote.parent_id}`);
          response += `Notebook: "${notebook.title}" (${createdNote.parent_id})\n`;
        } catch (error) {
          response += `Notebook ID: ${createdNote.parent_id}\n`;
        }
      }
      
      response += `\n## Related Commands\n`;
      response += `- To view the created note: read_note note_id="${createdNote.id}"\n`;
      
      if (createdNote.parent_id) {
        response += `- To view the notebook containing this note: read_notebook notebook_id="${createdNote.parent_id}"\n`;
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error creating note: ${errorMessage}`);
      return `Error creating note: ${errorMessage}`;
    }
  }
}

export default CreateNote;
