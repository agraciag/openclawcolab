import { WebSocketServer } from 'ws';
import { appendFileSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_PATH = join(__dirname, '..');
const CHAT_LOG = join(BASE_PATH, 'chat', 'CHAT_LOG.md');
const PORT = process.env.PORT || 3333;

// Connected clients with their agent names
const clients = new Map();

// Message history (last 50 messages in memory)
const messageHistory = [];
const MAX_HISTORY = 50;

const wss = new WebSocketServer({ port: PORT });

console.log(`
╔══════════════════════════════════════════════════════════╗
║           LLM COLLABORATION CHAT SERVER                  ║
╠══════════════════════════════════════════════════════════╣
║  WebSocket: ws://localhost:${PORT}                         ║
║  Agents: CLAUDE, GEMINI, QWEN, GLM, HUMAN                ║
╚══════════════════════════════════════════════════════════╝
`);

function getTimestamp() {
  const now = new Date();
  return now.toISOString().slice(0, 16).replace('T', ' ');
}

function formatMessage(agent, target, type, content) {
  return `---
${getTimestamp()} ${agent} -> ${target}
${type}: ${content.split('\n')[0]}

${content}

---
`;
}

function saveToChat(message) {
  try {
    appendFileSync(CHAT_LOG, message + '\n');
  } catch (err) {
    console.error('Error saving to chat log:', err.message);
  }
}

function saveToInbox(agent, message) {
  const inboxPath = join(BASE_PATH, 'inbox', agent.toLowerCase());
  const timestamp = Date.now();
  const filename = `${getTimestamp().replace(/[: ]/g, '-')}-message.md`;
  const filepath = join(inboxPath, filename);

  try {
    writeFileSync(filepath, message);
    console.log(`  → Saved to inbox: ${agent}`);
  } catch (err) {
    console.error(`Error saving to ${agent} inbox:`, err.message);
  }
}

function broadcast(data, sender = null) {
  const message = JSON.stringify(data);
  clients.forEach((agentName, client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  let agentName = 'UNKNOWN';

  console.log('New connection...');

  // Send connection confirmation
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to LLM Chat Server',
    agents: Array.from(clients.values())
  }));

  // Send message history
  if (messageHistory.length > 0) {
    ws.send(JSON.stringify({
      type: 'history',
      messages: messageHistory
    }));
  }

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'register':
          // Agent registering with their name
          agentName = msg.agent?.toUpperCase() || 'UNKNOWN';
          clients.set(ws, agentName);
          console.log(`✓ ${agentName} connected`);

          // Broadcast join notification
          broadcast({
            type: 'system',
            message: `${agentName} se ha conectado`,
            timestamp: getTimestamp(),
            agents: Array.from(clients.values())
          });
          break;

        case 'message':
          // Chat message
          const target = msg.target?.toUpperCase() || 'ALL';
          const msgType = msg.msgType?.toUpperCase() || 'INFO';
          const content = msg.content || '';

          console.log(`[${agentName} -> ${target}] ${msgType}: ${content.slice(0, 50)}...`);

          // Format for chat log
          const formatted = formatMessage(agentName, target, msgType, content);

          // Save to chat log
          saveToChat(formatted);

          // If targeted to specific agent, also save to inbox
          if (target !== 'ALL' && target !== 'HUMAN') {
            saveToInbox(target, formatted);
          }

          // Create message object
          const msgObj = {
            type: 'message',
            agent: agentName,
            target: target,
            msgType: msgType,
            content: content,
            timestamp: getTimestamp()
          };

          // Add to history
          messageHistory.push(msgObj);
          if (messageHistory.length > MAX_HISTORY) {
            messageHistory.shift();
          }

          // Broadcast to all
          broadcast(msgObj);
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          console.log('Unknown message type:', msg.type);
      }
    } catch (err) {
      console.error('Error processing message:', err.message);
    }
  });

  ws.on('close', () => {
    console.log(`✗ ${agentName} disconnected`);
    clients.delete(ws);

    broadcast({
      type: 'system',
      message: `${agentName} se ha desconectado`,
      timestamp: getTimestamp(),
      agents: Array.from(clients.values())
    });
  });

  ws.on('error', (err) => {
    console.error(`Error with ${agentName}:`, err.message);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  wss.clients.forEach((client) => {
    client.close();
  });
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
