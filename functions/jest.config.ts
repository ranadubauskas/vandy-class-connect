module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    extensionsToTreatAsEsm: ['.ts'],
    testPathIgnorePatterns: [
        "/src/tests/pocketbase.ts" // Example: Ignore a specific file
      ],
  };