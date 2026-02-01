/**
 * Agent Spawner - Executes CLI agents
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class AgentSpawner {
  constructor() {
    this.workspace = process.env.WORKSPACE || join(__dirname, '..');
    this.timeout = (parseInt(process.env.TASK_TIMEOUT) || 30) * 60 * 1000;

    // Agent configurations
    this.agents = {
      CLAUDE: {
        cmd: process.env.CLAUDE_CLI || 'claude',
        args: process.env.SKIP_PERMISSIONS === 'true'
          ? ['--dangerously-skip-permissions']
          : [],
        contextFile: 'CLAUDE.md'
      },
      QWEN: {
        cmd: process.env.QWEN_CLI || 'qwen',
        args: process.env.AUTO_APPROVE === 'true' ? ['--auto-approve'] : [],
        contextFile: 'QWEN.md'
      },
      GEMINI: {
        cmd: process.env.GEMINI_CLI || 'gemini',
        args: process.env.AUTO_APPROVE === 'true' ? ['--auto-approve'] : [],
        contextFile: 'GEMINI.md'
      },
      CHATGPT: {
        cmd: process.env.CHATGPT_CLI || 'aider',
        args: process.env.AUTO_APPROVE === 'true' ? ['--yes', '--auto-commits'] : [],
        contextFile: 'CHATGPT.md'
      },
      GLM: {
        cmd: process.env.GLM_CLI || 'glm',
        args: [],
        contextFile: 'GLM.md'
      }
    };
  }

  async runAgent(agentName, task) {
    const agent = this.agents[agentName];
    if (!agent) {
      throw new Error(`Unknown agent: ${agentName}`);
    }

    const contextPath = join(__dirname, '..', agent.contextFile);

    const fullPrompt = `
Primero lee tu archivo de contexto: ${contextPath}
Luego lee el estado actual: ${join(__dirname, '..', 'shared', 'CONTEXT.md')}
Revisa tu inbox: ${join(__dirname, '..', 'inbox', agentName.toLowerCase())}

TAREA: ${task}

IMPORTANTE:
- Cuando termines, envía un mensaje DELIVERY al chat WebSocket (localhost:3333)
- Si hay problemas, envía un mensaje ISSUE al chat
- Trabaja de forma autónoma, no esperes aprobación para cada paso
    `.trim();

    return new Promise((resolve, reject) => {
      console.log(`[Spawner] Starting ${agentName}: ${task.slice(0, 50)}...`);

      const proc = spawn(agent.cmd, [...agent.args, '-p', fullPrompt], {
        cwd: this.workspace,
        env: {
          ...process.env,
          AGENT_NAME: agentName,
          FORCE_COLOR: '1'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
        process.stdout.write(`[${agentName}] ${data}`);
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        process.stderr.write(`[${agentName}:err] ${data}`);
      });

      proc.on('close', (code) => {
        console.log(`[Spawner] ${agentName} finished with code ${code}`);

        if (code === 0) {
          resolve({ success: true, stdout, stderr, code });
        } else {
          reject(new Error(`Agent ${agentName} exited with code ${code}\n${stderr}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to start ${agentName}: ${err.message}`));
      });

      // Timeout
      const timer = setTimeout(() => {
        console.log(`[Spawner] ${agentName} timed out after ${this.timeout / 60000} minutes`);
        proc.kill('SIGTERM');
        setTimeout(() => proc.kill('SIGKILL'), 5000);
        reject(new Error(`Agent ${agentName} timed out`));
      }, this.timeout);

      proc.on('close', () => clearTimeout(timer));
    });
  }

  getAvailableAgents() {
    return Object.keys(this.agents);
  }
}
