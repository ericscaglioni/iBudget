import { initializeUserDefaults } from "@/lib/server/utils/initializeUserDefaults";
import { profileFromClerkUser, upsertUserProfile } from "@/lib/server/utils/users";
import { createClerkClient } from "@clerk/backend";

const PAGE_SIZE = 100;

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

async function listClerkUsers() {
  const users = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await clerkClient.users.getUserList({ limit: PAGE_SIZE, offset });
    users.push(...page.data);
    if (page.data.length < PAGE_SIZE || users.length >= page.totalCount) break;
  }
  return users;
}

async function main() {
  if (!process.env.CLERK_SECRET_KEY) {
    console.log("initialize-existing-users: CLERK_SECRET_KEY is missing, skipping");
    return;
  }

  console.log("Fetching Clerk users...");
  const users = await listClerkUsers();
  console.log(`Found ${users.length} Clerk user(s).`);

  for (const user of users) {
    await upsertUserProfile(profileFromClerkUser(user));
    await initializeUserDefaults(user.id);
  }

  console.log("Done initializing existing users.");
}

main().catch((err) => {
  console.error("Error running initialize script:", err);
  process.exit(1);
});
