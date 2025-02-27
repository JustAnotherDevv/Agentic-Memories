import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentCard } from '@/components/agent-card';
import { ConversationList } from '@/components/conversation-list';
import { Agent, Conversation } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  agents: Agent[];
  conversations: Conversation[];
  selectedAgentId: string | null;
  selectedConversationId: string | null;
  onSelectAgent: (agent: Agent) => void;
  onSelectConversation: (conversationId: string) => void;
}

export function Sidebar({
  agents,
  conversations,
  selectedAgentId,
  selectedConversationId,
  onSelectAgent,
  onSelectConversation
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<string>("agents");

  return (
    <div className="flex h-full flex-col">
      <Tabs defaultValue="agents" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mx-2 my-2">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="conversations">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="agents" className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-1 gap-4 p-4">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isSelected={agent.id === selectedAgentId}
                  onSelect={onSelectAgent}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="conversations" className="flex-1 p-0">
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={onSelectConversation}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}