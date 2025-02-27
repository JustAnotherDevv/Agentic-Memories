// Example of how to call the API from client-side JavaScript
const callAgentAPI = async (prompt, conversationHistory = []) => {
  try {
    const response = await fetch(
      "http://localhost:3000/api/agent/battleHardened",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          conversationHistory,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling agent API:", error);
    throw error;
  }
};

// Usage example
let conversationHistory = [
  //   { role: "user", content: "Hello, I need help with your product." },
  //   {
  //     role: "assistant",
  //     content:
  //       "Hi there! I'd be happy to help. What specific issue are you having with our product?",
  //   },
];

const handleUserMessage = async (userMessage) => {
  try {
    // Add user message to history
    conversationHistory.push({ role: "user", content: userMessage });

    // Call API
    const result = await callAgentAPI(userMessage, conversationHistory);

    // Add assistant response to history
    conversationHistory.push({ role: "assistant", content: result.response });

    // Return the response
    return result.response;
  } catch (error) {
    console.error("Error handling message:", error);
    return "Sorry, there was an error processing your request.";
  }
};

const mainTest = async (userMessage) => {
  try {
    const res = await handleUserMessage(userMessage);
    console.log(res);
  } catch (error) {
    console.error("Error handling message:", error);
    // return "Sorry, there was an error processing your request.";
  }
};

mainTest(
  "hey, how to improve my sales performance? Give me short minimal reply"
);
