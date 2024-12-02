/**
 * Global settings for the functions application
 */
export interface ISettings {
  pocketbase: {
    url: string;
    username: string;
    password: string;
    admin_username: string;
    admin_password: string;
  };
}

export default {
  pocketbase: {
    url: process.env.POCKETBASE_URL,
    username: process.env.POCKETBASE_USERNAME,
    password: process.env.POCKETBASE_PASSWORD,
    admin_username: process.env.POCKETBASE_ADMIN_USERNAME,
    admin_password: process.env.POCKETBASE_ADMIN_PASSWORD,
  }
} satisfies ISettings