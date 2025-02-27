import { useState, useEffect, useRef, FormEvent } from "react";
import "./AgentDebugger.css";

interface Agent {
  id: string;
  name: string;
  personality: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AgentConversation {
  messages: Message[];
  tokenCount: {
    prompt: number;
    completion: number;
    total: number;
  };
  sessionId?: string; // Track conversation ID for persistence
}

interface ApiResponse {
  agent: string;
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  sessionId?: string; // Added from auto-save API response
  vaultError?: string; // Track if saving to vault failed
}

interface SavedConversation {
  _id: string;
  session_info: {
    timestamp: string;
    user_id: string;
    npc_id: string;
  };
  messages: Message[];
}

// User ID for API calls - in a real app, this would come from authentication
const USER_ID = "debug-user";

const AgentDebugger = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [conversations, setConversations] = useState<
    Record<string, AgentConversation>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState("http://localhost:3000");
  const [vaultStatus, setVaultStatus] = useState<boolean | null>(null);
  const [savedConversations, setSavedConversations] = useState<
    SavedConversation[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available agents and check vault status on load
  useEffect(() => {
    fetchAgents();
    checkVaultStatus();
  }, []);

  // When API URL changes, recheck vault status
  useEffect(() => {
    checkVaultStatus();
  }, [apiUrl]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, selectedAgent]);

  // When user selects an agent, fetch their conversation history
  useEffect(() => {
    if (selectedAgent && vaultStatus) {
      fetchAgentConversationHistory(selectedAgent);
    }
  }, [selectedAgent, vaultStatus]);

