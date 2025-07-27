# ChatGPT MCP Server

An MCP (Model Context Protocol) server that provides ChatGPT assistance for game development, specifically designed for the Business Cat Racing project.

## Features

### 🤖 Three Specialized Tools:

1. **`ask_chatgpt`** - General development assistance
   - Ask any programming question
   - Get explanations and guidance
   - Customizable system messages and parameters

2. **`analyze_code`** - Code analysis and review
   - Code review and best practices
   - Debug assistance and error identification
   - Performance optimization suggestions
   - Code explanation and documentation
   - Test case generation

3. **`game_dev_assistance`** - Specialized game development help
   - Three.js 3D graphics assistance
   - Physics simulation with Cannon.js
   - TypeScript game development
   - Racing game mechanics and features

## Setup

### 1. Install Dependencies
```bash
cd mcp-chatgpt-server
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

Required environment variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` - Model to use (default: gpt-4o-mini)
- `OPENAI_MAX_TOKENS` - Max response length (default: 2000)

### 3. Build and Run
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Claude Integration

To use this MCP server with Claude Code, add it to your MCP configuration:

### Option 1: Local Development Server
```json
{
  "mcpServers": {
    "chatgpt": {
      "command": "node",
      "args": ["/Users/matt/Code/BusinessCatRacing/mcp-chatgpt-server/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Option 2: Development Mode
```json
{
  "mcpServers": {
    "chatgpt": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/Users/matt/Code/BusinessCatRacing/mcp-chatgpt-server",
      "env": {
        "OPENAI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Usage Examples

### General Programming Help
```javascript
// Ask ChatGPT for general development assistance
await askChatGPT({
  prompt: "How do I implement collision detection in a 3D racing game?",
  context: "Using Three.js and Cannon.js for a Mario Kart-style game",
  system_message: "You are an expert game developer"
});
```

### Code Analysis
```javascript
// Get code review and suggestions
await analyzeCode({
  code: `
    function updateKartPhysics(deltaTime) {
      const velocity = this.physicsBody.velocity;
      const force = new CANNON.Vec3(0, 0, -1000);
      this.physicsBody.applyForce(force);
    }
  `,
  language: "typescript",
  analysis_type: "review",
  context: "Mario Kart-style racing game physics"
});
```

### Game Development Assistance
```javascript
// Get specialized game development help
await gameDevAssistance({
  feature: "Mario Kart-style drift mechanics with spark effects",
  framework: "threejs",
  request_type: "implement",
  context: "Need arcade-style physics that feels responsive like SNES Mario Kart",
  current_code: "// existing kart physics code here"
});
```

## Tool Specifications

### `ask_chatgpt`
- **prompt** (required): Question or request for ChatGPT
- **context** (optional): Additional project context
- **system_message** (optional): Custom system prompt
- **model** (optional): OpenAI model to use
- **max_tokens** (optional): Response length limit
- **temperature** (optional): Response creativity (0.0-2.0)

### `analyze_code`
- **code** (required): Code to analyze
- **language** (required): Programming language
- **analysis_type** (required): review, debug, optimize, explain, or test
- **context** (optional): Additional context about the code

### `game_dev_assistance`
- **feature** (required): Game feature or system description
- **framework** (required): threejs, typescript, vite, or cannon-js
- **request_type** (required): implement, fix, improve, or design
- **current_code** (optional): Existing code implementation
- **context** (optional): Project requirements and context

## Benefits for Business Cat Racing

This MCP server provides specialized assistance for:

- 🏎️ **Racing Game Mechanics** - Mario Kart-style physics and controls
- 🎮 **Three.js Graphics** - 3D rendering and visual effects
- ⚡ **Physics Simulation** - Cannon.js collision detection and dynamics
- 🔧 **TypeScript Development** - Type-safe game development
- 🚀 **Performance Optimization** - Game loop and rendering optimization
- 🎨 **Visual Effects** - Particle systems and shader programming

The server understands the specific context of building a Mario Kart-style racing game and can provide targeted, actionable advice for implementing features like drift mechanics, lap systems, power-ups, and track design.