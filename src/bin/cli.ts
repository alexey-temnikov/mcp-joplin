#!/usr/bin/env node

// This is the entry point for the CLI
import { joplinMcpServer } from '../index.js';

joplinMcpServer.run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
