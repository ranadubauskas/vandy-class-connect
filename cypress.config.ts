import { defineConfig } from "cypress";
import * as dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Pass environment variables to Cypress
      config.env.email = process.env.CYPRESS_EMAIL;
      config.env.password = process.env.CYPRESS_PASSWORD;
      config.env.loggedInUserId = process.env.USER_ID;
      config.env.baseUrl= process.env.BASE_URL;
      // Return updated configuration
      return config;
    },
  },
});