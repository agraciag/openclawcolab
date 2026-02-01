#!/usr/bin/env node

import WebSocket from 'ws';
import { createInterface } from 'readline';

const SERVER_URL = process.env.CHAT_SERVER || 'ws://localhost:3333';
const AGENT = process.env.AGENT || process.argv[2] || 'HUMAN';
const COMMAND = process.argv[3] || 'interactive';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
};

const agentColors = {
  CLAUDE: colors.magenta,
  GEMINI: colors.blue,
  QWEN: colors.green,
  GLM: colors.yellow,
  HUMAN: colors.cyan,
  SYSTEM: colors.dim,
};

function colorize(agent) {
  return agentColors[agent] || colors.white;
}

function printMessage(msg) {
  if (msg.type === 'system') {
    console.log(`${colors.dim}[${msg.timestamp}] ${msg.message}${colors.reset}`);
    return;
  }

  if (msg.type === 'message') {
    const agentColor = colorize(msg.agent);
    const targetColor = colorize(msg.target);

    console.log(`\n${colors.dim}${msg.timestamp}${colors.reset}`);
    console.log(`${agentColor}${colors.bright}${msg.agent}${colors.reset} -> ${targetColor}${msg.target}${colors.reset}`);
    console.log(`${colors.yellow}${msg.msgType}${colors.reset}: ${msg.content}`);
  }
}

function printBanner() {
  console.log(`
${colors.bgBlue}${colors.white}                                                    ${colors.reset}
${colors.bgBlue}${colors.white}   LLM COLLABORATION CHAT - ${AGENT.padEnd(20)}   ${colors.reset}
${colors.bgBlue}${colors.white}                                                    ${colors.reset}

${colors.dim}Comandos:${colors.reset}
  ${colors.cyan}/msg${colors.reset} <texto>           - Enviar INFO a ALL
  ${colors.cyan}/to${colors.reset} <agent> <texto>    - Enviar a agente específico
  ${colors.cyan}/task${colors.reset} <texto>          - Enviar TASK a ALL
  ${colors.cyan}/question${colors.reset} <texto>      - Enviar QUESTION a ALL
  ${colors.cyan}/delivery${colors.reset} <texto>      - Enviar DELIVERY a ALL
  ${colors.cyan}/agents${colors.reset}                - Ver agentes conectados
  ${colors.cyan}/quit${colors.reset}                  - Salir

`);
}

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(SERVER_URL);

    ws.on('open', () => {
      // Register this agent
      ws.send(JSON.stringify({
        type: 'register',
        agent: AGENT
      }));
      resolve(ws);
    });

    ws.on('error', (err) => {
      reject(err);
    });
  });
}

async function sendSingle(content, target = 'ALL', msgType = 'INFO') {
  try {
    const ws = await connect();

    ws.send(JSON.stringify({
      type: 'message',
      target: target,
      msgType: msgType,
      content: content
    }));

    // Wait a bit for confirmation then close
    setTimeout(() => {
      ws.close();
      console.log(`${colors.green}✓ Mensaje enviado${colors.reset}`);
      process.exit(0);
    }, 500);

  } catch (err) {
    console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
    console.error(`¿Está el servidor corriendo? npm start`);
    process.exit(1);
  }
}

async function interactive() {
  printBanner();

  let ws;
  let connectedAgents = [];

  try {
    ws = await connect();
    console.log(`${colors.green}✓ Conectado al servidor${colors.reset}\n`);
  } catch (err) {
    console.error(`${colors.red}Error: No se pudo conectar al servidor${colors.reset}`);
    console.error(`Asegúrate de iniciar el servidor: cd server && npm start`);
    process.exit(1);
  }

  let rl; // Declare rl here so we can reference it in ws.on('message')

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'connected') {
        connectedAgents = msg.agents || [];
        return;
      }

      if (msg.type === 'history') {
        console.log(`${colors.dim}--- Últimos mensajes ---${colors.reset}`);
        msg.messages.forEach(printMessage);
        console.log(`${colors.dim}--- Fin del historial ---${colors.reset}\n`);
        if (rl) rl.prompt();
        return;
      }

      if (msg.type === 'system') {
        connectedAgents = msg.agents || connectedAgents;
      }

      // Don't print our own messages
      if (msg.agent !== AGENT) {
        printMessage(msg);
        if (rl) rl.prompt();
      }
    } catch (err) {
      // Ignore parse errors
    }
  });

  ws.on('close', () => {
    console.log(`\n${colors.red}Desconectado del servidor${colors.reset}`);
    process.exit(0);
  });

  rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${colorize(AGENT)}${AGENT}>${colors.reset} `
  });

  rl.prompt();

  rl.on('line', (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    // Parse commands
    if (input.startsWith('/')) {
      const parts = input.slice(1).split(' ');
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1).join(' ');

      switch (cmd) {
        case 'quit':
        case 'exit':
        case 'q':
          ws.close();
          rl.close();
          return;

        case 'agents':
        case 'who':
          console.log(`${colors.cyan}Agentes conectados:${colors.reset} ${connectedAgents.join(', ') || 'ninguno'}`);
          break;

        case 'msg':
        case 'm':
          if (args) {
            ws.send(JSON.stringify({
              type: 'message',
              target: 'ALL',
              msgType: 'INFO',
              content: args
            }));
            console.log(`${colors.dim}[enviado]${colors.reset}`);
          }
          break;

        case 'to':
          const toParts = args.split(' ');
          const toAgent = toParts[0]?.toUpperCase();
          const toContent = toParts.slice(1).join(' ');
          if (toAgent && toContent) {
            ws.send(JSON.stringify({
              type: 'message',
              target: toAgent,
              msgType: 'INFO',
              content: toContent
            }));
            console.log(`${colors.dim}[enviado a ${toAgent}]${colors.reset}`);
          } else {
            console.log(`${colors.yellow}Uso: /to <AGENT> <mensaje>${colors.reset}`);
          }
          break;

        case 'task':
          if (args) {
            ws.send(JSON.stringify({
              type: 'message',
              target: 'ALL',
              msgType: 'TASK',
              content: args
            }));
            console.log(`${colors.dim}[task enviada]${colors.reset}`);
          }
          break;

        case 'question':
        case 'q':
          if (args) {
            ws.send(JSON.stringify({
              type: 'message',
              target: 'ALL',
              msgType: 'QUESTION',
              content: args
            }));
            console.log(`${colors.dim}[pregunta enviada]${colors.reset}`);
          }
          break;

        case 'delivery':
          if (args) {
            ws.send(JSON.stringify({
              type: 'message',
              target: 'ALL',
              msgType: 'DELIVERY',
              content: args
            }));
            console.log(`${colors.dim}[delivery enviado]${colors.reset}`);
          }
          break;

        case 'help':
          printBanner();
          break;

        default:
          console.log(`${colors.yellow}Comando desconocido. Usa /help${colors.reset}`);
      }
    } else {
      // Direct message (shortcut)
      ws.send(JSON.stringify({
        type: 'message',
        target: 'ALL',
        msgType: 'INFO',
        content: input
      }));
      console.log(`${colors.dim}[enviado]${colors.reset}`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    ws.close();
    process.exit(0);
  });
}

// Main
const command = process.argv[3];
const content = process.argv.slice(4).join(' ');

if (command === 'send' && content) {
  sendSingle(content);
} else if (command === 'send-to' && process.argv[4] && process.argv[5]) {
  sendSingle(process.argv.slice(5).join(' '), process.argv[4].toUpperCase());
} else {
  interactive();
}
