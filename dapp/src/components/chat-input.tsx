import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendIcon } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isDisabled?: boolean;
}

export function ChatInput({ onSendMessage, isDisabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isDisabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 border-t">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="min-h-[80px] resize-none"
        disabled={isDisabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={!message.trim() || isDisabled}
      >
        <SendIcon className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}