import { Message } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatMessageProps {
  message: Message;
  agentName: string;
  agentAvatar: string;
}

export function ChatMessage({ message, agentName, agentAvatar }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn(
      "flex w-full gap-3 p-4",
      isUser ? "justify-end" : "justify-start",
      isUser ? "bg-muted/50" : "bg-background"
    )}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={agentAvatar} alt={agentName} />
          <AvatarFallback>{agentName[0]}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col gap-1 max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? 'You' : agentName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(message.timestamp)}
          </span>
        </div>
        
        <div className={cn(
          "rounded-lg px-4 py-2 text-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {message.content}
        </div>
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}