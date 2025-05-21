import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import logger from './lib/logger.js';
import parseArgs from './lib/parse-args.js';
import JoplinAPIClient from './lib/joplin-api-client.js';
import { ListNotebooks, SearchNotes, ReadNotebook, ReadNote, ReadMultiNote } from './lib/tools/index.js';

// Parse command line arguments
parseArgs();

// Set default port if not specified
if (!process.env.JOPLIN_PORT) {
  process.env.JOPLIN_PORT = '41184';
}

// Check for required environment variables
if (!process.env.JOPLIN_TOKEN) {
  process.stderr.write('Error: JOPLIN_TOKEN is required. Use --token <token> or set JOPLIN_TOKEN environment variable.\n');
  process.stderr.write('Find your token in Joplin: Tools > Options > Web Clipper\n');
  process.exit(1);
}

// Create the Joplin API client
const apiClient = new JoplinAPIClient({
  port: parseInt(process.env.JOPLIN_PORT, 10),
  token: process.env.JOPLIN_TOKEN
});

// Create the MCP server
const server = new McpServer({
  name: 'joplin-mcp-server',
  version: '1.0.0'
});

// Register the list_notebooks tool
server.registerTool(
  'list_notebooks',
  {
    description: 'Retrieve the complete notebook hierarchy from Joplin'
  },
  async () => {
    const result = await new ListNotebooks(apiClient).call();
    return {
      content: [{ type: 'text', text: result }]
    };
  }
);

// Register the search_notes tool
server.registerTool(
  'search_notes',
  {
    description: 'Search for notes in Joplin and return matching notebooks',
    inputSchema: { query: z.string() }
  },
  async (args) => {
    const result = await new SearchNotes(apiClient).call(args.query);
    return {
      content: [{ type: 'text', text: result }]
    };
  }
);

// Register the read_notebook tool
server.registerTool(
  'read_notebook',
  {
    description: 'Read the contents of a specific notebook',
    inputSchema: { notebook_id: z.string() }
  },
  async (args) => {
    const result = await new ReadNotebook(apiClient).call(args.notebook_id);
    return {
      content: [{ type: 'text', text: result }]
    };
  }
);

// Register the read_note tool
server.registerTool(
  'read_note',
  {
    description: 'Read the full content of a specific note',
    inputSchema: { note_id: z.string() }
  },
  async (args) => {
    const result = await new ReadNote(apiClient).call(args.note_id);
    return {
      content: [{ type: 'text', text: result }]
    };
  }
);

// Register the read_multinote tool
server.registerTool(
  'read_multinote',
  {
    description: 'Read the full content of multiple notes at once',
    inputSchema: { note_ids: z.array(z.string()) }
  },
  async (args) => {
    const result = await new ReadMultiNote(apiClient).call(args.note_ids);
    return {
      content: [{ type: 'text', text: result }]
    };
  }
);

// Create logs directory if it doesn't exist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '..', 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a log file for this session
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logsDir, `mcp-server-${timestamp}.log`);

// Log server startup
logger.info('Starting MCP server (version 1.0.0)');
logger.info(`Log file: ${logFile}`);

// Create a custom transport wrapper to log commands and responses
class LoggingTransport extends StdioServerTransport {
  private commandCounter = 0;

  constructor() {
    super();
  }

  // Set up message handling with logging
  start(): Promise<void> {
    // Set up message handler to log incoming messages
    this.onmessage = (message) => {
      // Log incoming message (command)
      this.commandCounter++;
      const logEntry = {
        timestamp: new Date().toISOString(),
        direction: 'COMMAND',
        commandNumber: this.commandCounter,
        message
      };

      // Log to console
      const method = typeof message === 'object' && message !== null && 'method' in message 
        ? message.method 
        : 'unknown method';
      
      logger.info(`Received command #${this.commandCounter}: ${method}`);
      logger.debug(`Command details: ${JSON.stringify(message)}`);

      // Log to file
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    };

    return super.start();
  }
}

// Start the server with logging transport
const transport = new LoggingTransport();

// Log connection status
logger.info('Connecting to transport...');

try {
  await server.connect(transport);
  logger.info('MCP server started and ready to receive commands');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Failed to start MCP server: ${errorMessage}\n`);
  process.exit(1);
}
