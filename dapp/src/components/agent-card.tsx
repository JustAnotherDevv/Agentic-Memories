import { Agent } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onSelect: (agent: Agent) => void;
}

export function AgentCard({ agent, isSelected, onSelect }: AgentCardProps) {
  return (
    <Card className={`cursor-pointer transition-all ${isSelected ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <img 
            src={agent.avatarUrl} 
            alt={agent.name} 
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <CardDescription className="line-clamp-1">{agent.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p className="line-clamp-2">{agent.personality}</p>
      </CardContent>
      <CardFooter>
        <Button 
          variant={isSelected ? "default" : "outline"} 
          className="w-full" 
          onClick={() => onSelect(agent)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          {isSelected ? 'Selected' : 'Chat Now'}
        </Button>
      </CardFooter>
    </Card>
  );
}