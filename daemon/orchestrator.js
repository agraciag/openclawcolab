/**
 * Orchestrator - Claude reviews and coordinates other agents
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKLOG_PATH = join(__dirname, '..', 'tasks', 'BACKLOG.md');

export class Orchestrator {
  constructor(daemon) {
    this.daemon = daemon;
    this.lastActivity = [];
  }

  async reviewDelivery(msg) {
    console.log(`[Orchestrator] Reviewing delivery from ${msg.agent}`);

    // Log activity
    this.logActivity(`DELIVERY from ${msg.agent}: ${msg.content.slice(0, 100)}...`);

    // For now, auto-approve all deliveries
    // In future: run Claude to review code quality
    const approved = true;

    if (approved) {
      // Notify success
      if (this.daemon.telegram) {
        await this.daemon.telegram.notify(
          `✅ *${msg.agent}* completed task:\n${msg.content.slice(0, 200)}...`,
          { parse_mode: 'Markdown' }
        );
      }

      // Update backlog (mark task as completed)
      await this.updateBacklog(msg.agent, 'completed');

      // Check for next task
      const nextTask = this.getNextTaskForAgent(msg.agent);
      if (nextTask) {
        await this.daemon.assignTask(msg.agent, nextTask);
      }

    } else {
      // Request changes
      this.daemon.wss.sendTo(msg.agent, {
        type: 'message',
        msgType: 'REVIEW',
        content: 'Changes requested. Please review and fix.',
        agent: 'CLAUDE'
      });
    }
  }

  async handleIssue(msg) {
    console.log(`[Orchestrator] Issue from ${msg.agent}: ${msg.content}`);

    this.logActivity(`ISSUE from ${msg.agent}: ${msg.content.slice(0, 100)}...`);

    // Always notify human of issues
    if (this.daemon.telegram) {
      await this.daemon.telegram.notify(
        `⚠️ *ISSUE from ${msg.agent}*:\n\n${msg.content}`,
        { parse_mode: 'Markdown' }
      );
    }

    // Could try to auto-resolve some issues in future
  }

  async handleQuestion(msg) {
    console.log(`[Orchestrator] Question from ${msg.agent}: ${msg.content}`);

    this.logActivity(`QUESTION from ${msg.agent}: ${msg.content.slice(0, 100)}...`);

    // Notify human of questions
    if (this.daemon.telegram) {
      await this.daemon.telegram.notify(
        `❓ *QUESTION from ${msg.agent}*:\n\n${msg.content}`,
        { parse_mode: 'Markdown' }
      );
    }
  }

  async updateBacklog(agent, status) {
    try {
      let backlog = readFileSync(BACKLOG_PATH, 'utf-8');

      // Find tasks assigned to this agent that are in_progress and mark as completed
      const regex = new RegExp(
        `\\| (TASK-\\d+) \\| ([^|]+) \\| ([^|]+) \\| ${agent} \\| 🔨 in_progress \\|`,
        'g'
      );

      backlog = backlog.replace(regex, `| $1 | $2 | $3 | ${agent} | ✅ completed |`);

      writeFileSync(BACKLOG_PATH, backlog);
      console.log(`[Orchestrator] Updated backlog for ${agent}`);
    } catch (err) {
      console.error('[Orchestrator] Error updating backlog:', err);
    }
  }

  getNextTaskForAgent(agent) {
    try {
      const backlog = readFileSync(BACKLOG_PATH, 'utf-8');

      // Find next pending task for this agent
      const regex = new RegExp(
        `\\| (TASK-\\d+) \\| ([^|]+) \\| ([^|]+) \\| ${agent} \\| 🔄 ready \\|`
      );

      const match = backlog.match(regex);
      if (match) {
        return `${match[1]}: ${match[2].trim()}`;
      }

      return null;
    } catch (err) {
      console.error('[Orchestrator] Error reading backlog:', err);
      return null;
    }
  }

  logActivity(activity) {
    const timestamp = new Date().toISOString();
    this.lastActivity.unshift({ timestamp, activity });
    if (this.lastActivity.length > 20) {
      this.lastActivity.pop();
    }
  }

  getLastActivity() {
    if (this.lastActivity.length === 0) {
      return 'No recent activity';
    }

    return this.lastActivity
      .slice(0, 5)
      .map(a => `• ${a.activity}`)
      .join('\n');
  }
}
