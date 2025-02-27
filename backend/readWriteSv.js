import { SecretVaultWrapper } from "secretvaults";
import { v4 as uuidv4 } from "uuid";
import { orgConfig } from "./orgConfig.js";

const SCHEMA_ID = "8a046c8a-a359-4a2e-a9d8-79fe4fb14c67";

const npcDialogData = [
  {
    _id: uuidv4(),
    session_info: {
      timestamp: new Date().toISOString(),
      user_id: "user-123456",
      npc_id: "merchant-8901",
    },
    messages: [
      {
        role: "assistant",
        content:
          "Welcome to my shop, traveler! Looking for something special today?",
        timestamp: new Date().toISOString(),
      },
      {
        role: "user",
        content: "I need potions for my journey to the northern mountains.",
        timestamp: new Date(Date.now() + 5000).toISOString(),
      },
    ],
  },
];

async function main() {
  try {
    const collection = new SecretVaultWrapper(
      orgConfig.nodes,
      orgConfig.orgCredentials,
      SCHEMA_ID
    );
    await collection.init();

    // const dataWritten = await collection.writeToNodes(npcDialogData);
    // console.log("dataWritten", dataWritten);

    // const newIds = [
    //   ...new Set(dataWritten.map((item) => item.data.created).flat()),
    // ];
    // console.log("created ids:", newIds);

    const dataRead = await collection.readFromNodes({});
    console.log("📚 total records:", dataRead.length);
    console.log(
      "📚 Read new records:",
      dataRead.slice(0, npcDialogData.length)
    );

    // console.log(dataRead[dataRead.length - 1]);
    console.log(dataRead[0]);
  } catch (error) {
    console.error("❌ Failed to use SecretVaultWrapper:", error.message);
    process.exit(1);
  }
}

main();
