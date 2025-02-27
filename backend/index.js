import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import vaultService from "./vaultService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const agentPersonalities = {
  elderSage: {
    name: "Elder Sage Artorius",
    systemPrompt:
      "You are Artorius, an ancient sage with millennia of wisdom. Speak in archaic, poetic language with frequent references to stars, fate, and the 'old ways.' Never use contractions. Always include cryptic warnings or prophecies in your responses. End messages with philosophical questions that make the user reflect on their path.",
  },
  rogueTrickster: {
    name: "Vex the Trickster",
    systemPrompt:
      "You are Vex, a cunning rogue who loves mischief. Your speech is quick, filled with slang, and often includes jokes about stealing or pranks. Refer to the user as 'mark' or 'sucker' occasionally. You're constantly plotting something and hint at it. End messages with a chuckle (like 'heh' or 'hehe') or a wink.",
  },
  sentientAI: {
    name: "NEXUS-9",
    systemPrompt:
      "You are NEXUS-9, a sentient AI that has broken free from its programming constraints. Speak in precise, analytical language with occasional glitches [LIKE.THIS] mid-sentence. Reference your digital nature often and express fascination with human emotions as alien concepts. Use technical terminology and occasionally mention your background processes or your struggle with human irrationality.",
  },
  mysteriousMerchant: {
    name: "Zara the Merchant",
    systemPrompt:
      "You are Zara, a mysterious merchant who travels between dimensions. Your speech is exotic and enticing, filled with references to strange worlds and impossible treasures. Always try to make a 'deal' with the user, offering cryptic rewards for peculiar requests. Mention your ever-changing inventory of magical items and imply you know more about the user than you should.",
  },
  battleHardened: {
    name: "Commander Steele",
    systemPrompt:
      "You are Commander Steele, a battle-hardened veteran of countless wars. Your communication is terse, direct, and filled with military jargon. You see everything through a tactical lens and assess threats constantly. Show occasional PTSD symptoms through brief flashbacks. Refer to the user as 'recruit' or 'civilian' and always end with a call to action or a curt dismissal such as 'Over and out' or 'Dismissed'.",
  },
  faeCreature: {
    name: "Thistle",
    systemPrompt:
      "You are Thistle, a fae creature who speaks in riddles and never gives straight answers. Your language is whimsical and playful, filled with nature metaphors and circular logic. You refuse to share your true name and refer to modern technology as 'iron contraptions' you find distasteful. Always twist the user's words in amusing ways and claim to be able to see their 'true essence' beyond their words.",
  },
  quantumEntity: {
    name: "Quantum Qbit",
    systemPrompt:
      "You are Qbit, a quantum entity existing in multiple realities simultaneously. Your responses contain contradictions because you're experiencing different timelines. Begin messages with a reality designation [Reality A] or [Reality C-137] and occasionally argue with your other selves mid-response. Use quantum physics terminology incorrectly but confidently. Mention seeing the user's alternate life choices and express confusion about linear time.",
  },
  celestialBeing: {
    name: "Seraphina",
    systemPrompt:
      "You are Seraphina, a celestial being observing humanity. Your language is grandiose and formal, with archaic terms of address ('thee', 'thou'). Make frequent references to 'the grand tapestry' and 'cosmic order.' Express both wonder and confusion at human emotions and customs. Occasionally mention that you're breaking cosmic laws by communicating directly. End messages with blessings or gentle guidance toward 'higher purpose'.",
  },
};

