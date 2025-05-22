// Define types for Joplin API responses

export interface JoplinNotebook {
  id: string;
  title: string;
  parent_id: string;
}

export interface JoplinNote {
  id: string;
  title: string;
  body: string;
  parent_id: string;
  created_time: number;
  updated_time: number;
  is_todo: number;
  todo_completed?: number;
  todo_due?: number;
}

export interface JoplinPaginatedResponse<T> {
  items: T[];
  has_more: boolean;
}

export interface ApiClientOptions {
  port?: number;
  token: string;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean>;
  [key: string]: unknown;
}

export interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

// JSON-RPC message type for MCP
export interface JSONRPCMessage {
  jsonrpc: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// Input types for new tools

export interface UpdateNoteInput {
  /** ID of the note to update */
  note_id: string;
  /** New title for the note (optional) */
  title?: string;
  /** New body content for the note (optional) */
  body?: string;
  /** New parent notebook ID (optional) */
  parent_id?: string;
  /** New todo status (optional) */
  is_todo?: boolean;
}

export interface CreateNoteInput {
  /** Title of the new note */
  title: string;
  /** Body content of the new note (optional) */
  body?: string;
  /** Parent notebook ID (optional) */
  parent_id?: string;
  /** Whether this is a todo item (optional) */
  is_todo?: boolean;
}

export interface DeleteNoteInput {
  /** ID of the note to delete */
  note_id: string;
  /** Whether to permanently delete the note (optional) */
  permanent?: boolean;
}

export interface ImportMarkdownInput {
  /** Path to the markdown file to import */
  file_path: string;
  /** Parent notebook ID (optional) */
  parent_id?: string;
}
