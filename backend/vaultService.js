import { SecretVaultWrapper } from "secretvaults";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { orgConfig } from "./orgConfig.js";

dotenv.config();

const SCHEMA_ID = process.env.SCHEMA_ID;
// const VAULT_NODES = process.env.SECRETVAULT_NODES?.split(",") || [];
// const VAULT_CREDENTIALS = process.env.SECRETVAULT_CREDENTIALS;

class VaultService {
  constructor() {
    this.collection = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // if (!SCHEMA_ID || !VAULT_NODES.length || !VAULT_CREDENTIALS) {
    //   throw new Error("SecretVault configuration missing");
    // }

    try {
      //   this.collection = new SecretVaultWrapper(
      //     VAULT_NODES,
      //     VAULT_CREDENTIALS,
      //     SCHEMA_ID
      //   );
      this.collection = new SecretVaultWrapper(
        orgConfig.nodes,
        orgConfig.orgCredentials,
        SCHEMA_ID
      );
      await this.collection.init();
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize SecretVault:", error);
      throw new Error("SecretVault initialization failed");
    }
  }

  async saveConversation(userId, npcId, messages) {
    await this.ensureInitialized();

    const sessionData = {
      _id: uuidv4(),
      session_info: {
        timestamp: new Date().toISOString(),
        user_id: userId,
        npc_id: npcId,
      },
      messages: messages.map((msg) => ({
        ...msg,
        timestamp: msg.timestamp || new Date().toISOString(),
      })),
    };

    try {
      const result = await this.collection.writeToNodes([sessionData]);
      const newIds = [
        ...new Set(result.map((item) => item.data.created).flat()),
      ];

      if (newIds.length === 0) {
        throw new Error("Failed to store conversation");
      }

      return sessionData._id;
    } catch (error) {
      console.error("Error saving conversation:", error);
      throw new Error("Failed to encrypt and store conversation");
    }
  }

  async getConversationsByUser(userId) {
    await this.ensureInitialized();

    try {
      const records = await this.collection.readFromNodes({
        "session_info.user_id": userId,
      });

      return records.sort((a, b) => {
        const dateA = new Date(a.session_info.timestamp);
        const dateB = new Date(b.session_info.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error("Error retrieving conversations:", error);
      throw new Error("Failed to retrieve conversations");
    }
  }

  async getConversationsByNpc(userId, npcId) {
    await this.ensureInitialized();

    try {
      const records = await this.collection.readFromNodes({
        "session_info.user_id": userId,
        "session_info.npc_id": npcId,
      });

      return records.sort((a, b) => {
        const dateA = new Date(a.session_info.timestamp);
        const dateB = new Date(b.session_info.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error("Error retrieving conversations:", error);
      throw new Error("Failed to retrieve conversations");
    }
  }

  async getConversationById(conversationId) {
    await this.ensureInitialized();

    try {
      const records = await this.collection.readFromNodes({
        _id: conversationId,
      });

      if (records.length === 0) {
        throw new Error("Conversation not found");
      }

      return records[0];
    } catch (error) {
      console.error("Error retrieving conversation:", error);
      throw new Error("Failed to retrieve conversation");
    }
  }

  async deleteConversation(conversationId) {
    await this.ensureInitialized();

    try {
      await this.collection.deleteFromNodes([conversationId]);
      return true;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw new Error("Failed to delete conversation");
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
  }

  isEnabled() {
    // return !!SCHEMA_ID && VAULT_NODES.length > 0 && !!VAULT_CREDENTIALS;
    return !!SCHEMA_ID;
  }
}

const vaultService = new VaultService();

export default vaultService;
