import type { NextConfig } from "next";

// No generated agent instruction files in the repository.
const config: NextConfig = {
  basePath: "/feedbacks",
  output: "standalone",
  agentRules: false,
};

export default config;
