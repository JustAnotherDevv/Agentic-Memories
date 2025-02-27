// Example client-side code to interact with the NPC conversation API

/**
 * Starts a new conversation with an NPC
 * @param {string} userId - User identifier
 * @param {string} npcId - NPC identifier from available NPCs
 * @returns {Promise<object>} - New conversation data with ID
 */
async function startConversation(userId, npcId) {
  const response = await fetch("http://localhost:3000/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      npc_id: npcId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to start conversation: ${error.error}`);
  }

  return response.json();
}

/**
 * Sends a message to an NPC and gets their response
 * @param {string} conversationId - Conversation UUID
 * @param {string} message - User message content
 * @returns {Promise<object>} - Updated conversation with NPC response
 */
async function sendMessage(conversationId, message) {
  const response = await fetch(
    `http://localhost:3000/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to send message: ${error.error}`);
  }

  return response.json();
}

/**
 * Gets conversation history
 * @param {string} conversationId - Conversation UUID
 * @returns {Promise<object>} - Full conversation data
 */
async function getConversation(conversationId) {
  const response = await fetch(
    `http://localhost:3000/api/conversations/${conversationId}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get conversation: ${error.error}`);
  }

  return response.json();
}

/**
 * Gets all conversations for a specific user
 * @param {string} userId - User identifier
 * @returns {Promise<object>} - List of conversations
 */
async function getUserConversations(userId) {
  const response = await fetch(
    `http://localhost:3000/api/conversations?user_id=${userId}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get user conversations: ${error.error}`);
  }

  return response.json();
}

// Example usage
async function exampleInteraction() {
  try {
    // Start a conversation with the merchant
    console.log("Starting conversation with merchant...");
    const newConversation = await startConversation("user123", "merchant-8901");
    const conversationId = newConversation.conversation_id;
    console.log(`Conversation started with ID: ${conversationId}`);

    // Send a message and get response
    console.log("Sending message...");
    const messageResponse = await sendMessage(
      conversationId,
      "Do you have any healing potions?"
    );

    // Extract the NPC's response
    const npcMessage = messageResponse.data.messages
      .filter((m) => m.role === "assistant")
      .pop();
    console.log(`Merchant: ${npcMessage.content}`);

    // Send another message
    console.log("Sending follow-up message...");
    const followUpResponse = await sendMessage(
      conversationId,
      "That's too expensive! Can you give me a discount?"
    );

    // Extract the NPC's follow-up response
    const followUpMessage = followUpResponse.data.messages
      .filter((m) => m.role === "assistant")
      .pop();
    console.log(`Merchant: ${followUpMessage.content}`);

    // Get full conversation history
    console.log("Getting full conversation history...");
    const history = await getConversation(conversationId);
    console.log("Full conversation:", history.data.messages);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the example
exampleInteraction();
