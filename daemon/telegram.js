/**
 * Telegram Bot for notifications and commands
 */

import TelegramBotAPI from 'node-telegram-bot-api';
import { EventEmitter } from 'events';

export class TelegramBot extends EventEmitter {
  constructor(token, chatId) {
    super();
    this.token = token;
    this.chatId = chatId;
    this.bot = null;
  }

  async start() {
    if (!this.token) {
      throw new Error('Telegram bot token not configured');
    }

    this.bot = new TelegramBotAPI(this.token, { polling: true });

    // Handle incoming messages
    this.bot.on('message', (msg) => this.handleMessage(msg));

    // Handle polling errors
    this.bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error.message);
    });

    // If chatId not set, get it from first message
    if (!this.chatId) {
      console.log('Waiting for first Telegram message to get chat ID...');
    }

    return this.bot.getMe();
  }

  handleMessage(msg) {
    // Save chat ID if not set
    if (!this.chatId) {
      this.chatId = msg.chat.id;
      console.log(`Telegram chat ID set: ${this.chatId}`);
      this.notify('✅ OpenClawColab connected! Chat ID saved.');
    }

    // Only process messages from configured chat
    if (msg.chat.id.toString() !== this.chatId?.toString()) {
      return;
    }

    const text = msg.text || '';

    // Check if it's a command
    if (text.startsWith('/')) {
      const parts = text.split(' ');
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      this.emit('command', { command, args, msg });
    } else {
      // Regular message - could be used for free-form commands
      this.emit('message', { text, msg });
    }
  }

  async notify(text, options = {}) {
    if (!this.bot || !this.chatId) {
      console.log('[Telegram not ready]', text);
      return;
    }

    try {
      await this.bot.sendMessage(this.chatId, text, options);
    } catch (error) {
      console.error('Error sending Telegram message:', error.message);
    }
  }

  async notifyWithButtons(text, buttons) {
    if (!this.bot || !this.chatId) return;

    const keyboard = {
      reply_markup: {
        inline_keyboard: buttons.map(row =>
          row.map(btn => ({
            text: btn.text,
            callback_data: btn.data
          }))
        )
      }
    };

    await this.bot.sendMessage(this.chatId, text, keyboard);
  }

  stop() {
    if (this.bot) {
      this.bot.stopPolling();
    }
  }
}
