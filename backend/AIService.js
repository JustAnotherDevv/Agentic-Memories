import fetch from "node-fetch";

// AI service configuration
const AI_PROVIDERS = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  LOCAL_LLM: "local",
};

// Import NPC configurations
import { NPC_CONFIGS } from "./npcConfig.js";

class AIService {
  constructor(apiKeys) {
    this.apiKeys = apiKeys;
  }

  async generateResponse(conversation) {
    const npcId = conversation.session_info.npc_id;
    const npcConfig = NPC_CONFIGS[npcId] || {
      system_prompt: `You are ${npcId}, an NPC in a fantasy world.`,
      provider: AI_PROVIDERS.OPENAI,
      model: "gpt-3.5-turbo",
      temperature: 0.7,
    };

    // Format message history
    const messages = this._formatMessagesForProvider(
      conversation.messages,
      npcConfig
    );

    // Select provider and generate response
    switch (npcConfig.provider) {
      case AI_PROVIDERS.OPENAI:
        return this._callOpenAI(messages, npcConfig);
      case AI_PROVIDERS.ANTHROPIC:
        return this._callAnthropic(messages, npcConfig);
      case AI_PROVIDERS.LOCAL_LLM:
        return this._callLocalLLM(messages, npcConfig);
      default:
        throw new Error(`Unknown AI provider: ${npcConfig.provider}`);
    }
  }

  _formatMessagesForProvider(messageHistory, npcConfig) {
    // Format differently depending on the provider
    if (npcConfig.provider === AI_PROVIDERS.OPENAI) {
      return [
        { role: "system", content: npcConfig.system_prompt },
        ...messageHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ];
    } else if (npcConfig.provider === AI_PROVIDERS.ANTHROPIC) {
      return {
        system: npcConfig.system_prompt,
        messages: messageHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      };
    } else {
      // Generic format for other providers
      return {
        system_prompt: npcConfig.system_prompt,
        messages: messageHistory,
      };
    }
  }

  async _callOpenAI(messages, npcConfig) {
    try {
      // Log the API call for debugging (remove in production)
      console.log(`Calling OpenAI API for NPC with model: ${npcConfig.model}`);

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKeys.openai}`,
          },
          body: JSON.stringify({
            model: npcConfig.model,
            messages,
            temperature: npcConfig.temperature,
            max_tokens: 500,
            presence_penalty: 0.6,
            frequency_penalty: 0.5,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("OpenAI API error response:", data);
        throw new Error(
          `OpenAI API error: ${data.error?.message || JSON.stringify(data)}`
        );
      }

      // Log token usage for monitoring costs
      if (data.usage) {
        console.log(
          `Token usage - Prompt: ${data.usage.prompt_tokens}, Completion: ${data.usage.completion_tokens}, Total: ${data.usage.total_tokens}`
        );
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI API call failed:", error);
      return "I seem to be at a loss for words right now.";
    }
  }

  async _callAnthropic(messages, npcConfig) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKeys.anthropic,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: npcConfig.model,
          system: messages.system,
          messages: messages.messages,
          max_tokens: 500,
          temperature: npcConfig.temperature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Anthropic API error: ${data.error?.message || JSON.stringify(data)}`
        );
      }

      return data.content[0].text;
    } catch (error) {
      console.error("Anthropic API call failed:", error);
      return "My thoughts are clouded at the moment.";
    }
  }

  async _callLocalLLM(messages, npcConfig) {
    // Implementation for a locally hosted LLM service
    // This is a placeholder - customize based on your local setup
    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama2",
          prompt: `${npcConfig.system_prompt}\n\n${messages.messages
            .map((m) => `${m.role}: ${m.content}`)
            .join("\n")}`,
          temperature: npcConfig.temperature,
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Local LLM API call failed:", error);
      return "I cannot find the words to respond right now.";
    }
  }
}

export default AIService;
