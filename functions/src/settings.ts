/**
 * Global settings for the functions application
 */
export interface ISettings {
  pocketbase: {
    url: string
    username: string
    password: string
  }
}

export default {
  pocketbase: {
    url: process.env.POCKETBASE_URL,
    username: process.env.POCKETBASE_USERNAME,
    password: process.env.POCKETBASE_PASSWORD
  }
} satisfies ISettings