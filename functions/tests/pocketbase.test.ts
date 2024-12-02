import { afterAll, expect, test } from '@jest/globals';
import { AsyncAuthStore } from 'pocketbase';
import { authenticateClient, InMemoryStorageAdapter } from '../src/pocketbase';
import settings from '../src/settings';

// Save original settings
const originalSettings = { ...settings };

// Mock PocketBase client
// Mock PocketBase client
class MockPocketBase {
    authStore: AsyncAuthStore;

    constructor(url: string, storageAdapter: InMemoryStorageAdapter) {
        this.authStore = new AsyncAuthStore(storageAdapter);
    }

    autoCancellation(value: boolean) {
        // Mock implementation
    }

    // Admin authentication mock
    admins = {
        authWithPassword: async (username: string, password: string) => {
            if (username === 'testuser' && password === 'testpassword') {
                // Simulate successful authentication
                const token = 'testtoken';
                const model = { id: 'testuser' };
                // Simulate saving the token and model in the authStore
                await this.authStore.save(token, model);
                return { token, admin: model };
            } else {
                // Simulate authentication failure
                throw new Error('Invalid credentials');
            }
        },
    };

    // If needed, keep the collection method for other tests
    collection(name: string) {
        return {
            authWithPassword: this.authWithPassword,
        };
    }
}


test('authenticateClient succeeds with correct credentials', async () => {
    // Set correct admin credentials
    settings.pocketbase.admin_username = 'testuser';
    settings.pocketbase.admin_password = 'testpassword';

    // Create mock client
    const mockStorageAdapter = new InMemoryStorageAdapter();
    const mockClient = new MockPocketBase(settings.pocketbase.url, mockStorageAdapter);

    // Override console.log
    const originalConsoleLog = console.log;
    let consoleOutput = '';
    console.log = (message: string) => {
        consoleOutput += message;
    };

    await expect(authenticateClient(mockClient)).resolves.toBeUndefined();

    expect(consoleOutput).toContain('Authenticated successfully');

    // Restore console.log
    console.log = originalConsoleLog;
});


test('authenticateClient fails with incorrect credentials', async () => {
    // Set incorrect admin credentials
    settings.pocketbase.admin_username = 'wronguser';
    settings.pocketbase.admin_password = 'wrongpassword';

    // Create mock client
    const mockStorageAdapter = new InMemoryStorageAdapter();
    const mockClient = new MockPocketBase(settings.pocketbase.url, mockStorageAdapter);

    // Override console.error
    const originalConsoleError = console.error;
    let consoleErrorOutput = '';
    console.error = (message: string, error: Error) => {
        consoleErrorOutput += message;
    };

    await expect(authenticateClient(mockClient)).rejects.toThrow('Invalid credentials');

    expect(consoleErrorOutput).toContain('Authentication failed');

    // Restore console.error
    console.error = originalConsoleError;
});

test('InMemoryStorageAdapter saves and clears tokens', async () => {
    const storageAdapter = new InMemoryStorageAdapter();

    const token = 'testtoken';
    const model = { id: 'testuser' };
    await storageAdapter.save(token, model);

    expect(storageAdapter.authToken).toBe(token);
    expect(storageAdapter.authModel).toBe(model);

    await storageAdapter.clear();

    expect(storageAdapter.authToken).toBeNull();
    expect(storageAdapter.authModel).toBeNull();
});

test('InMemoryStorageAdapter load returns token and model when both are set', async () => {
    const storageAdapter = new InMemoryStorageAdapter();

    const token = 'testtoken';
    const model = { id: 'testuser' };
    await storageAdapter.save(token, model);

    const result = await storageAdapter.load();

    expect(result).toEqual({
        token: token,
        model: model,
    });
});

test('InMemoryStorageAdapter load returns null when both token and model are null', async () => {
    const storageAdapter = new InMemoryStorageAdapter();

    // Do not set authToken and authModel
    const result = await storageAdapter.load();

    expect(result).toBeNull();
});

test('InMemoryStorageAdapter load returns null when only authToken is set', async () => {
    const storageAdapter = new InMemoryStorageAdapter();

    storageAdapter.authToken = 'testtoken';
    storageAdapter.authModel = null;

    const result = await storageAdapter.load();

    expect(result).toBeNull();
});

test('InMemoryStorageAdapter load returns null when only authModel is set', async () => {
    const storageAdapter = new InMemoryStorageAdapter();

    storageAdapter.authToken = null;
    storageAdapter.authModel = { id: 'testuser' };

    const result = await storageAdapter.load();

    expect(result).toBeNull();
});

// Restore settings after tests
afterAll(() => {
    settings.pocketbase = { ...originalSettings.pocketbase };
});
