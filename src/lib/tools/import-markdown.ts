import fs from 'fs';
import path from 'path';
import JoplinAPIClient from '../joplin-api-client.js';
import { JoplinNote, ImportMarkdownInput } from '../../types/index.js';
import logger from '../logger.js';

/**
 * Tool to import a markdown file as a new note in Joplin
 */
class ImportMarkdown {
  private apiClient: JoplinAPIClient;

  constructor(apiClient: JoplinAPIClient) {
    this.apiClient = apiClient;
  }

  /**
   * Import a markdown file as a new note
   * 
   * @param args - Import markdown parameters
   * @returns Formatted response string
   */
  async call(args: ImportMarkdownInput): Promise<string> {
    try {
      // Check if Joplin is available
      const available = await this.apiClient.serviceAvailable();
      if (!available) {
        return 'Error: Joplin service is not available. Please make sure Joplin is running and the Web Clipper service is enabled.';
      }

      // Validate file path
      if (!args.file_path) {
        return 'Error: file_path is required';
      }

      // Check if file exists
      if (!fs.existsSync(args.file_path)) {
        return `Error: File not found at path: ${args.file_path}`;
      }

      // Read the markdown file
      const fileContent = fs.readFileSync(args.file_path, 'utf8');
      
      // Extract title from the first heading or use filename
      let title = path.basename(args.file_path, path.extname(args.file_path));
      const titleMatch = fileContent.match(/^#\\s+(.+)$/m);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }

      // Prepare note data
      const noteData: Record<string, any> = {
        title: title,
        body: fileContent
      };

      if (args.parent_id) {
        noteData.parent_id = args.parent_id;
      }

      // Create the note
      const createdNote = await this.apiClient.post<JoplinNote>('/notes', noteData);
      
      // Format the response
      let response = `# Markdown File Imported Successfully\n\n`;
      response += `Source file: ${args.file_path}\n`;
      response += `Note ID: ${createdNote.id}\n`;
      response += `Title: ${createdNote.title}\n`;
      
      if (createdNote.parent_id) {
        try {
          const notebook = await this.apiClient.get<{ title: string }>(`/folders/${createdNote.parent_id}`);
          response += `Notebook: "${notebook.title}" (${createdNote.parent_id})\n`;
        } catch (error) {
          response += `Notebook ID: ${createdNote.parent_id}\n`;
        }
      }
      
      response += `\n## Content Preview\n`;
      response += `\`\`\`markdown\n${fileContent.substring(0, 200)}${fileContent.length > 200 ? '...' : ''}\n\`\`\`\n`;
      
      response += `\n## Related Commands\n`;
      response += `- To view the imported note: read_note note_id="${createdNote.id}"\n`;
      
      if (createdNote.parent_id) {
        response += `- To view the notebook containing this note: read_notebook notebook_id="${createdNote.parent_id}"\n`;
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error importing markdown: ${errorMessage}`);
      return `Error importing markdown: ${errorMessage}`;
    }
  }
}

export default ImportMarkdown;
