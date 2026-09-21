// convex/auth.config.ts
const authConfig = {
  providers: [
    {
      domain: "https://adapting-redbird-7169.clerk.accounts.dev",
      applicationID: "convex", // ← must be "convex", not a dynamic env var
    },
  ],
};

export default authConfig;
