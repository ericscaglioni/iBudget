import { initializeUserDefaults } from "@/lib/server/utils/initializeUserDefaults";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

async function main() {
  console.log("🔍 Fetching Clerk users...");
  const { data: users } = await clerkClient.users.getUserList({ limit: 100 });

  console.log(`👥 Found ${users.length} user(s).`);

  for (const user of users) {
    console.log(`⚙️ Initializing defaults for ${user.id} (${user.emailAddresses[0]?.emailAddress})`);
    await initializeUserDefaults(user.id);
  }

  console.log("✅ Done initializing existing users.");
}

main().catch((err) => {
  console.error("❌ Error running initialize script:", err);
  process.exit(1);
});