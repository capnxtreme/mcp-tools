import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

describe('MCP Server Integration', () => {
  let client;
  let transport;
  let serverProcess;

  beforeAll(async () => {
    serverProcess = spawn('node', ['src/index.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    transport = new StdioClientTransport({
      command: 'node',
      args: ['src/index.js'],
    });

    client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
  }, 10000);

  afterAll(async () => {
    await client.close();
    serverProcess.kill();
  });

  describe('Tool Registration', () => {
    it('should list all available tools', async () => {
      const response = await client.listTools();
      
      expect(response.tools).toHaveLength(8);
      
      const toolNames = response.tools.map(tool => tool.name);
      expect(toolNames).toContain('browser_launch');
      expect(toolNames).toContain('browser_navigate');
      expect(toolNames).toContain('browser_screenshot');
      expect(toolNames).toContain('browser_console_logs');
      expect(toolNames).toContain('browser_execute');
      expect(toolNames).toContain('browser_wait_for');
      expect(toolNames).toContain('browser_close');
      expect(toolNames).toContain('browser_list');
    });
  });

  describe('Browser Workflow', () => {
    it('should complete a full browser automation workflow', async () => {
      const launchResult = await client.callTool('browser_launch', {
        id: 'test-browser',
        headless: true,
      });
      
      expect(JSON.parse(launchResult.content[0].text)).toMatchObject({
        id: 'test-browser',
        browserType: 'chromium',
        status: 'launched',
      });

      const navigateResult = await client.callTool('browser_navigate', {
        id: 'test-browser',
        url: 'https://example.com',
      });
      
      expect(JSON.parse(navigateResult.content[0].text)).toMatchObject({
        url: 'https://example.com/',
        status: 200,
      });

      const executeResult = await client.callTool('browser_execute', {
        id: 'test-browser',
        script: 'document.title',
      });
      
      expect(JSON.parse(executeResult.content[0].text)).toMatchObject({
        success: true,
        result: 'Example Domain',
      });

      const logsResult = await client.callTool('browser_console_logs', {
        id: 'test-browser',
      });
      
      const logsData = JSON.parse(logsResult.content[0].text);
      expect(logsData).toHaveProperty('logs');
      expect(logsData).toHaveProperty('count');

      const closeResult = await client.callTool('browser_close', {
        id: 'test-browser',
      });
      
      expect(JSON.parse(closeResult.content[0].text)).toMatchObject({
        id: 'test-browser',
        status: 'closed',
      });
    }, 60000);

    it('should handle errors gracefully', async () => {
      const result = await client.callTool('browser_navigate', {
        id: 'nonexistent',
        url: 'https://example.com',
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('No browser found with id');
    });
  });

  describe('Multiple Browser Instances', () => {
    it('should manage multiple browser instances', async () => {
      await client.callTool('browser_launch', { id: 'browser1' });
      await client.callTool('browser_launch', { id: 'browser2' });

      const listResult = await client.callTool('browser_list', {});
      const browsers = JSON.parse(listResult.content[0].text).browsers;
      
      expect(browsers).toHaveLength(2);
      expect(browsers.map(b => b.id)).toContain('browser1');
      expect(browsers.map(b => b.id)).toContain('browser2');

      await client.callTool('browser_close', { id: 'browser1' });
      await client.callTool('browser_close', { id: 'browser2' });
    }, 60000);
  });
});