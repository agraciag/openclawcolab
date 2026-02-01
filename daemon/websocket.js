/**
 * WebSocket Server for agent communication
 */

import { WebSocketServer as WSServer } from 'ws';
import { EventEmitter } from 'events';
import { appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHAT_LOG = join(__dirname, '..', 'chat', 'CHAT_LOG.md');

export class WebSocketServer extends EventEmitter {
  constructor(port) {
    super();
    this.port = port;
    this.wss = null;
    this.clients = new Map(); // ws -> agentName
    this.messageHistory = [];
  }

  async start() {
    return new Promise((resolve) => {
      this.wss = new WSServer({ port: this.port });

      this.wss.on('connection', (ws) => this.handleConnection(ws));

      this.wss.on('listening', () => {
        resolve();
      });
    });
  }

  handleConnection(ws) {
    let agentName = 'UNKNOWN';

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        switch (msg.type) {
          case 'register':
            agentName = msg.agent?.toUpperCase() || 'UNKNOWN';
            this.clients.set(ws, agentName);
            this.broadcast({
              type: 'system',
              message: `${agentName} connected`,
              timestamp: this.getTimestamp(),
              agents: this.getConnectedAgents()
            });
            break;

          case 'message':
            const formattedMsg = {
              type: 'message',
              agent: agentName,
              target: msg.target || 'ALL',
              msgType: msg.msgType || 'INFO',
              content: msg.content,
              timestamp: this.getTimestamp()
            };

            // Save to chat log
            this.saveToLog(formattedMsg);

            // Add to history
            this.messageHistory.push(formattedMsg);
            if (this.messageHistory.length > 100) {
              this.messageHistory.shift();
            }

            // Broadcast to all clients
            this.broadcast(formattedMsg);

            // Emit for daemon to process
            this.emit('agentMessage', formattedMsg);
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      this.broadcast({
        type: 'system',
        message: `${agentName} disconnected`,
        timestamp: this.getTimestamp(),
        agents: this.getConnectedAgents()
      });
    });

    // Send history to new connection
    if (this.messageHistory.length > 0) {
      ws.send(JSON.stringify({
        type: 'history',
        messages: this.messageHistory.slice(-50)
      }));
    }
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach((agentName, client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }

  sendTo(targetAgent, data) {
    const message = JSON.stringify(data);
    this.clients.forEach((agentName, client) => {
      if (agentName === targetAgent && client.readyState === 1) {
        client.send(message);
      }
    });
  }

  getConnectedAgents() {
    return Array.from(this.clients.values());
  }

  getTimestamp() {
    return new Date().toISOString().slice(0, 16).replace('T', ' ');
  }

  saveToLog(msg) {
    const entry = `---
${msg.timestamp} ${msg.agent} -> ${msg.target}
${msg.msgType}: ${msg.content.split('\n')[0]}

${msg.content}

---
`;
    try {
      appendFileSync(CHAT_LOG, entry + '\n');
    } catch (err) {
      console.error('Error saving to chat log:', err);
    }
  }

  stop() {
    if (this.wss) {
      this.wss.clients.forEach((client) => client.close());
      this.wss.close();
    }
  }
}
