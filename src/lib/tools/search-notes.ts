import JoplinAPIClient from '../joplin-api-client.js';

interface SearchResult {
  id: string;
  title: string;
  parent_id: string;
  updated_time: number;
  snippet: string;
  notebook_title?: string;
}

class SearchNotes {
  private apiClient: JoplinAPIClient;

  constructor(apiClient: JoplinAPIClient) {
    this.apiClient = apiClient;
  }

  async call(query: string): Promise<string> {
    try {
      if (!query || query.trim() === '') {
        return 'Error: Search query cannot be empty';
      }

      // Search for notes matching the query
      const searchResults = await this.apiClient.get<{ items: SearchResult[] }>(
        `/search?query=${query}`,
        { query: { query: query, type: 'note', fields: 'id,title,parent_id,updated_time,body' } }
      );

      if (!searchResults.items || searchResults.items.length === 0) {
        return `No notes found matching query: "${query}"`;
      }

      // Get notebook titles for each note
      const notebookIds = new Set<string>();
      searchResults.items.forEach((note: SearchResult) => notebookIds.add(note.parent_id));
      
      const notebookTitles: Record<string, string> = {};
      
      for (const notebookId of notebookIds) {
        try {
          const notebook = await this.apiClient.get<{ title: string }>(`/folders/${notebookId}`);
          notebookTitles[notebookId] = notebook.title;
        } catch {
          notebookTitles[notebookId] = 'Unknown Notebook';
        }
      }

      // Format the results
      const resultLines = [
        `Found ${searchResults.items.length} notes matching query: "${query}"`,
        'NOTE: To read a notebook, use the notebook ID (not the note title)\n'
      ];

      searchResults.items.forEach((note: SearchResult, index: number) => {
        const notebookTitle = notebookTitles[note.parent_id] || 'Unknown Notebook';
        const updatedDate = new Date(note.updated_time).toLocaleString();
        
        // Create a snippet from the note body (first 100 characters)
        const snippet = this.createSnippet(note.snippet || '');
        
        resultLines.push(`- Note: "${note.title}" (note_id: "${note.id}")`);
        resultLines.push(`  Notebook: "${notebookTitle}" (notebook_id: "${note.parent_id}")`);
        resultLines.push(`  Updated: ${updatedDate}`);
        resultLines.push(`  Snippet: ${snippet}`);
        resultLines.push(`  To read this notebook: read_notebook notebook_id="${note.parent_id}"`);
        
        if (index < searchResults.items.length - 1) {
          resultLines.push('');
        }
      });

      return resultLines.join('\n');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error searching notes: ${errorMessage}\n`);
      return `Error searching notes: ${errorMessage || 'Unknown error'}`;
    }
  }

  private createSnippet(text: string): string {
    // Remove markdown formatting and limit to 100 characters
    const plainText = text
      .replace(/#{1,6}\s+/g, '') // Remove headings
      .replace(/\*\*|__/g, '')    // Remove bold
      .replace(/\*|_/g, '')       // Remove italic
      .replace(/`{1,3}/g, '')     // Remove code blocks
      .replace(/\n/g, ' ')        // Replace newlines with spaces
      .trim();
      
    return plainText.length > 100 
      ? `${plainText.substring(0, 97)}...` 
      : plainText;
  }
}

export default SearchNotes;
