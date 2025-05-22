import JoplinAPIClient from '../joplin-api-client.js';
import { JoplinNote, DeleteNoteInput } from '../../types/index.js';
import logger from '../logger.js';

/**
 * Tool to delete a note from Joplin
 */
class DeleteNote {
  private apiClient: JoplinAPIClient;

  constructor(apiClient: JoplinAPIClient) {
    this.apiClient = apiClient;
  }

  /**
   * Delete a note from Joplin
   * 
   * @param args - Delete note parameters
   * @returns Formatted response string
   */
  async call(args: DeleteNoteInput): Promise<string> {
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

      // Get note details before deletion for the response
      let noteTitle = 'Unknown';
      let noteExists = false;
      try {
        const note = await this.apiClient.get<JoplinNote>(`/notes/${args.note_id}`);
        noteTitle = note.title;
        noteExists = true;
      } catch (error) {
        // If we can't retrieve the note, it probably doesn't exist
        // We'll handle this below instead of just logging a warning
        logger.warn(`Could not retrieve note details before deletion: ${error}`);
      }

      // If the note doesn't exist, return an error
      if (!noteExists) {
        return `Error deleting note: Note with ID "${args.note_id}" not found`;
      }

      // Delete the note
      const permanent = args.permanent === true;
      const endpoint = permanent ? `/notes/${args.note_id}?permanent=1` : `/notes/${args.note_id}`;
      await this.apiClient.delete(endpoint);
      
      // Format the response
      let response = `# Note Deleted Successfully\n\n`;
      response += `Note ID: ${args.note_id}\n`;
      response += `Title: ${noteTitle}\n`;
      response += `Deletion type: ${permanent ? 'Permanent' : 'Moved to trash'}\n\n`;
      
      if (!permanent) {
        response += `Note: The note has been moved to the trash. It can be restored from within Joplin.\n\n`;
      } else {
        response += `Note: This note has been permanently deleted and cannot be recovered.\n\n`;
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error deleting note: ${errorMessage}`);
      return `Error deleting note: ${errorMessage}`;
    }
  }
}

export default DeleteNote;
