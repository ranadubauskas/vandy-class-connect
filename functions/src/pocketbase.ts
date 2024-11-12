// src/pocketbase.ts

import PocketBase, { AsyncAuthStore } from "pocketbase";
import settings from "./settings";

const { url } = settings.pocketbase;

/**
 * InMemoryStorageAdapter implements the required methods for AsyncAuthStore.
 */
class InMemoryStorageAdapter implements AsyncAuthStore.StorageAdapter {
  authToken: any = null;
  authModel: any = null;

  save = async (token: string, model: any) => {
    this.authToken = token;
    this.authModel = model;
  };

  clear = async () => {
    this.authToken = null;
    this.authModel = null;
  };

  load = async () => {
    if (this.authToken && this.authModel) {
      return {
        token: this.authToken,
        model: this.authModel,
      };
    }
    return null;
  };
}


// Create a new PocketBase client with the custom storage adapter
const storageAdapter = new InMemoryStorageAdapter();
const store = new AsyncAuthStore(storageAdapter);
const client = new PocketBase(url, store);

client.autoCancellation(false);

/**
 * Authenticates the PocketBase client with username and password
 * @param clientInstance Optional client instance for testing
 */
export async function authenticateClient(clientInstance = client) {
  const { username, password } = settings.pocketbase; // Access credentials at runtime
  try {
    await clientInstance.collection("users").authWithPassword(username, password);
    console.log("Authenticated successfully");
  } catch (error) {
    console.error("Authentication failed", error);
    throw error; // Propagate the error if authentication fails
  }
}

export { client, InMemoryStorageAdapter };
