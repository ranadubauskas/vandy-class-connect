/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require("next/jest");

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: './',
});

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js', "<rootDir>/setupTests.ts"],
    testEnvironment: 'jsdom',
    transformIgnorePatterns: [
        'node_modules/(?!pocketbase).+\\.(js|jsx|mjs|cjs|ts|tsx)$',
    ],
    moduleNameMapper: {
        '^next/navigation$': '<rootDir>/__mocks__/next-navigation.ts',
        '^pocketbase$': '<rootDir>/__mocks__/pocketbase.ts',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^(.*)\\.ts$': '$1.ts'
    },
    diagnostics: false,
    globals: {
        'ts-jest': {
            diagnostics: false,
        },
    },
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
    // Exclude .history/ directory from tests
    testPathIgnorePatterns: ['<rootDir>/.history/', '<rootDir>/node_modules/', '<rootDir>/functions/'],
};

// Export as an ES module
module.exports = createJestConfig(customJestConfig);