  const checkVaultStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/vault/status`);
      if (!response.ok) {
        setVaultStatus(false);
        return;
      }
      const data = await response.json();
      setVaultStatus(data.enabled);
    } catch (err) {
      console.error("Failed to check vault status:", err);
      setVaultStatus(false);
    }
  };

  const fetchAgents = async () => {
    try {
      setError(null);
      const response = await fetch(`${apiUrl}/api/agents`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      setAgents(data.agents);
      if (data.agents.length > 0 && !selectedAgent) {
        setSelectedAgent(data.agents[0].id);
      }
    } catch (err) {
      setError(
        `Failed to fetch agents: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const fetchAgentConversationHistory = async (agentId: string) => {
    if (!vaultStatus) return;

    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `${apiUrl}/api/vault/conversations/${agentId}?userId=${USER_ID}`
      );
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();
      setSavedConversations(data.conversations || []);
    } catch (err) {
      console.error("Failed to fetch conversation history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${apiUrl}/api/vault/conversation/${conversationId}`
      );
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();
      const conversation = data.conversation;

      if (conversation) {
        // Set this conversation as the current one
        setConversations((prev) => ({
          ...prev,
          [selectedAgent]: {
            messages: conversation.messages,
            tokenCount: { prompt: 0, completion: 0, total: 0 }, // We don't store token counts in saved conversations
            sessionId: conversation._id,
          },
        }));
      }
    } catch (err) {
      setError(
        `Failed to load conversation: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(
        `${apiUrl}/api/vault/conversation/${conversationId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      // If this was the current conversation, clear it
      if (conversations[selectedAgent]?.sessionId === conversationId) {
        clearConversation();
      }

      // Refresh the conversations list
      fetchAgentConversationHistory(selectedAgent);
    } catch (err) {
      setError(
        `Failed to delete conversation: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !selectedAgent) return;

    const userMessage: Message = {
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    // Initialize conversation for this agent if it doesn't exist
    if (!conversations[selectedAgent]) {
      setConversations((prev) => ({
        ...prev,
        [selectedAgent]: {
          messages: [],
          tokenCount: { prompt: 0, completion: 0, total: 0 },
        },
      }));
    }

    // Add user message to the conversation
    setConversations((prev) => ({
      ...prev,
      [selectedAgent]: {
        ...prev[selectedAgent],
        messages: [...(prev[selectedAgent]?.messages || []), userMessage],
      },
    }));

    setIsLoading(true);
    setError(null);

    try {
      const currentConversation = conversations[selectedAgent];
      const conversationHistory = (currentConversation?.messages || []).map(
        ({ role, content }) => ({ role, content })
      );

      // Include sessionId if continuing an existing conversation
      const requestBody: any = {
        prompt,
        conversationHistory,
        userId: USER_ID,
      };

      // Add sessionId if we have one (continuing a conversation)
      if (currentConversation?.sessionId) {
        requestBody.sessionId = currentConversation.sessionId;
      }

      const response = await fetch(`${apiUrl}/api/agent/${selectedAgent}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      // Update conversation with assistant response and token counts
      setConversations((prev) => ({
        ...prev,
        [selectedAgent]: {
          messages: [
            ...(prev[selectedAgent]?.messages || []),
            assistantMessage,
          ],
          tokenCount: {
            prompt: data.usage.prompt_tokens,
            completion: data.usage.completion_tokens,
            total: data.usage.total_tokens,
          },
          // Store sessionId from response
          sessionId: data.sessionId,
        },
      }));

      setPrompt("");

      // If there was a vault error, show it but don't break the flow
      if (data.vaultError) {
        console.warn("Vault error:", data.vaultError);
      }

      // Update conversation history after response
      if (vaultStatus) {
        fetchAgentConversationHistory(selectedAgent);
      }
    } catch (err) {
      setError(
        `Request failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    if (selectedAgent) {
      setConversations((prev) => ({
        ...prev,
        [selectedAgent]: {
          messages: [],
          tokenCount: { prompt: 0, completion: 0, total: 0 },
          sessionId: undefined, // Clear session ID
        },
      }));
    }
    setError(null);
  };

  // Get current conversation for selected agent
  const currentConversation = selectedAgent
    ? conversations[selectedAgent]
    : null;
  const currentMessages = currentConversation?.messages || [];
  const currentTokenCount = currentConversation?.tokenCount || {
    prompt: 0,
    completion: 0,
    total: 0,
  };
  const hasSessionId = !!currentConversation?.sessionId;

  return (
    <div className="agent-debugger">
      <header className="debugger-header">
        <h1>AI Agent Debugger</h1>
        <div className="api-config">
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="API URL"
          />
          <button onClick={fetchAgents}>Refresh Agents</button>
          {vaultStatus !== null && (
            <span
              className={`vault-status ${vaultStatus ? "enabled" : "disabled"}`}
            >
              Vault {vaultStatus ? "Enabled" : "Disabled"}
            </span>
          )}
        </div>
      </header>

      <div className="debugger-layout">
        <div className="agent-sidebar">
          <h2>Available Agents</h2>
          <div className="agent-list">
            {agents.length > 0 ? (
              agents.map((agent) => {
                const hasMessages =
                  (conversations[agent.id]?.messages.length || 0) > 0;

                return (
                  <div
                    key={agent.id}
                    className={`agent-item ${
                      selectedAgent === agent.id ? "selected" : ""
                    } ${hasMessages ? "has-messages" : ""}`}
                    onClick={() => setSelectedAgent(agent.id)}
                  >
                    <h3>{agent.name}</h3>
                    <p>{agent.personality}</p>
                    {hasMessages && (
                      <span className="message-count">
                        {conversations[agent.id]?.messages.length || 0} messages
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="no-agents">
                No agents available{error ? " - Check API URL" : ""}
              </p>
            )}
          </div>

          {vaultStatus && (
            <div className="saved-conversations">
              <h3>Conversation History</h3>
              {isLoadingHistory ? (
                <p className="loading-state">Loading saved conversations...</p>
              ) : savedConversations.length > 0 ? (
                <ul className="conversation-list">
                  {savedConversations.map((conv) => (
                    <li key={conv._id} className="conversation-item">
                      <div
                        className="conversation-info"
                        onClick={() => loadConversation(conv._id)}
                      >
                        <span className="conversation-date">
                          {new Date(
                            conv.session_info.timestamp
                          ).toLocaleString()}
                        </span>
                        <span className="message-count">
                          {conv.messages.length} messages
                        </span>
                      </div>
                      <button
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv._id);
                        }}
                        title="Delete conversation"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-conversations">No saved conversations</p>
              )}
            </div>
          )}
        </div>

        <div className="conversation-container">
          <div className="messages-container">
            {!selectedAgent ? (
              <div className="empty-state">
                <p>Select an agent from the sidebar</p>
              </div>
            ) : currentMessages.length === 0 ? (
              <div className="empty-state">
                <p>
                  Start a conversation with{" "}
                  {agents.find((a) => a.id === selectedAgent)?.name}
                </p>
              </div>
            ) : (
              <>
                {hasSessionId && (
                  <div className="session-indicator">
                    <span>
                      Conversation ID: {currentConversation?.sessionId}{" "}
                      {isLoadingHistory && "(Syncing...)"}
                    </span>
                  </div>
                )}
                {currentMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`message ${
                      message.role === "user"
                        ? "user-message"
                        : "assistant-message"
                    }`}
                  >
                    <div className="message-header">
                      <span className="message-role">
                        {message.role === "user"
                          ? "You"
                          : agents.find((a) => a.id === selectedAgent)?.name ||
                            "Assistant"}
                      </span>
                      <span className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="message-content">{message.content}</div>
                  </div>
                ))}
              </>
            )}
            {isLoading && (
              <div className="loading-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            )}
            {error && <div className="error-message">{error}</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <form onSubmit={handleSubmit}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your message here..."
                disabled={isLoading || !selectedAgent}
                rows={3}
              />
              <div className="action-buttons">
                <button
                  type="button"
                  onClick={clearConversation}
                  disabled={!selectedAgent || currentMessages.length === 0}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !prompt.trim() || !selectedAgent}
                >
                  {isLoading ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
            {currentTokenCount.total > 0 && (
              <div className="token-counter">
                <span>
                  Tokens: {currentTokenCount.prompt} prompt /{" "}
                  {currentTokenCount.completion} completion /{" "}
                  {currentTokenCount.total} total
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDebugger;
