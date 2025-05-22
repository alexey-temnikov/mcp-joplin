import JoplinAPIClient from '../joplin-api-client.js';
import { JoplinNote, UpdateNoteInput } from '../../types/index.js';
import logger from '../logger.js';

/**
 * Tool to update an existing note in Joplin
 */
class UpdateNote {
  private apiClient: JoplinAPIClient;

  constructor(apiClient: JoplinAPIClient) {
    this.apiClient = apiClient;
  }

  /**
   * Update an existing note in Joplin
   * 
   * @param args - Update note parameters
   * @returns Formatted response string
   */
  async call(args: UpdateNoteInput): Promise<string> {
    try {
      // Check if Joplin is available
      const available = await this.apiClient.serviceAvailable();
      if (!available) {
        return 'Error: Joplin service is not available. Please make sure Joplin is running and the Web Clipper service is enabled.';
      }

      // Validate note_id
      if (!args.note_id) {
        return 'Error: note_id is required';
      }

      // Check if at least one update field is provided
      if (!args.title && !args.body && args.parent_id === undefined && args.is_todo === undefined) {
        return 'Error: At least one update field (title, body, parent_id, or is_todo) must be provided';
      }

      // Prepare update data
      const updateData: Record<string, any> = {};
      if (args.title !== undefined) updateData.title = args.title;
      if (args.body !== undefined) updateData.body = args.body;
      if (args.parent_id !== undefined) updateData.parent_id = args.parent_id;
      if (args.is_todo !== undefined) updateData.is_todo = args.is_todo ? 1 : 0;

      // Get the original note to compare changes
      const originalNote = await this.apiClient.get<JoplinNote>(`/notes/${args.note_id}`);
      
      // Update the note
      const updatedNote = await this.apiClient.put<JoplinNote>(`/notes/${args.note_id}`, updateData);
      
      // Format the response
      let response = `# Note Updated Successfully\n\n`;
      response += `Note ID: ${updatedNote.id}\n`;
      response += `Title: ${updatedNote.title}\n\n`;
      
      // Show what was updated
      response += `## Changes Made\n\n`;
      
      if (args.title !== undefined && originalNote.title !== updatedNote.title) {
        response += `- Title: "${originalNote.title}" → "${updatedNote.title}"\n`;
      }
      
      if (args.body !== undefined) {
        response += `- Content was updated\n`;
      }
      
      if (args.parent_id !== undefined && originalNote.parent_id !== updatedNote.parent_id) {
        response += `- Moved to different notebook\n`;
      }
      
      if (args.is_todo !== undefined && originalNote.is_todo !== updatedNote.is_todo) {
        response += `- Todo status: ${originalNote.is_todo ? 'Yes' : 'No'} → ${updatedNote.is_todo ? 'Yes' : 'No'}\n`;
      }
      
      response += `\n## Related Commands\n`;
      response += `- To view the updated note: read_note note_id="${updatedNote.id}"\n`;
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error updating note: ${errorMessage}`);
      return `Error updating note: ${errorMessage}`;
    }
  }
}

export default UpdateNote;
