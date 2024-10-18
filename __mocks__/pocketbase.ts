module.exports = function PocketBase() {
    return {
        collection: () => ({
          authWithPassword: jest.fn().mockResolvedValue({
            record: {
                id: 'test-user',
                email: 'test@example.com'
            },
            token: 'test-token',
          }),
          create: jest.fn().mockResolvedValue({ /* mock response */ }),
          getFullList: jest.fn().mockResolvedValue([/* mock response */]),
        }),
      };
}