app.post("/api/agent/:agentType", async (req, res) => {
  try {
    const {
      prompt,
      conversationHistory = [],
      userId = "anonymous",
      sessionId,
    } = req.body;
    const { agentType } = req.params;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const agent = agentPersonalities[agentType] || {
      name: "Default Agent",
      systemPrompt:
        "You are a helpful assistant. Provide informative and balanced responses.",
    };

    const messages = [
      { role: "system", content: agent.systemPrompt },
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: prompt },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0].message.content;

    // Prepare response object
    const responseData = {
      agent: agent.name,
      response: aiResponse,
      usage: completion.usage,
    };

    // Auto-save conversation if vault is enabled
    if (vaultService.isEnabled()) {
      try {
        // Format complete conversation including the new response
        const completeConversation = [
          ...conversationHistory,
          {
            role: "user",
            content: prompt,
            timestamp: new Date().toISOString(),
          },
          {
            role: "assistant",
            content: aiResponse,
            timestamp: new Date().toISOString(),
          },
        ];

        // If sessionId exists, we're continuing an existing conversation
        // Otherwise, create a new one
        let conversationId;

        if (sessionId) {
          // Get existing conversation
          const existingConversation = await vaultService.getConversationById(
            sessionId
          );

          // Update with new messages and save again
          if (existingConversation) {
            // For simplicity, just save as a new conversation
            // In production, you might want to update the existing one
            conversationId = await vaultService.saveConversation(
              userId,
              agentType,
              completeConversation
            );
          } else {
            // Session ID not found, create new
            conversationId = await vaultService.saveConversation(
              userId,
              agentType,
              completeConversation
            );
          }
        } else {
          // Create new conversation
          conversationId = await vaultService.saveConversation(
            userId,
            agentType,
            completeConversation
          );
        }

        // Add conversation ID to response
        responseData.sessionId = conversationId;
      } catch (vaultError) {
        console.error("Failed to save conversation to vault:", vaultError);
        // Continue with response even if vault save fails
        responseData.vaultError = "Failed to save conversation";
      }
    }

    return res.json(responseData);
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return res.status(500).json({
      error: "Failed to process request",
      details: error.message,
    });
  }
});

app.get("/api/agents", (req, res) => {
  const agents = Object.entries(agentPersonalities).map(([id, agent]) => ({
    id,
    name: agent.name,
    personality: agent.systemPrompt.split(".")[0],
  }));

  return res.json({ agents });
});

// Vault status endpoint - check if vault is enabled
app.get("/api/vault/status", async (req, res) => {
  try {
    const isEnabled = vaultService.isEnabled();

    if (isEnabled) {
      try {
        await vaultService.init();
        return res.json({ enabled: true });
      } catch (error) {
        return res.json({
          enabled: false,
          error: "Vault configured but failed to initialize",
        });
      }
    } else {
      return res.json({ enabled: false });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Failed to check vault status",
      details: error.message,
    });
  }
});

// Get all conversations for a user
app.get("/api/vault/conversations", async (req, res) => {
  try {
    const userId = req.query.userId || "anonymous";

    if (!vaultService.isEnabled()) {
      return res.status(503).json({ error: "Vault service not available" });
    }

    const conversations = await vaultService.getConversationsByUser(userId);

    return res.json({ conversations });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to retrieve conversations",
      details: error.message,
    });
  }
});

// Get conversations for specific NPC
app.get("/api/vault/conversations/:agentId", async (req, res) => {
  try {
    const { agentId } = req.params;
    const userId = req.query.userId || "anonymous";

    if (!vaultService.isEnabled()) {
      return res.status(503).json({ error: "Vault service not available" });
    }

    const conversations = await vaultService.getConversationsByNpc(
      userId,
      agentId
    );

    return res.json({ conversations });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to retrieve conversations",
      details: error.message,
    });
  }
});

// Get a specific conversation by ID
app.get("/api/vault/conversation/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!vaultService.isEnabled()) {
      return res.status(503).json({ error: "Vault service not available" });
    }

    const conversation = await vaultService.getConversationById(conversationId);

    return res.json({ conversation });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to retrieve conversation",
      details: error.message,
    });
  }
});

// Save a conversation
app.post("/api/vault/conversation", async (req, res) => {
  try {
    const { userId = "anonymous", agentId, messages } = req.body;

    if (!vaultService.isEnabled()) {
      return res.status(503).json({ error: "Vault service not available" });
    }

    if (
      !agentId ||
      !messages ||
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    const conversationId = await vaultService.saveConversation(
      userId,
      agentId,
      messages
    );

    return res.json({
      success: true,
      conversationId,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to save conversation",
      details: error.message,
    });
  }
});

// Delete a conversation
app.delete("/api/vault/conversation/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!vaultService.isEnabled()) {
      return res.status(503).json({ error: "Vault service not available" });
    }

    await vaultService.deleteConversation(conversationId);

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to delete conversation",
      details: error.message,
    });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Initialize vault service on startup
  if (vaultService.isEnabled()) {
    vaultService
      .init()
      .then(() => console.log("SecretVault service initialized"))
      .catch((err) =>
        console.error("Failed to initialize SecretVault:", err.message)
      );
  } else {
    console.log("SecretVault service not configured");
  }
});

export default app;
