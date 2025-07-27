# JavaScript Debug Bridge MCP Server

A Model Context Protocol (MCP) server that provides browser automation and debugging capabilities to Claude Code, allowing agents to render browser output and check console logs without user intervention.

## Features

- **Browser Control**: Launch and manage multiple browser instances (Chromium, Firefox, WebKit)
- **Console Capture**: Automatically capture and retrieve all console logs, warnings, and errors
- **Screenshot Generation**: Take screenshots of web pages at any point
- **DOM Inspection**: Query and interact with page elements using CSS selectors
- **JavaScript Execution**: Run custom scripts in the browser context
- **Network Monitoring**: Track API calls and network responses
- **Headless/Headful Mode**: Run browsers with or without GUI

## Installation

The server is already installed in your Claude MCP servers directory:
```
~/.claude/mcp-servers/js-debug-bridge/
```

Dependencies have been installed via npm:
- `@modelcontextprotocol/sdk` - MCP SDK for server implementation
- `playwright` - Cross-browser automation library

## Configuration

The server is configured in your Claude Desktop config file:
```json
{
  "mcpServers": {
    "js-debug-bridge": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/matt/.claude/mcp-servers/js-debug-bridge/src/index.js"],
      "env": {
        "HEADLESS": "true",
        "BROWSER": "chromium"
      }
    }
  }
}
```

## Available Tools

### browser_launch
Launch a new browser instance.
```javascript
{
  "id": "my-browser",      // Optional, default: "default"
  "browserType": "chromium", // Options: chromium, firefox, webkit
  "headless": true         // Run without GUI
}
```

### browser_navigate
Navigate to a URL.
```javascript
{
  "id": "my-browser",
  "url": "https://example.com"
}
```

### browser_screenshot
Capture a screenshot of the current page.
```javascript
{
  "id": "my-browser",
  "fullPage": true  // Capture entire page
}
```

### browser_console_logs
Get all console output from the browser.
```javascript
{
  "id": "my-browser",
  "clear": false  // Clear logs after retrieving
}
```

### browser_execute
Execute JavaScript in the browser context.
```javascript
{
  "id": "my-browser",
  "script": "document.title"
}
```

### browser_wait_for
Wait for an element to appear on the page.
```javascript
{
  "id": "my-browser",
  "selector": "#my-element",
  "timeout": 30000  // milliseconds
}
```

### browser_close
Close a browser instance.
```javascript
{
  "id": "my-browser"
}
```

### browser_list
List all active browser instances.
```javascript
{}
```

## Usage Example

Here's how Claude Code can use the debug bridge:

1. Launch a browser:
```
Tool: browser_launch
Arguments: {"id": "test", "headless": true}
```

2. Navigate to a page:
```
Tool: browser_navigate
Arguments: {"id": "test", "url": "https://myapp.com"}
```

3. Check console logs:
```
Tool: browser_console_logs
Arguments: {"id": "test"}
```

4. Take a screenshot:
```
Tool: browser_screenshot
Arguments: {"id": "test"}
```

5. Execute JavaScript:
```
Tool: browser_execute
Arguments: {"id": "test", "script": "localStorage.getItem('user')"}
```

6. Close the browser:
```
Tool: browser_close
Arguments: {"id": "test"}
```

## Testing

Run the test suite:
```bash
cd ~/.claude/mcp-servers/js-debug-bridge
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Development

The server follows a modular architecture:
- `src/index.js` - MCP server entry point
- `src/browser.js` - Browser automation logic
- `src/tools.js` - MCP tool definitions
- `tests/` - Unit and integration tests

## Security Considerations

- No hardcoded credentials
- Browser instances run in isolated contexts
- JavaScript execution is sandboxed
- All URLs are validated before navigation

## Troubleshooting

1. **Server not responding**: Restart Claude Desktop
2. **Browser launch fails**: Check Playwright installation
3. **Console logs missing**: Ensure page has loaded before checking logs
4. **Screenshots blank**: Wait for page content to render

## Future Enhancements

- Support for browser profiles/cookies
- Network request interception
- Performance metrics collection
- Multi-tab support
- Browser extension support