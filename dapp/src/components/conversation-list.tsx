import { Conversation, Agent } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { agents } from '@/data/agents';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

export function ConversationList({ 
  conversations, 
  selectedConversationId, 
  onSelectConversation 
}: ConversationListProps) {
  // Sort conversations by last updated date (newest first)
  const sortedConversations = [...conversations].sort(
    (a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()
  );

  const getAgentById = (agentId: string): Agent | undefined => {
    return agents.find(agent => agent.id === agentId);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        {sortedConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          sortedConversations.map((conversation) => {
            const agent = getAgentById(conversation.agentId);
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            
            return (
              <Button
                key={conversation.id}
                variant={selectedConversationId === conversation.id ? "default" : "ghost"}
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start gap-3 w-full text-left">
                  {agent && (
                    <img 
                      src={agent.avatarUrl} 
                      alt={agent.name} 
                      className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium truncate">
                        {agent?.name || 'Unknown Agent'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(conversation.lastUpdated)}
                      </span>
                    </div>
                    {lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {lastMessage.role === 'user' ? 'You: ' : `${agent?.name}: `}
                        {lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              </Button>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}