import JoplinAPIClient from '../joplin-api-client.js';
import { JoplinNote } from '../../types/index.js';
import ReadNote from './read-note.js';

interface NoteWithNotebook extends JoplinNote {
  notebook_title?: string;
}

interface ReadMultiNoteResult {
  requested: number;
  successful: number;
  notes: NoteWithNotebook[];
  errors: Record<string, string>;
}

class ReadMultiNote {
  private apiClient: JoplinAPIClient;
  private readNote: ReadNote;

  constructor(apiClient: JoplinAPIClient) {
    this.apiClient = apiClient;
    this.readNote = new ReadNote(apiClient);
  }

  async call(noteIds: string[]): Promise<string> {
    try {
      if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
        return 'Error: Note IDs array cannot be empty';
      }

      const result: ReadMultiNoteResult = {
        requested: noteIds.length,
        successful: 0,
        notes: [],
        errors: {}
      };

      // Process each note ID
      for (const noteId of noteIds) {
        try {
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

          result.notes.push({
            ...note,
            notebook_title: notebookTitle
          });
          
          result.successful++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.errors[noteId] = errorMessage;
        }
      }

      return this.formatMultiNoteResult(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error reading multiple notes: ${errorMessage}\n`);
      return `Error reading multiple notes: ${errorMessage || 'Unknown error'}`;
    }
  }

  private formatMultiNoteResult(result: ReadMultiNoteResult): string {
    const resultLines = [
      `# Reading ${result.requested} notes\n`
    ];

    // Add each note
    result.notes.forEach((note, index) => {
      const noteNumber = index + 1;
      const createdDate = new Date(note.created_time).toLocaleString();
      const updatedDate = new Date(note.updated_time).toLocaleString();
      
      resultLines.push(`## Note ${noteNumber} of ${result.notes.length} (ID: ${note.id})\n`);
      resultLines.push(`### Note: "${note.title}"`);
      resultLines.push(`Notebook: "${note.notebook_title}" (notebook_id: "${note.parent_id}")`);
      
      // Add todo status if applicable
      if (note.is_todo) {
        const status = note.todo_completed ? 'Completed' : 'Not completed';
        resultLines.push(`Status: ${status}`);
        
        if (note.todo_due) {
          const dueDate = new Date(note.todo_due).toLocaleString();
          resultLines.push(`Due: ${dueDate}`);
        }
      }
      
      resultLines.push(`Created: ${createdDate}`);
      resultLines.push(`Updated: ${updatedDate}`);
      
      // Add separator before note content
      resultLines.push('\n---\n');
      
      // Add note content
      resultLines.push(note.body);
      
      // Add separator after note content
      resultLines.push('\n---\n');
    });

    // Add errors if any
    const errorIds = Object.keys(result.errors);
    if (errorIds.length > 0) {
      resultLines.push('## Errors');
      errorIds.forEach(noteId => {
        resultLines.push(`- Note ID "${noteId}": ${result.errors[noteId]}`);
      });
      resultLines.push('');
    }

    // Add summary
    resultLines.push('# Summary');
    resultLines.push(`Total notes requested: ${result.requested}`);
    resultLines.push(`Successfully retrieved: ${result.successful}`);
    if (errorIds.length > 0) {
      resultLines.push(`Failed to retrieve: ${errorIds.length}`);
    }

    return resultLines.join('\n');
  }
}

export default ReadMultiNote;
