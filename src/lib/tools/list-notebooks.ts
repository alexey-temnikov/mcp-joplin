import JoplinAPIClient from '../joplin-api-client.js';
import { JoplinNotebook } from '../../types/index.js';

class ListNotebooks {
  private apiClient: JoplinAPIClient;

  constructor(apiClient: JoplinAPIClient) {
    this.apiClient = apiClient;
  }

  async call(): Promise<string> {
    try {
      const notebooks = await this.apiClient.getAllItems<JoplinNotebook>(
        '/folders', 
        { query: { fields: 'id,title,parent_id' } }
      );

      const notebooksByParentId: Record<string, JoplinNotebook[]> = {};

      notebooks.forEach((notebook: JoplinNotebook) => {
        const parentId = notebook.parent_id || '';
        if (!notebooksByParentId[parentId]) {
          notebooksByParentId[parentId] = [];
        }
        notebooksByParentId[parentId].push(notebook);
      });

      // Add a header with instructions
      const resultLines = [
        'Joplin Notebooks:\n',
        'NOTE: To read a notebook, use the notebook_id with the read_notebook command\n',
        'Example: read_notebook notebook_id="your-notebook-id"\n\n'
      ];

      // Add the notebook hierarchy
      const rootNotebooks = notebooksByParentId[''] || [];
      resultLines.push(...this.notebooksLines(rootNotebooks, { indent: 0, notebooksByParentId }));

      return resultLines.join('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error listing notebooks: ${errorMessage}\n`);
      return `Error listing notebooks: ${errorMessage || 'Unknown error'}`;
    }
  }

  private notebooksLines(
    notebooks: JoplinNotebook[], 
    { indent = 0, notebooksByParentId }: { indent: number; notebooksByParentId: Record<string, JoplinNotebook[]> }
  ): string[] {
    const result: string[] = [];
    const indentSpaces = ' '.repeat(indent);

    this.sortNotebooks(notebooks).forEach(notebook => {
      const id = notebook.id;
      result.push(`${indentSpaces}Notebook: "${notebook.title}" (notebook_id: "${id}")\n`);

      const childNotebooks = notebooksByParentId[id];
      if (childNotebooks) {
        result.push(...this.notebooksLines(childNotebooks, {
          indent: indent + 2,
          notebooksByParentId
        }));
      }
    });

    return result;
  }

  private sortNotebooks(notebooks: JoplinNotebook[]): JoplinNotebook[] {
    // Ensure that notebooks starting with '[0]' are sorted first
    const CHARACTER_BEFORE_A = String.fromCharCode('A'.charCodeAt(0) - 1);
    return [...notebooks].sort((a, b) => {
      const titleA = a.title.replace('[', CHARACTER_BEFORE_A);
      const titleB = b.title.replace('[', CHARACTER_BEFORE_A);
      return titleA.localeCompare(titleB);
    });
  }
}

export default ListNotebooks;
