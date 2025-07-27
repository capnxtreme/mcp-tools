import { chromium, firefox, webkit } from 'playwright';

export class BrowserManager {
  constructor() {
    this.browsers = new Map();
    this.contexts = new Map();
    this.pages = new Map();
    this.consoleLogs = new Map();
  }

  async launchBrowser(options = {}) {
    const {
      id = 'default',
      browserType = 'chromium',
      headless = true,
      ...launchOptions
    } = options;

    if (this.browsers.has(id)) {
      throw new Error(`Browser with id "${id}" already exists`);
    }

    const browserTypes = { chromium, firefox, webkit };
    const BrowserType = browserTypes[browserType];
    
    if (!BrowserType) {
      throw new Error(`Invalid browser type: ${browserType}`);
    }

    const browser = await BrowserType.launch({
      headless,
      ...launchOptions,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    this.browsers.set(id, browser);
    this.contexts.set(id, context);
    this.pages.set(id, page);
    this.consoleLogs.set(id, []);

    this.setupConsoleLogging(id, page);

    return {
      id,
      browserType,
      status: 'launched',
    };
  }

  setupConsoleLogging(id, page) {
    const logs = this.consoleLogs.get(id);

    page.on('console', (msg) => {
      logs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString(),
        args: msg.args().map(arg => String(arg)),
      });
    });

    page.on('pageerror', (error) => {
      logs.push({
        type: 'error',
        text: error.message,
        timestamp: new Date().toISOString(),
        stack: error.stack,
      });
    });
  }

  async navigate(id, url) {
    const page = this.pages.get(id);
    if (!page) {
      throw new Error(`No browser found with id "${id}"`);
    }

    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    return {
      url: page.url(),
      status: response.status(),
      statusText: response.statusText(),
    };
  }

  async screenshot(id, options = {}) {
    const page = this.pages.get(id);
    if (!page) {
      throw new Error(`No browser found with id "${id}"`);
    }

    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      ...options,
    });

    return {
      data: screenshotBuffer.toString('base64'),
      type: options.type || 'png',
    };
  }

  async getConsoleLogs(id) {
    const logs = this.consoleLogs.get(id);
    if (!logs) {
      throw new Error(`No browser found with id "${id}"`);
    }

    return logs;
  }

  async clearConsoleLogs(id) {
    if (!this.consoleLogs.has(id)) {
      throw new Error(`No browser found with id "${id}"`);
    }

    this.consoleLogs.set(id, []);
    return { cleared: true };
  }

  async executeScript(id, script) {
    const page = this.pages.get(id);
    if (!page) {
      throw new Error(`No browser found with id "${id}"`);
    }

    try {
      const result = await page.evaluate(script);
      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async waitForSelector(id, selector, options = {}) {
    const page = this.pages.get(id);
    if (!page) {
      throw new Error(`No browser found with id "${id}"`);
    }

    try {
      await page.waitForSelector(selector, {
        timeout: 30000,
        ...options,
      });
      return {
        found: true,
        selector,
      };
    } catch (error) {
      return {
        found: false,
        selector,
        error: error.message,
      };
    }
  }

  async closeBrowser(id) {
    const browser = this.browsers.get(id);
    if (!browser) {
      throw new Error(`No browser found with id "${id}"`);
    }

    await browser.close();
    
    this.browsers.delete(id);
    this.contexts.delete(id);
    this.pages.delete(id);
    this.consoleLogs.delete(id);

    return {
      id,
      status: 'closed',
    };
  }

  async cleanup() {
    for (const [id, browser] of this.browsers) {
      try {
        await browser.close();
      } catch (error) {
        console.error(`Error closing browser ${id}:`, error);
      }
    }

    this.browsers.clear();
    this.contexts.clear();
    this.pages.clear();
    this.consoleLogs.clear();
  }

  listBrowsers() {
    return Array.from(this.browsers.keys()).map(id => ({
      id,
      url: this.pages.get(id)?.url() || null,
    }));
  }
}