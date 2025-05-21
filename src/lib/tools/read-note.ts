import JoplinAPIClient from '../joplin-api-client.js';
import { JoplinNote } from '../../types/index.js';

interface NoteWithNotebook extends JoplinNote {
  notebook_title?: string;
}

class ReadNote {
  private apiClient: JoplinAPIClient;

  constructor(apiClient: JoplinAPIClient) {
    this.apiClient = apiClient;
  }

  async call(noteId: string): Promise<string> {
    try {
      if (!noteId || noteId.trim() === '') {
        return 'Error: Note ID cannot be empty';
      }

      // Get note info with full content
      const note = await this.apiClient.get<JoplinNote>(
        `/notes/${noteId}`, 
        { query: { fields: 'id,title,body,parent_id,created_time,updated_time,is_todo,todo_completed,todo_due' } }
      );

      // Get notebook info
      let notebookTitle = 'Unknown Notebook';
      try {
        const notebook = await this.apiClient.get<{ title: string }>(`/folders/${note.parent_id}`);
        notebookTitle = notebook.title;
      } catch {
        // If notebook not found, continue with default title
      }

      // Format the results
      const noteWithNotebook: NoteWithNotebook = {
        ...note,
        notebook_title: notebookTitle
      };

      return this.formatNote(noteWithNotebook);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a 404 error (note not found)
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        return `Error: Note with ID "${noteId}" not found. Please check the ID and try again.`;
      }
      
      process.stderr.write(`Error reading note: ${errorMessage}\n`);
      return `Error reading note: ${errorMessage || 'Unknown error'}`;
    }
  }

  private formatNote(note: NoteWithNotebook): string {
    const createdDate = new Date(note.created_time).toLocaleString();
    const updatedDate = new Date(note.updated_time).toLocaleString();
    
    const resultLines = [
      `# Note: "${note.title}"`,
      `Note ID: ${note.id}`,
      `Notebook: "${note.notebook_title}" (notebook_id: "${note.parent_id}")`,
      `Created: ${createdDate}`,
      `Updated: ${updatedDate}`
    ];

    // Add todo status if applicable
    if (note.is_todo) {
      const status = note.todo_completed ? 'Completed' : 'Not completed';
      resultLines.push(`Status: ${status}`);
      
      if (note.todo_due) {
        const dueDate = new Date(note.todo_due).toLocaleString();
        resultLines.push(`Due: ${dueDate}`);
      }
    }

    // Add separator before note content
    resultLines.push('\n---\n');
    
    // Add note content
    resultLines.push(note.body);
    
    // Add separator after note content
    resultLines.push('\n---\n');
    
    // Add related commands
    resultLines.push('Related commands:');
    resultLines.push(`- To view the notebook containing this note: read_notebook notebook_id="${note.parent_id}"`);
    resultLines.push('- To search for more notes: search_notes query="your search term"');

    return resultLines.join('\n');
  }
}

export default ReadNote;
