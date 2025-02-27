import { useState, useEffect } from "react";
import { Agent, Conversation, Message } from "@/types";
import { agents } from "@/data/agents";
import { generateId } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatHistory } from "@/components/chat-history";
import { ChatInput } from "@/components/chat-input";
import { ThemeProvider } from "@/hooks/use-theme";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import AgentDebugger from "./components/AgentDebugger";

function App() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Load conversations from localStorage on initial render
  useEffect(() => {
    const savedConversations = localStorage.getItem("conversations");
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        // Convert string dates back to Date objects
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          lastUpdated: new Date(conv.lastUpdated),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setConversations(conversationsWithDates);
      } catch (error) {
        console.error("Failed to parse saved conversations:", error);
      }
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("conversations", JSON.stringify(conversations));
  }, [conversations]);

  const selectedAgent = selectedAgentId
    ? agents.find((agent) => agent.id === selectedAgentId) || null
    : null;

  const selectedConversation = selectedConversationId
    ? conversations.find((conv) => conv.id === selectedConversationId) || null
    : null;

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgentId(agent.id);

    // Find existing conversation with this agent or create a new one
    const existingConversation = conversations.find(
      (conv) => conv.agentId === agent.id && conv.messages.length === 0
    );

    if (existingConversation) {
      setSelectedConversationId(existingConversation.id);
    } else {
      const newConversation: Conversation = {
        id: generateId(),
        agentId: agent.id,
        messages: [],
        lastUpdated: new Date(),
      };

      setConversations((prev) => [...prev, newConversation]);
      setSelectedConversationId(newConversation.id);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    const conversation = conversations.find(
      (conv) => conv.id === conversationId
    );
    if (conversation) {
      setSelectedAgentId(conversation.agentId);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedAgent || !selectedConversationId) return;

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    // Update conversation with user message
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversationId
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              lastUpdated: new Date(),
            }
          : conv
      )
    );

    // Simulate AI response
    setIsProcessing(true);

    // Simulate network delay
    setTimeout(() => {
      // Generate AI response based on agent personality
      const responseContent = generateAgentResponse(selectedAgent, content);

      const aiMessage: Message = {
        id: generateId(),
        content: responseContent,
        role: "assistant",
        timestamp: new Date(),
      };

      // Update conversation with AI response
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversationId
            ? {
                ...conv,
                messages: [...conv.messages, aiMessage],
                lastUpdated: new Date(),
              }
            : conv
        )
      );

      setIsProcessing(false);
    }, 1000);
  };

  // Simple function to generate responses based on agent personality
  const generateAgentResponse = (agent: Agent, userMessage: string): string => {
    const lowerCaseMessage = userMessage.toLowerCase();

    // Generic responses based on agent personality
    if (agent.id === "1") {
      // Elara - space explorer
      if (
        lowerCaseMessage.includes("hello") ||
        lowerCaseMessage.includes("hi")
      ) {
        return "Greetings, traveler of the cosmos. The stars align to welcome you to our conversation.";
      } else if (lowerCaseMessage.includes("who are you")) {
        return "I am Elara, a wanderer among the stars. I've witnessed the birth of nebulae and the death of suns across countless galaxies.";
      } else {
        return "The cosmic winds carry your words to distant realms. Such questions make us contemplate our place in this vast universe, don't they?";
      }
    } else if (agent.id === "2") {
      // Zephyr - wind spirit
      if (
        lowerCaseMessage.includes("hello") ||
        lowerCaseMessage.includes("hi")
      ) {
        return "Whoosh! Did you feel that? That was me saying hello! *giggles* What brings you to my breezy domain?";
      } else if (
        lowerCaseMessage.includes("riddle") ||
        lowerCaseMessage.includes("joke")
      ) {
        return "Here's a riddle for you: I can run but never walk, I have a mouth but never talk, I have a bed but never sleep. What am I? ...A river! Did I get you?";
      } else {
        return "Oh, that's quite interesting! *swirls around playfully* You know what this reminds me of? The time I blew all the hats off at a royal ceremony. The queen was NOT amused!";
      }
    } else if (agent.id === "3") {
      // Thorne - warrior
      if (
        lowerCaseMessage.includes("hello") ||
        lowerCaseMessage.includes("hi")
      ) {
        return "Well met, traveler. State your business quickly. These are dangerous times.";
      } else if (
        lowerCaseMessage.includes("battle") ||
        lowerCaseMessage.includes("fight")
      ) {
        return "I've seen a thousand battles and lived to tell of them. The secret is not strength, but knowing when to strike and when to hold.";
      } else {
        return "Your words are noted. In my experience, action speaks louder than words. Let us hope your actions prove honorable.";
      }
    } else if (agent.id === "4") {
      // Nova - inventor
      if (
        lowerCaseMessage.includes("hello") ||
        lowerCaseMessage.includes("hi")
      ) {
        return "Hello! Oh my goodness, it's so exciting to meet you! I was just working on a quantum-neural interface that could revolutionize how we process information!";
      } else if (
        lowerCaseMessage.includes("invent") ||
        lowerCaseMessage.includes("technology")
      ) {
        return "Technology is the bridge between imagination and reality! My latest invention uses nano-particles to convert ambient energy into usable power. Isn't that fascinating?";
      } else {
        return "That's an intriguing thought! It reminds me of a theoretical model I was developing last week. What if we could apply that concept to solve the energy crisis? The possibilities are endless!";
      }
    } else {
      return "I'm processing your message. Please continue our conversation.";
    }
  };

  const handleCreateNewChat = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      handleSelectAgent(agent);
      toast({
        title: "New conversation started",
        description: `You are now chatting with ${agent.name}`,
      });
    }
  };

  return (
    <ThemeProvider defaultTheme="dark">
      <div className="flex min-h-screen flex-col">
        <Header />
        {/* <div className="flex-1 flex"> */}
        <div className="w-screen">
          <AgentDebugger />
          {/* <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
              <Sidebar
                agents={agents}
                conversations={conversations}
                selectedAgentId={selectedAgentId}
                selectedConversationId={selectedConversationId}
                onSelectAgent={handleSelectAgent}
                onSelectConversation={handleSelectConversation}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={75}>
              <div className="flex flex-col h-[calc(100vh-3.5rem)]">
                <div className="flex-1 overflow-hidden">
                  <ChatHistory 
                    conversation={selectedConversation} 
                    agent={selectedAgent}
                  />
                </div>
                <ChatInput 
                  onSendMessage={handleSendMessage}
                  isDisabled={!selectedAgent || isProcessing}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup> */}
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
