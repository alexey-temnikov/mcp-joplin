# Joplin MCP Server

A TypeScript implementation of an MCP (Model Context Protocol) server for Joplin note-taking application, enabling AI assistants to interact with your notes.

## Capabilities Overview

### 📁 **Navigation & Discovery**
```
"List all my notebooks"
→ Shows complete notebook hierarchy with IDs

"Search for notes about machine learning"
→ Returns matching notes with snippets and locations

"Show me all notes in my Work notebook"
→ Displays all notes within a specific notebook
```

### 📖 **Reading Content**
```
"Read my note about project planning"
→ Shows full content with metadata

"Read these three notes about the same topic"
→ Batch reads multiple notes simultaneously
```

### ✏️ **Creating & Editing**
```
"Create a meeting note in my Work notebook"
→ Creates new note with specified content and location

"Update my todo list to mark task as complete"
→ Modifies existing note content or moves between notebooks

"Import this markdown file as a new note"
→ Converts external markdown files into Joplin notes
```

### 🗑️ **Management**
```
"Delete that old draft note"
→ Removes notes (safely to trash by default)
```

## Quick Navigation

- **Getting Started** → [Tutorial](#tutorial-getting-started)
- **Solve Problems** → [How-to Guides](#how-to-guides)
- **Look Up Details** → [Reference](#reference)
- **Learn More** → [Explanation](#explanation)

---

## Tutorial: Getting Started

*Learning-oriented: Your first steps with the Joplin MCP Server*

### Prerequisites

- Joplin desktop application installed and running
- Node.js and npm installed
- Joplin Web Clipper enabled

### Step 1: Enable Joplin API

1. Open Joplin desktop application
2. Go to **Tools > Options > Web Clipper**
3. Copy your authorization token (you'll need this later)
4. Note the port number (default: 41184)

### Step 2: Install and Setup

```bash
# Clone or download the project
git clone [repository-url]
cd joplin-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Make it globally available
npm link
```

### Step 3: Configure Your Environment

Create a `.env` file in the project root:

```env
JOPLIN_PORT=41184
JOPLIN_TOKEN=your_joplin_token_here
LOG_LEVEL=info
```

### Step 4: Test Your Setup

Start the server to verify everything works:

```bash
npm start
```

You should see output indicating the server has started successfully.

### Step 5: Use with an AI Assistant

Configure your AI tool (like Claude or Cursor) to use the MCP server:

```json
{
  "joplin": {
    "command": "npx",
    "args": ["joplin-mcp", "--env-file", "/path/to/your/.env"]
  }
}
```

### Your First Commands

Try these basic operations to get familiar:

1. **See your notebooks**: Ask your AI to list all notebooks
2. **Search for notes**: Search for a specific topic
3. **Read a note**: Open and read a specific note
4. **Create a note**: Make a new note in a notebook

**Congratulations!** You've successfully set up the Joplin MCP Server. Your AI assistant can now read, search, and manage your Joplin notes.

---

## How-to Guides

*Problem-oriented: Step-by-step solutions for common tasks*

### How to Install Using npx (Recommended)

```bash
# Direct installation and usage
npx joplin-mcp --port 41184 --token your_joplin_token

# Using environment file
npx joplin-mcp --env-file /path/to/your/.env
```

### How to Configure Different AI Tools

#### Augment Code
```
name: joplin
command: npx joplin-mcp --port 41184 --token your_token
```

#### Cursor (mcp.json)
```json
{
  "joplin": {
    "command": "npx",
    "args": ["joplin-mcp", "--env-file", "/path/to/your/.env"]
  }
}
```

### How to Search and Read Multiple Notes

1. **Search for notes**: Use search to find notes by keyword
2. **Get note IDs**: Copy the note IDs from search results
3. **Read multiple**: Use `read_multinote` with an array of IDs

```
# Example workflow with AI assistant:
"Search for notes about 'project planning'"
"Read all notes with IDs: ['abc123', 'def456', 'ghi789']"
```

### How to Organize Notes into Notebooks

1. **List existing notebooks**: See your current structure
2. **Create note**: Specify target notebook with `parent_id`
3. **Move note**: Update existing note with new `parent_id`

### How to Import Markdown Files

1. **Prepare your markdown file**: Ensure it's properly formatted
2. **Choose target notebook**: Get the notebook ID where you want to import
3. **Import**: Use the `import_markdown` command with file path and notebook ID

### How to Set Up Development Environment

```bash
# Development mode with auto-reload
npm run dev

# Run specific tests
npm test
npm run test:search
npm run test:read-note

# Build for production
npm run build
```

### How to Troubleshoot Common Issues

**Connection Failed**: Check Joplin is running and Web Clipper is enabled
**Invalid Token**: Verify your token in Joplin's Web Clipper settings
**Note Not Found**: Use notebook ID (long string) not notebook name
**Permission Denied**: Ensure Joplin API is accessible on the specified port

---

## Reference

*Information-oriented: Technical specifications and API details*

### Available Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `list_notebooks` | None | Get complete notebook hierarchy |
| `search_notes` | `query` (string) | Find notes by keyword/phrase |
| `read_notebook` | `notebook_id` (string) | View all notes in specific notebook |
| `read_note` | `note_id` (string) | Read full content of single note |
| `read_multinote` | `note_ids` (array) | Read multiple notes simultaneously |
| `create_note` | `title` (required), `body`, `parent_id`, `is_todo` | Create new note |
| `update_note` | `note_id` (required), `title`, `body`, `parent_id`, `is_todo` | Modify existing note |
| `delete_note` | `note_id` (required), `permanent` (boolean) | Remove note |
| `import_markdown` | `file_path` (required), `parent_id` | Import markdown file as note |

### Command Line Options

```
--env-file <file>    Load environment variables from file
--port <port>        Joplin port (default: 41184)
--token <token>      Joplin API token
--help, -h           Show help message
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JOPLIN_PORT` | 41184 | Port where Joplin API is running |
| `JOPLIN_TOKEN` | None | Joplin API authorization token |
| `LOG_LEVEL` | info | Logging verbosity (debug, info, warn, error) |

### Response Formats

#### Search Results
```
Found X notes matching query: "search term"

- Note: "Title" (note_id: "abc123")
  Notebook: "Notebook Name" (notebook_id: "def456")
  Updated: MM/DD/YYYY, HH:MM:SS AM/PM
  Snippet: Preview of note content...
```

#### Note Content
```
# Note: "Title"
Note ID: abc123
Notebook: "Notebook Name" (notebook_id: "def456")
Created: MM/DD/YYYY, HH:MM:SS AM/PM
Updated: MM/DD/YYYY, HH:MM:SS AM/PM

---
[Full note content in markdown]
---
```

### Error Codes

- **404**: Note or notebook not found
- **403**: Invalid or missing authorization token
- **500**: Joplin connection failed
- **400**: Invalid parameters provided

### Log Files

Logs are stored in the `logs` directory with timestamps:
- Console output: Basic operational information
- File logs: Detailed command and response data

---
### Architecture Overview

The system consists of three main components:

1. **Joplin Desktop App**: Your note storage and management application
2. **MCP Server**: This TypeScript application that translates between AI requests and Joplin's API
3. **AI Assistant**: The tool that makes requests to read, search, and modify your notes

```
AI Assistant ←→ MCP Server ←→ Joplin API ←→ Your Notes
```

## License

MIT