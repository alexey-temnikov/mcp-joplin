import JoplinAPIClient from '../joplin-api-client.js';
import { JoplinNote } from '../../types/index.js';

interface NotebookInfo {
  id: string;
  title: string;
}

class ReadNotebook {
  private apiClient: JoplinAPIClient;

  constructor(apiClient: JoplinAPIClient) {
    this.apiClient = apiClient;
  }

  async call(notebookId: string): Promise<string> {
    try {
      if (!notebookId || notebookId.trim() === '') {
        return 'Error: Notebook ID cannot be empty';
      }

      // Get notebook info
      const notebook = await this.apiClient.get<NotebookInfo>(`/folders/${notebookId}`);
      
      // Get notes in the notebook
      const notes = await this.apiClient.get<{ items: JoplinNote[] }>(
        '/notes', 
        { query: { folder_id: notebookId, fields: 'id,title,updated_time,is_todo,todo_completed,todo_due' } }
      );

      if (!notes.items || notes.items.length === 0) {
        return `# Notebook: "${notebook.title}" (notebook_id: "${notebookId}")\nThis notebook is empty.`;
      }

      // Format the results
      const resultLines = [
        `# Notebook: "${notebook.title}" (notebook_id: "${notebookId}")`,
        `Contains ${notes.items.length} notes:`,
        'NOTE: This is showing the contents of notebook "' + notebook.title + '", not a specific note.\n'
      ];

      // Sort notes by updated_time (newest first)
      const sortedNotes = [...notes.items].sort((a, b) => b.updated_time - a.updated_time);

      sortedNotes.forEach((note, index) => {
        const updatedDate = new Date(note.updated_time).toLocaleString();
        let todoStatus = '';
        
        if (note.is_todo) {
          todoStatus = note.todo_completed ? '✅ ' : '☐ ';
        }
        
        resultLines.push(`- ${todoStatus}Note: "${note.title}" (note_id: "${note.id}")`);
        resultLines.push(`  Updated: ${updatedDate}`);
        
        if (index < sortedNotes.length - 1) {
          resultLines.push('');
        }
      });

      // Add a note about reading individual notes
      resultLines.push('\nTo read a specific note, use: read_note note_id="note-id-here"');
      resultLines.push('To read multiple notes at once, use: read_multinote note_ids=["id1", "id2", "id3"]');

      return resultLines.join('\n');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a 404 error (notebook not found)
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        return `Error: Notebook with ID "${notebookId}" not found. Please check the ID and try again.`;
      }
      
      process.stderr.write(`Error reading notebook: ${errorMessage}\n`);
      return `Error reading notebook: ${errorMessage || 'Unknown error'}`;
    }
  }
}

export default ReadNotebook;
