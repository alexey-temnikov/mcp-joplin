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
