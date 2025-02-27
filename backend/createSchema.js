import { SecretVaultWrapper } from "secretvaults";
import { orgConfig } from "./orgConfig.js";
import fs from "fs";

const schema = JSON.parse(fs.readFileSync("./schema.json", "utf8"));

async function main() {
  try {
    const org = new SecretVaultWrapper(
      orgConfig.nodes,
      orgConfig.orgCredentials
    );
    await org.init();

    const newSchema = await org.createSchema(
      schema,
      "AI NPC Conversation Schema"
    );
    console.log("📚 New Schema:", newSchema);
  } catch (error) {
    console.error("❌ Failed to use SecretVaultWrapper:", error.message);
    process.exit(1);
  }
}

main();
