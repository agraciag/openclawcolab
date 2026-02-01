#!/usr/bin/env node
/**
 * OpenClawColab Daemon
 * Main entry point for the multi-LLM collaboration system
 */

import 'dotenv/config';
import { WebSocketServer } from './websocket.js';
import { TelegramBot } from './telegram.js';
import { Orchestrator } from './orchestrator.js';
import { TaskQueue } from './queue.js';
import { AgentSpawner } from './spawner.js';
import { Logger } from './logger.js';

class OpenClawColabDaemon {
  constructor() {
    this.logger = new Logger('Daemon');
    this.wss = null;
    this.telegram = null;
    this.queue = new TaskQueue();
    this.spawner = new AgentSpawner();
    this.orchestrator = null;
    this.running = false;
  }

  async start() {
    this.logger.info('Starting OpenClawColab Daemon...');

    try {
      // Start WebSocket server
      this.wss = new WebSocketServer(parseInt(process.env.WEBSOCKET_PORT) || 3333);
      await this.wss.start();
      this.logger.info(`WebSocket server on port ${process.env.WEBSOCKET_PORT || 3333}`);

      // Start Telegram bot (if configured)
      if (process.env.TELEGRAM_BOT_TOKEN) {
        this.telegram = new TelegramBot(
          process.env.TELEGRAM_BOT_TOKEN,
          process.env.TELEGRAM_CHAT_ID
        );
        await this.telegram.start();
        this.logger.info('Telegram bot connected');
      } else {
        this.logger.warn('Telegram not configured - running without notifications');
      }

      // Initialize orchestrator
      this.orchestrator = new Orchestrator(this);

      // Set up event handlers
      this.setupEventHandlers();

      // Start processing queue
      this.running = true;
      this.processQueue();

      this.logger.info('OpenClawColab Daemon started successfully');
      this.printBanner();

      // Notify on Telegram
      if (this.telegram) {
        await this.telegram.notify('🚀 OpenClawColab Daemon started');
      }

    } catch (error) {
      this.logger.error('Failed to start daemon:', error);
      process.exit(1);
    }
  }

  printBanner() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                     OPENCLAWCOLAB DAEMON                      ║
╠═══════════════════════════════════════════════════════════════╣
║  WebSocket: ws://localhost:${(process.env.WEBSOCKET_PORT || '3333').padEnd(4)}                            ║
║  Telegram:  ${this.telegram ? 'Connected' : 'Not configured'}                                   ║
║  Agents:    CLAUDE, QWEN, GEMINI, CHATGPT, GLM                ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  }

  setupEventHandlers() {
    // Handle messages from agents via WebSocket
    this.wss.on('agentMessage', async (msg) => {
      await this.handleAgentMessage(msg);
    });

    // Handle commands from Telegram
    if (this.telegram) {
      this.telegram.on('command', async (cmd) => {
        await this.handleTelegramCommand(cmd);
      });
    }

    // Graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  async handleAgentMessage(msg) {
    this.logger.debug(`Message from ${msg.agent}: ${msg.msgType}`);

    switch (msg.msgType) {
      case 'DELIVERY':
        await this.orchestrator.reviewDelivery(msg);
        break;

      case 'ISSUE':
      case 'BLOCKER':
        await this.orchestrator.handleIssue(msg);
        break;

      case 'QUESTION':
        await this.orchestrator.handleQuestion(msg);
        break;

      default:
        // Regular chat message - just log it
        this.logger.debug(`Chat: [${msg.agent}] ${msg.content.slice(0, 100)}...`);
    }
  }

  async handleTelegramCommand(cmd) {
    this.logger.info(`Telegram command: ${cmd.command}`);

    switch (cmd.command) {
      case '/status':
        await this.sendStatus();
        break;

      case '/tasks':
        await this.sendTaskList();
        break;

      case '/assign':
        if (cmd.args.length >= 2) {
          const [agent, ...taskParts] = cmd.args;
          const task = taskParts.join(' ');
          await this.assignTask(agent.toUpperCase(), task);
        } else {
          await this.telegram.notify('Usage: /assign <agent> <task>');
        }
        break;

      case '/pause':
        this.running = false;
        await this.telegram.notify('⏸️ Daemon paused');
        break;

      case '/resume':
        this.running = true;
        this.processQueue();
        await this.telegram.notify('▶️ Daemon resumed');
        break;

      case '/help':
        await this.sendHelp();
        break;

      default:
        await this.telegram.notify(`Unknown command: ${cmd.command}`);
    }
  }

  async sendStatus() {
    const status = `
📊 *OpenClawColab Status*

*Queue:* ${this.queue.size()} tasks pending
*Running:* ${this.running ? 'Yes' : 'Paused'}
*Agents Online:* ${this.wss.getConnectedAgents().join(', ') || 'None'}

*Last Activity:*
${this.orchestrator.getLastActivity()}
    `;
    await this.telegram.notify(status, { parse_mode: 'Markdown' });
  }

  async sendTaskList() {
    const tasks = this.queue.getAll();
    if (tasks.length === 0) {
      await this.telegram.notify('📋 No pending tasks');
      return;
    }

    const list = tasks.map((t, i) => `${i + 1}. [${t.agent}] ${t.task}`).join('\n');
    await this.telegram.notify(`📋 *Pending Tasks:*\n${list}`, { parse_mode: 'Markdown' });
  }

  async sendHelp() {
    const help = `
🤖 *OpenClawColab Commands*

/status - Show daemon status
/tasks - List pending tasks
/assign <agent> <task> - Assign task
/pause - Pause daemon
/resume - Resume daemon
/help - Show this help

*Agents:* CLAUDE, QWEN, GEMINI, CHATGPT, GLM
    `;
    await this.telegram.notify(help, { parse_mode: 'Markdown' });
  }

  async assignTask(agent, task) {
    this.queue.add({ agent, task, timestamp: new Date() });
    await this.telegram.notify(`📝 Task assigned to ${agent}:\n${task}`);
    this.logger.info(`Task assigned to ${agent}: ${task}`);
  }

  async processQueue() {
    while (this.running) {
      const task = this.queue.getNext();

      if (task) {
        this.logger.info(`Processing task for ${task.agent}: ${task.task}`);

        try {
          if (this.telegram) {
            await this.telegram.notify(`🔄 Starting: [${task.agent}] ${task.task.slice(0, 50)}...`);
          }

          await this.spawner.runAgent(task.agent, task.task);

        } catch (error) {
          this.logger.error(`Task failed for ${task.agent}:`, error);
          if (this.telegram) {
            await this.telegram.notify(`❌ Task failed for ${task.agent}: ${error.message}`);
          }
        }
      }

      // Wait before checking queue again
      await this.sleep(2000);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async shutdown() {
    this.logger.info('Shutting down...');
    this.running = false;

    if (this.telegram) {
      await this.telegram.notify('🛑 OpenClawColab Daemon stopping...');
      this.telegram.stop();
    }

    if (this.wss) {
      this.wss.stop();
    }

    this.logger.info('Daemon stopped');
    process.exit(0);
  }
}

// Start daemon
const daemon = new OpenClawColabDaemon();
daemon.start();
