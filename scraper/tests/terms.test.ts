// tests/terms.test.ts

import { expect, jest, test } from '@jest/globals';
import termScraper from '../src/functions/term-scraper';

// Mock dependencies
const mockClient = {
  collection: () => ({
    create: jest.fn().mockResolvedValue({}),
  }),
};

const mockAuthenticateClient = jest.fn().mockResolvedValue(undefined);

const mockYesApi = {
  getTerms: (callback) => {
    const mockTerms = [];
    for (let i = 0; i < 20; i++) {
      const mockTerm = {
        id: `mock_term_id_${i}`,
        title: `Term ${i}`,
      };
      mockTerms.push(mockTerm);
    }
    // Simulate async calls to the callback
    mockTerms.forEach((term, index) => {
      setTimeout(() => {
        callback(term, Date.now());
      }, 10 * index); // Slight delay between each callback
    });
  },
};

/**
 * Ensures that the term scraper function works and returns the correct data
 */
test('Terms have properties', async () => {
  const terms = await termScraper.execute(
    {
      limit: 1,
      save: false,
    },
    {
      yesApi: mockYesApi,
    }
  );

  const term = terms[0];

  expect(term).toHaveProperty('id');
  expect(term).toHaveProperty('title');

  expect(term.id).toHaveLength(15);
  expect(term.title).not.toBeNull();
}, 1000 * 60);

/**
 * Ensures that the term scraper function limits the number of terms
 */
test('Terms are limited', async () => {
  let terms = await termScraper.execute(
    {
      limit: 5,
      save: false,
    },
    {
      yesApi: mockYesApi,
    }
  );

  expect(terms).toHaveLength(5);

  terms = await termScraper.execute(
    {
      limit: 10,
      save: false,
    },
    {
      yesApi: mockYesApi,
    }
  );

  expect(terms).toHaveLength(10);

  terms = await termScraper.execute(
    {
      limit: 15,
      save: false,
    },
    {
      yesApi: mockYesApi,
    }
  );

  expect(terms).toHaveLength(15);
}, 1000 * 60);

/**
 * Ensures that the term scraper function sorts the terms
 */
test('Terms are sorted', async () => {
  const terms = await termScraper.execute(
    {
      limit: 5,
      save: false,
    },
    {
      yesApi: mockYesApi,
    }
  );

  for (let i = 0; i < terms.length - 1; i++) {
    expect(terms[i].title.localeCompare(terms[i + 1].title)).toBeLessThanOrEqual(0);
  }
}, 1000 * 60);

/**
 * Ensures that the term scraper function saves terms when save is true
 */
test('Terms are saved when save is true', async () => {
  const createMock = jest.fn().mockResolvedValue({});

  const mockClientWithCreateMock = {
    collection: () => ({
      create: createMock,
    }),
  };

  await termScraper.execute(
    {
      limit: 2,
      save: true,
    },
    {
      yesApi: mockYesApi,
      client: mockClientWithCreateMock,
      authenticateClient: mockAuthenticateClient,
    }
  );

  expect(createMock).toHaveBeenCalledTimes(2);
}, 1000 * 60);

/**
 * Ensures that the parseArguments function works correctly
 */
test('parseArguments returns correct defaults', () => {
  // Mock process.argv
  const originalArgv = process.argv;
  process.argv = ['node', 'script.js'];

  const args = termScraper.parseArguments();

  expect(args.save).toBe(false);
  expect(args.limit).toBe(Number.MAX_VALUE);

  process.argv = originalArgv;
});

/**
 * Ensures that parseArguments parses provided arguments correctly
 */
test('parseArguments parses provided arguments', () => {
  // Mock process.argv
  const originalArgv = process.argv;
  process.argv = ['node', 'script.js', '--save', '--limit', '10'];

  const args = termScraper.parseArguments();

  expect(args.save).toBe(true);
  expect(args.limit).toBe(10);

  process.argv = originalArgv;
});
