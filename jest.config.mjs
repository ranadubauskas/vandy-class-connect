import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: './',
});

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
    transformIgnorePatterns: [
        'node_modules/(?!pocketbase).+\\.(js|jsx|mjs|cjs|ts|tsx)$',
    ],
    moduleNameMapper: {
        '^next/navigation$': '<rootDir>/__mocks__/next-navigation.ts',
        '^pocketbase$': '<rootDir>/__mocks__/pocketbase.ts',
        '^@/(.*)$': '<rootDir>/src/$1',
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
    // Exclude .history/ directory from tests
    testPathIgnorePatterns: ['<rootDir>/.history/', '<rootDir>/node_modules/'],
};

// Export as an ES module
export default createJestConfig(customJestConfig);
