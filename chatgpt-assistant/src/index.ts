#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';
import { config } from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

// Load environment variables
config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatGPTRequest {
  prompt: string;
  context?: string;
  system_message?: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

interface CodeAnalysisRequest {
  code: string;
  language: string;
  analysis_type: 'review' | 'debug' | 'optimize' | 'explain' | 'test';
  context?: string;
}

interface GameDevRequest {
  feature: string;
  current_code?: string;
  framework: 'threejs' | 'typescript' | 'vite' | 'cannon-js';
  request_type: 'implement' | 'fix' | 'improve' | 'design';
  context?: string;
}

interface ImageGenerationRequest {
  prompt: string;
  model?: 'dall-e-2' | 'dall-e-3';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
}

class ChatGPTMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: process.env.MCP_SERVER_NAME || 'ChatGPT Development Assistant',
        version: process.env.MCP_SERVER_VERSION || '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'ask_chatgpt',
            description: 'Ask ChatGPT for general development assistance',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'The question or prompt to send to ChatGPT'
                },
                context: {
                  type: 'string',
                  description: 'Additional context about your project or situation'
                },
                system_message: {
                  type: 'string',
                  description: 'Custom system message to set ChatGPT behavior'
                },
                model: {
                  type: 'string',
                  description: 'OpenAI model to use (default: gpt-4o-mini)',
                  enum: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o3-mini', 'o3', 'o3-pro']
                },
                max_tokens: {
                  type: 'number',
                  description: 'Maximum tokens in response (default: 2000)'
                },
                temperature: {
                  type: 'number',
                  description: 'Response creativity (0.0-2.0, default: 0.7)'
                }
              },
              required: ['prompt']
            }
          } as Tool,
          {
            name: 'analyze_code',
            description: 'Get ChatGPT analysis of code (review, debug, optimize, explain, or test)',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'The code to analyze'
                },
                language: {
                  type: 'string',
                  description: 'Programming language (e.g., typescript, javascript, python)'
                },
                analysis_type: {
                  type: 'string',
                  description: 'Type of analysis to perform',
                  enum: ['review', 'debug', 'optimize', 'explain', 'test']
                },
                context: {
                  type: 'string',
                  description: 'Additional context about the code purpose or issues'
                }
              },
              required: ['code', 'language', 'analysis_type']
            }
          } as Tool,
          {
            name: 'game_dev_assistance',
            description: 'Specialized ChatGPT assistance for game development with Three.js',
            inputSchema: {
              type: 'object',
              properties: {
                feature: {
                  type: 'string',
                  description: 'The game feature or system you need help with'
                },
                current_code: {
                  type: 'string',
                  description: 'Current code implementation (if any)'
                },
                framework: {
                  type: 'string',
                  description: 'Primary framework/library being used',
                  enum: ['threejs', 'typescript', 'vite', 'cannon-js']
                },
                request_type: {
                  type: 'string',
                  description: 'Type of assistance needed',
                  enum: ['implement', 'fix', 'improve', 'design']
                },
                context: {
                  type: 'string',
                  description: 'Project context and specific requirements'
                }
              },
              required: ['feature', 'framework', 'request_type']
            }
          } as Tool,
          {
            name: 'generate_image',
            description: 'Generate an image using DALL-E based on a text prompt',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'A detailed description of the image to generate'
                },
                model: {
                  type: 'string',
                  description: 'The DALL-E model to use (default: dall-e-3)',
                  enum: ['dall-e-2', 'dall-e-3']
                },
                size: {
                  type: 'string',
                  description: 'The size of the image to generate',
                  enum: ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792']
                },
                quality: {
                  type: 'string',
                  description: 'The quality of the image (standard or hd, only for dall-e-3)',
                  enum: ['standard', 'hd']
                },
                style: {
                  type: 'string',
                  description: 'The style of the image (vivid or natural, only for dall-e-3)',
                  enum: ['vivid', 'natural']
                },
                n: {
                  type: 'number',
                  description: 'Number of images to generate (1-10 for dall-e-2, only 1 for dall-e-3)'
                }
              },
              required: ['prompt']
            }
          } as Tool,
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'ask_chatgpt':
            return await this.handleChatGPTRequest(args as unknown as ChatGPTRequest);

          case 'analyze_code':
            return await this.handleCodeAnalysis(args as unknown as CodeAnalysisRequest);

          case 'game_dev_assistance':
            return await this.handleGameDevRequest(args as unknown as GameDevRequest);

          case 'generate_image':
            return await this.handleImageGeneration(args as unknown as ImageGenerationRequest);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`
            }
          ]
        };
      }
    });
  }

  private async handleChatGPTRequest(request: ChatGPTRequest) {
    const {
      prompt,
      context = '',
      system_message = 'You are a helpful development assistant.',
      model = process.env.OPENAI_MODEL || 'gpt-4o-mini',
      max_tokens = parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
      temperature = 0.7
    } = request;

    const messages: any[] = [
      { role: 'system', content: system_message }
    ];

    if (context) {
      messages.push({ role: 'user', content: `Context: ${context}` });
    }

    messages.push({ role: 'user', content: prompt });

    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens,
      temperature
    });

    const response = completion.choices[0]?.message?.content || 'No response received';

    return {
      content: [
        {
          type: 'text',
          text: response
        }
      ]
    };
  }

  private async handleCodeAnalysis(request: CodeAnalysisRequest) {
    const { code, language, analysis_type, context = '' } = request;

    const analysisPrompts = {
      review: `Please review this ${language} code and provide feedback on:
