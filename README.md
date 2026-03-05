# definable.cli

AI-powered development CLI tool for software engineering tasks.

## Overview

definable is an interactive CLI tool that helps users with software engineering tasks including code generation, refactoring, debugging, and more. It provides a TUI interface and supports various AI models through multiple providers.

## Features

- **Interactive TUI**: Terminal user interface for AI-assisted development
- **Multi-model support**: Works with OpenAI, Anthropic, Google, Azure, and other AI providers
- **Code tools**: Built-in tools for file operations, git, web search, and more
- **Session management**: Save and continue development sessions
- **GitHub integration**: PR management and GitHub agent
- **Protocol support**: ACP (Agent Client Protocol) and MCP (Model Context Protocol)
- **Workspace serving**: Remote workspace event server

## Quick Start

### Installation

```bash
bun install
```

### Development

```bash
bun run dev
```

### Build

```bash
bun run build
```

## Usage

### Basic Commands

```bash
# Start the TUI interface
bun run dev

# Run definable with a message
bun run dev run "help me fix this bug"

# Start a headless server
bun run dev serve

# List available models
bun run dev models

# Manage GitHub integration
bun run dev github

# Checkout and work on a GitHub PR
bun run dev pr <number>
```

### Key Commands

- `definable [project]` - Start definable TUI (default command)
- `definable run [message..]` - Run definable with a message
- `definable serve` - Start headless server
- `definable web` - Start server with web interface
- `definable auth` - Manage credentials
- `definable agent` - Manage agents
- `definable models` - List available models
- `definable github` - GitHub integration
- `definable pr` - GitHub PR management
- `definable mcp` - MCP server management
- `definable acp` - ACP server
- `definable workspace-serve` - Remote workspace server

## Project Structure

```
├── src/                    # Source code
│   ├── cli/               # CLI command implementations
│   ├── agent/             # Agent system
│   ├── tool/              # Built-in tools (bash, edit, grep, etc.)
│   ├── provider/          # AI model providers
│   ├── server/            # Server implementation
│   └── util/              # Utilities
├── packages/              # Workspace packages
│   ├── plugin/           # Plugin system
│   ├── script/           # Build scripts
│   ├── sdk/              # SDK for external integration
│   └── util/             # Shared utilities
├── test/                  # Test suite
└── migration/            # Database migrations
```

## Development

### Prerequisites

- [Bun](https://bun.sh) (version 1.3.10 or later)
- Node.js (for some dependencies)

### Setup

1. Clone the repository
2. Install dependencies: `bun install`
3. Run development server: `bun run dev`

### Testing

```bash
bun test
```

### Type Checking

```bash
bun run typecheck
```

## Configuration

Configuration is stored in `definable.json` and supports:
- Model selection (`provider/model`)
- Authentication credentials
- Tool permissions
- Session settings

## License

MIT
