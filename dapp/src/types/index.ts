export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  personality: string;
}

export interface Conversation {
  id: string;
  agentId: string;
  messages: Message[];
  lastUpdated: Date;
}