- Code quality and best practices
- Potential bugs or issues
- Suggestions for improvement
- Security considerations`,
      
      debug: `Please help debug this ${language} code:
- Identify potential bugs or errors
- Explain what might be causing issues
- Suggest specific fixes`,
      
      optimize: `Please analyze this ${language} code for optimization:
- Performance improvements
- Memory usage optimization
- Algorithm efficiency
- Best practices for the specific language/framework`,
      
      explain: `Please explain this ${language} code:
- What does it do?
- How does it work?
- Key concepts and patterns used
- Flow of execution`,
      
      test: `Please suggest tests for this ${language} code:
- Unit test cases
- Edge cases to consider
- Testing strategies
- Mock data if needed`
    };

    const systemMessage = `You are an expert ${language} developer providing ${analysis_type} assistance.`;
    
    const prompt = `${analysisPrompts[analysis_type]}

${context ? `Context: ${context}\n` : ''}

Code to analyze:
\`\`\`${language}
${code}
\`\`\``;

    return await this.handleChatGPTRequest({
      prompt,
      system_message: systemMessage,
      temperature: 0.3 // Lower temperature for more focused technical responses
    });
  }

  private async handleGameDevRequest(request: GameDevRequest) {
    const { feature, current_code = '', framework, request_type, context = '' } = request;

    const frameworkContext = {
      'threejs': 'Three.js 3D graphics library with WebGL',
      'typescript': 'TypeScript with strict type checking',
      'vite': 'Vite build tool and development server',
      'cannon-js': 'Cannon.js physics engine for 3D physics simulation'
    };

    const requestTypePrompts = {
      implement: `Please help implement ${feature} using ${framework}. Provide:
- Complete code implementation
- Explanation of approach
- Integration steps
- Best practices`,
      
      fix: `Please help fix issues with ${feature} in ${framework}. Provide:
- Problem analysis
- Root cause identification
- Specific fixes
- Prevention strategies`,
      
      improve: `Please help improve ${feature} built with ${framework}. Provide:
- Enhancement suggestions
- Performance optimizations
- Code quality improvements
- Modern best practices`,
      
      design: `Please help design ${feature} for ${framework}. Provide:
- Architecture recommendations
- Design patterns to use
- Implementation strategy
- Considerations and trade-offs`
    };

    const systemMessage = `You are an expert game developer specializing in ${frameworkContext[framework]}. 
Focus on practical, working solutions for 3D racing games similar to Mario Kart.`;

    const prompt = `${requestTypePrompts[request_type]}

Framework: ${framework} (${frameworkContext[framework]})
${context ? `Project Context: ${context}\n` : ''}
${current_code ? `Current Implementation:\n\`\`\`typescript\n${current_code}\n\`\`\`\n` : ''}

Please provide detailed, actionable guidance.`;

    return await this.handleChatGPTRequest({
      prompt,
      system_message: systemMessage,
      temperature: 0.4 // Balanced creativity for practical solutions
    });
  }

  private async downloadImage(url: string, filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      protocol.get(url, (response) => {
        const stream = createWriteStream(filepath);
        response.pipe(stream);
        stream.on('finish', () => {
          stream.close();
          resolve();
        });
        stream.on('error', reject);
      }).on('error', reject);
    });
  }

  private async handleImageGeneration(request: ImageGenerationRequest) {
    const { 
      prompt, 
      model = 'dall-e-3', 
      size = '1024x1024', 
      quality = 'standard', 
      style = 'vivid', 
      n = 1 
    } = request;

    try {
      // Validate size based on model
      if (model === 'dall-e-3' && !['1024x1024', '1792x1024', '1024x1792'].includes(size)) {
        throw new Error('DALL-E 3 only supports sizes: 1024x1024, 1792x1024, 1024x1792');
      }
      if (model === 'dall-e-2' && !['256x256', '512x512', '1024x1024'].includes(size)) {
        throw new Error('DALL-E 2 only supports sizes: 256x256, 512x512, 1024x1024');
      }

      const response = await openai.images.generate({
        model,
        prompt,
        size: size as any,
        quality: model === 'dall-e-3' ? quality : undefined,
        style: model === 'dall-e-3' ? style : undefined,
        n: model === 'dall-e-3' ? 1 : n, // DALL-E 3 only supports n=1
      });

      const imageUrls = response.data?.map(img => img.url).filter(url => url !== undefined) || [];
      
      // Create directory for saved images
      const imagesDir = path.join(process.env.HOME || '', 'chatgpt-images');
      await fs.mkdir(imagesDir, { recursive: true });
      
      // Download and save images
      const savedPaths: string[] = [];
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        const filename = `${timestamp}_${model}_${i + 1}.png`;
        const filepath = path.join(imagesDir, filename);
        
        await this.downloadImage(url, filepath);
        savedPaths.push(filepath);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `🎨 Generated ${imageUrls.length} image(s) successfully!\n\n**Saved locally to:**\n${savedPaths.map((path, i) => `${i + 1}. ${path}`).join('\n')}\n\n**Image URLs:**\n${imageUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}\n\n**Prompt:** "${prompt}"\n**Model:** ${model}\n**Size:** ${size}\n${model === 'dall-e-3' ? `**Quality:** ${quality}\n**Style:** ${style}` : ''}`
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Image generation failed: ${errorMessage}`);
    }
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // MCP servers should not output to stderr unless there's an actual error
    // console.error('ChatGPT MCP Server running on stdio');
  }
}

// Start the server
const server = new ChatGPTMCPServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});