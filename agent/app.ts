import OpenAI from "openai";
import 'dotenv/config';
import { EventEmitter } from 'node:events';
import process from 'node:process';
import type { ClientOptions } from 'openai';

type events = 'start' | 'stop' | 'error' | 'message' | 'tool' | 'tool_result' | 'response';
interface Agent_interface {
  on: (event: events, listener: (...args: any[]) => void) => void;
  off: (event: events, listener: (...args: any[]) => void) => void;
  sendMessage: (message: string) => void;
}

export class Agent implements Agent_interface {
  private client: OpenAI;
  private listeners: Map<events, ((...args: any[]) => void)[]> = new Map();

  constructor(client: ClientOptions) {
    this.client = new OpenAI(client);
  }

  on(event: events, listener: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(listener);
  }

  off(event: events, listener: (...args: any[]) => void) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      this.listeners.set(event, listeners.filter(l => l !== listener));
    }
  }

  private emit(event: events, ...args: any[]) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener(...args);
      }
    }
  }

  async sendMessage(message: string) {
    this.emit('start');
    this.emit('message', message);

    const response = await this.client.chat.completions.create({
      model: 'auto/best-fast',
      messages: [{ role: 'user', content: message }]
    });

    this.emit('response', response.choices[0]?.message);
    this.emit('stop');
  }
}
