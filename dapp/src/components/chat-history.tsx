import { useEffect, useRef } from 'react';
import { Conversation } from '@/types';
import { ChatMessage } from '@/components/chat-message';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Agent } from '@/types';

interface ChatHistoryProps {
  conversation: Conversation | null;
  agent: Agent | null;
}

export function ChatHistory({ conversation, agent }: ChatHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  if (!conversation || !agent) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select an agent to start chatting</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      {conversation.messages.length === 0 ? (
        <div className="flex h-full items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h3 className="mb-2 text-lg font-medium">Start a conversation with {agent.name}</h3>
            <p className="text-muted-foreground">{agent.description}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {conversation.messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              agentName={agent.name}
              agentAvatar={agent.avatarUrl}
            />
          ))}
        </div>
      )}
    </ScrollArea>
  );
}