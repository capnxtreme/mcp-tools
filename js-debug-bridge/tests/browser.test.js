import { BrowserManager } from '../src/browser.js';

describe('BrowserManager', () => {
  let browserManager;

  beforeEach(() => {
    browserManager = new BrowserManager();
  });

  afterEach(async () => {
    await browserManager.cleanup();
  });

  describe('launchBrowser', () => {
    it('should launch a browser with default options', async () => {
      const result = await browserManager.launchBrowser();
      
      expect(result).toMatchObject({
        id: 'default',
        browserType: 'chromium',
        status: 'launched',
      });
      
      expect(browserManager.browsers.has('default')).toBe(true);
    }, 30000);

    it('should launch multiple browsers with different ids', async () => {
      const result1 = await browserManager.launchBrowser({ id: 'browser1' });
      const result2 = await browserManager.launchBrowser({ id: 'browser2' });
      
      expect(result1.id).toBe('browser1');
      expect(result2.id).toBe('browser2');
      expect(browserManager.browsers.size).toBe(2);
    }, 30000);

    it('should throw error for duplicate browser id', async () => {
      await browserManager.launchBrowser({ id: 'test' });
      
      await expect(
        browserManager.launchBrowser({ id: 'test' })
      ).rejects.toThrow('Browser with id "test" already exists');
    }, 30000);

    it('should throw error for invalid browser type', async () => {
      await expect(
        browserManager.launchBrowser({ browserType: 'invalid' })
      ).rejects.toThrow('Invalid browser type: invalid');
    });
  });

  describe('navigate', () => {
    beforeEach(async () => {
      await browserManager.launchBrowser();
    });

    it('should navigate to a URL', async () => {
      const result = await browserManager.navigate('default', 'https://example.com');
      
      expect(result).toMatchObject({
        url: 'https://example.com/',
        status: 200,
      });
    }, 30000);

    it('should throw error for non-existent browser', async () => {
      await expect(
        browserManager.navigate('nonexistent', 'https://example.com')
      ).rejects.toThrow('No browser found with id "nonexistent"');
    });
  });

  describe('console logging', () => {
    beforeEach(async () => {
      await browserManager.launchBrowser();
    });

    it('should capture console logs', async () => {
      await browserManager.executeScript('default', 'console.log("test message")');
      const logs = await browserManager.getConsoleLogs('default');
      
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]).toMatchObject({
        type: 'log',
        text: 'test message',
      });
    }, 30000);

    it('should clear console logs', async () => {
      await browserManager.executeScript('default', 'console.log("test")');
      await browserManager.clearConsoleLogs('default');
      const logs = await browserManager.getConsoleLogs('default');
      
      expect(logs).toEqual([]);
    }, 30000);
  });

  describe('executeScript', () => {
    beforeEach(async () => {
      await browserManager.launchBrowser();
      await browserManager.navigate('default', 'https://example.com');
    });

    it('should execute script and return result', async () => {
      const result = await browserManager.executeScript('default', '2 + 2');
      
      expect(result).toEqual({
        success: true,
        result: 4,
      });
    }, 30000);

    it('should handle script errors', async () => {
      const result = await browserManager.executeScript('default', 'throw new Error("test error")');
      
      expect(result).toMatchObject({
        success: false,
        error: expect.stringContaining('test error'),
      });
    }, 30000);
  });

  describe('closeBrowser', () => {
    it('should close browser and clean up resources', async () => {
      await browserManager.launchBrowser({ id: 'test' });
      const result = await browserManager.closeBrowser('test');
      
      expect(result).toEqual({
        id: 'test',
        status: 'closed',
      });
      
      expect(browserManager.browsers.has('test')).toBe(false);
      expect(browserManager.pages.has('test')).toBe(false);
      expect(browserManager.contexts.has('test')).toBe(false);
      expect(browserManager.consoleLogs.has('test')).toBe(false);
    }, 30000);
  });

  describe('listBrowsers', () => {
    it('should list all active browsers', async () => {
      await browserManager.launchBrowser({ id: 'browser1' });
      await browserManager.launchBrowser({ id: 'browser2' });
      await browserManager.navigate('browser1', 'https://example.com');
      
      const browsers = browserManager.listBrowsers();
      
      expect(browsers).toHaveLength(2);
      expect(browsers).toContainEqual({
        id: 'browser1',
        url: 'https://example.com/',
      });
      expect(browsers).toContainEqual({
        id: 'browser2',
        url: null,
      });
    }, 30000);
  });
});