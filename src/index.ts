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

/**
 * JoplinMcpServer exposes Joplin functionality as an MCP server
 */
class JoplinMcpServer {
  private server: McpServer;
  private apiClient: JoplinAPIClient;
  private logFile: string;

  constructor() {
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
    this.apiClient = new JoplinAPIClient({
      port: parseInt(process.env.JOPLIN_PORT, 10),
      token: process.env.JOPLIN_TOKEN
    });

    // Create the MCP server
    this.server = new McpServer({
      name: 'joplin-mcp-server',
      version: '1.0.0'
    });

    // Create logs directory if it doesn't exist
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const logsDir = path.join(__dirname, '..', 'logs');

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create a log file for this session
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(logsDir, `mcp-server-${timestamp}.log`);

    this.registerTools();
  }

  private registerTools() {
    // Register the list_notebooks tool
    this.server.registerTool(
      'list_notebooks',
      {
        description: 'Retrieve the complete notebook hierarchy from Joplin'
      },
      async () => {
        const result = await new ListNotebooks(this.apiClient).call();
        return {
          content: [{ type: 'text', text: result }]
        };
      }
    );

    // Register the search_notes tool
    this.server.registerTool(
      'search_notes',
      {
        description: 'Search for notes in Joplin and return matching notebooks',
        inputSchema: { query: z.string() }
      },
      async (args) => {
        const result = await new SearchNotes(this.apiClient).call(args.query);
        return {
          content: [{ type: 'text', text: result }]
        };
      }
    );

    // Register the read_notebook tool
    this.server.registerTool(
      'read_notebook',
      {
        description: 'Read the contents of a specific notebook',
        inputSchema: { notebook_id: z.string() }
      },
      async (args) => {
        const result = await new ReadNotebook(this.apiClient).call(args.notebook_id);
        return {
          content: [{ type: 'text', text: result }]
        };
      }
    );

    // Register the read_note tool
    this.server.registerTool(
      'read_note',
      {
        description: 'Read the full content of a specific note',
        inputSchema: { note_id: z.string() }
      },
      async (args) => {
        const result = await new ReadNote(this.apiClient).call(args.note_id);
        return {
          content: [{ type: 'text', text: result }]
        };
      }
    );

    // Register the read_multinote tool
    this.server.registerTool(
      'read_multinote',
      {
        description: 'Read the full content of multiple notes at once',
        inputSchema: { note_ids: z.array(z.string()) }
      },
      async (args) => {
        const result = await new ReadMultiNote(this.apiClient).call(args.note_ids);
        return {
          content: [{ type: 'text', text: result }]
        };
      }
    );
  }

  async run() {
    // Log server startup
    logger.info('Starting MCP server (version 1.0.0)');
    logger.info(`Log file: ${this.logFile}`);

    // Create a custom transport wrapper to log commands and responses
    class LoggingTransport extends StdioServerTransport {
      private commandCounter = 0;
      private logFile: string;

      constructor(logFile: string) {
        super();
        this.logFile = logFile;
      }

      // Set up message handling with logging
      start(): Promise<void> {
        // Store the original onmessage handler that will be set by super.start()
        const originalOnMessage = this.onmessage;
        
        // Call super.start() first to set up the transport
        const result = super.start();
        
        // Now wrap the onmessage handler that was set by super.start()
        const superOnMessage = this.onmessage;
        
        // Replace with our wrapper that logs and then calls the original handler
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
          fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
          
          // Call the original handler set by super.start()
          if (superOnMessage) {
            superOnMessage(message);
          }
        };
        
        return result;
      }
    }

    // Start the server with logging transport
    const transport = new LoggingTransport(this.logFile);

    // Log connection status
    logger.info('Connecting to transport...');

    try {
      await this.server.connect(transport);
      logger.info('MCP server started and ready to receive commands');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Failed to start MCP server: ${errorMessage}\n`);
      process.exit(1);
    }
  }
}

// Export the server class
export const joplinMcpServer = new JoplinMcpServer();

// Only run if called directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  joplinMcpServer.run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
