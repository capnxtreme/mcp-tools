export const tools = [
  {
    name: 'browser_launch',
    description: 'Launch a new browser instance',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier for the browser instance',
          default: 'default',
        },
        browserType: {
          type: 'string',
          enum: ['chromium', 'firefox', 'webkit'],
          description: 'Type of browser to launch',
          default: 'chromium',
        },
        headless: {
          type: 'boolean',
          description: 'Run browser in headless mode',
          default: true,
        },
      },
    },
  },
  {
    name: 'browser_navigate',
    description: 'Navigate browser to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Browser instance identifier',
          default: 'default',
        },
        url: {
          type: 'string',
          description: 'URL to navigate to',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'browser_screenshot',
    description: 'Take a screenshot of the current page',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Browser instance identifier',
          default: 'default',
        },
        fullPage: {
          type: 'boolean',
          description: 'Capture full page screenshot',
          default: true,
        },
      },
    },
  },
  {
    name: 'browser_console_logs',
    description: 'Get all console logs from the browser',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Browser instance identifier',
          default: 'default',
        },
        clear: {
          type: 'boolean',
          description: 'Clear logs after retrieving',
          default: false,
        },
      },
    },
  },
  {
    name: 'browser_execute',
    description: 'Execute JavaScript in the browser context',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Browser instance identifier',
          default: 'default',
        },
        script: {
          type: 'string',
          description: 'JavaScript code to execute',
        },
      },
      required: ['script'],
    },
  },
  {
    name: 'browser_wait_for',
    description: 'Wait for an element to appear on the page',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Browser instance identifier',
          default: 'default',
        },
        selector: {
          type: 'string',
          description: 'CSS selector to wait for',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds',
          default: 30000,
        },
      },
      required: ['selector'],
    },
  },
  {
    name: 'browser_close',
    description: 'Close a browser instance',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Browser instance identifier',
          default: 'default',
        },
      },
    },
  },
  {
    name: 'browser_list',
    description: 'List all active browser instances',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export const toolHandlers = {
  browser_launch: async (browserManager, args) => {
    return await browserManager.launchBrowser(args);
  },

  browser_navigate: async (browserManager, args) => {
    const { id = 'default', url } = args;
    return await browserManager.navigate(id, url);
  },

  browser_screenshot: async (browserManager, args) => {
    const { id = 'default', ...options } = args;
    return await browserManager.screenshot(id, options);
  },

  browser_console_logs: async (browserManager, args) => {
    const { id = 'default', clear = false } = args;
    const logs = await browserManager.getConsoleLogs(id);
    
    if (clear) {
      await browserManager.clearConsoleLogs(id);
    }
    
    return {
      logs,
      count: logs.length,
    };
  },

  browser_execute: async (browserManager, args) => {
    const { id = 'default', script } = args;
    return await browserManager.executeScript(id, script);
  },

  browser_wait_for: async (browserManager, args) => {
    const { id = 'default', selector, timeout } = args;
    return await browserManager.waitForSelector(id, selector, { timeout });
  },

  browser_close: async (browserManager, args) => {
    const { id = 'default' } = args;
    return await browserManager.closeBrowser(id);
  },

  browser_list: async (browserManager) => {
    return {
      browsers: browserManager.listBrowsers(),
    };
  },
};