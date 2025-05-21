import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

interface CommandLineArgs {
  envFile?: string;
  port?: string;
  token?: string;
  help?: boolean;
}

function showHelp(): void {
  console.log(`
Joplin MCP Server

OPTIONS:
  --env-file <file>    Load environment variables from file
  --port <port>        Joplin port (default: 41184)
  --token <token>      Joplin API token
  --help, -h           Show help message
  `);
  process.exit(0);
}

function parseArgs(): void {
  const args = process.argv.slice(2);
  const parsedArgs: CommandLineArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      parsedArgs.help = true;
    } else if (arg === '--env-file' && i + 1 < args.length) {
      parsedArgs.envFile = args[++i];
    } else if (arg === '--port' && i + 1 < args.length) {
      parsedArgs.port = args[++i];
    } else if (arg === '--token' && i + 1 < args.length) {
      parsedArgs.token = args[++i];
    }
  }

  // Show help if requested
  if (parsedArgs.help) {
    showHelp();
  }

  // Load environment variables from a file if specified
  if (parsedArgs.envFile) {
    const envPath = path.resolve(process.cwd(), parsedArgs.envFile);
    
    if (!fs.existsSync(envPath)) {
      process.stderr.write(`Error: Environment file not found: ${envPath}\n`);
      process.exit(1);
    }
    
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }

  // Override environment variables with command line arguments
  if (parsedArgs.port) {
    process.env.JOPLIN_PORT = parsedArgs.port;
  }
  
  if (parsedArgs.token) {
    process.env.JOPLIN_TOKEN = parsedArgs.token;
  }
}

export default parseArgs;
