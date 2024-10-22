import PocketBase, { AsyncAuthStore } from "pocketbase"
import settings from "./settings";

//  Decompose the settings object to get the url, username, and password
const {
  url,
  username,
  password
} = settings.pocketbase

/**
 * InMemoryAuthStore is a class that extends AsyncAuthStore and is used to store the authentication
 * token for the PocketBase client in memory
 */
class InMemoryAuthStore extends AsyncAuthStore {
  constructor() {
    let authToken = null

    const config = {
      save: async (token) => {
        authToken = token
      },
      clear: async () => {
        authToken = null
      }
    }

    super(config)
  }
}

//  Create a new PocketBase client with the store
const store = new InMemoryAuthStore()
const client = new PocketBase(url, store)

//  Disable auto-cancellation for the client
client.autoCancellation(false)

//  Authenticate the client with the username and password
const data = await client.collection("users").authWithPassword(username, password);

export default client