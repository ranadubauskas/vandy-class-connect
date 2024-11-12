// tests/courses.test.ts

import { expect, jest, test } from '@jest/globals';
import courseScraper from '../src/functions/course-scraper';

// Mock dependencies
const createMock = jest.fn().mockResolvedValue({});
const mockClient = {
  collection: () => ({
    create: createMock,
  }),
};

const mockAuthenticateClient = jest.fn().mockResolvedValue(undefined);

const mockYesApi = {
  getAllSections: (term, includeDetails, callback) => {
    const mockSections = [];
    for (let i = 0; i < 20; i++) {
      const mockSection = {
        course: {
          id: `mock_course_id_${i}`,
          subject: 'CS',
          abbreviation: `CS101${i}`,
          name: `Introduction to Computer Science ${i}`,
        },
        // Add other necessary properties if needed
      };
      mockSections.push(mockSection);
    }
    // Simulate async calls to the callback
    mockSections.forEach((section, index) => {
      setTimeout(() => {
        callback(section, Date.now());
      }, 10 * index); // Slight delay between each callback
    });
  },
};

/**
 * Ensures that the course scraper function works and returns the correct data
 */
test('Courses have properties', async () => {
  const courses = await courseScraper.execute(
    {
      limit: 1,
      save: false,
      term: '1040',
    },
    {
      yes: mockYesApi,
    }
  );

  const course = courses[0];

  expect(course).toHaveProperty('id');
  expect(course).toHaveProperty('name');
  expect(course).toHaveProperty('subject');
  expect(course).toHaveProperty('abbreviation');

  expect(course.id).toHaveLength(15);
  expect(course.name).not.toBeNull();
  expect(course.subject).not.toBeNull();
  expect(course.abbreviation).not.toBeNull();
}, 1000 * 30);

/**
 * Ensures that the course scraper function limits the number of courses
 */
test('Courses are limited', async () => {
  let courses = await courseScraper.execute(
    {
      limit: 5,
      save: false,
      term: '1040',
    },
    {
      yes: mockYesApi,
    }
  );

  expect(courses).toHaveLength(5);

  courses = await courseScraper.execute(
    {
      limit: 10,
      save: false,
      term: '1040',
    },
    {
      yes: mockYesApi,
    }
  );

  expect(courses).toHaveLength(10);

  courses = await courseScraper.execute(
    {
      limit: 15,
      save: false,
      term: '1040',
    },
    {
      yes: mockYesApi,
    }
  );

  expect(courses).toHaveLength(15);
}, 1000 * 30);

/**
 * Ensures that the course scraper function sorts the courses
 */
test('Courses are sorted', async () => {
  const courses = await courseScraper.execute(
    {
      limit: 5,
      save: false,
      term: '1040',
    },
    {
      yes: mockYesApi,
    }
  );

  for (let i = 0; i < courses.length - 1; i++) {
    expect(courses[i].name.localeCompare(courses[i + 1].name)).toBeLessThanOrEqual(0);
  }
}, 1000 * 30);

/**
 * Ensures that the course scraper function saves courses when save is true
 */
test('Courses are saved when save is true', async () => {
  // Reset the mock call count
  createMock.mockClear();

  await courseScraper.execute(
    {
      limit: 2,
      save: true,
      term: '1040',
    },
    {
      yes: mockYesApi,
      client: mockClient,
      authenticateClient: mockAuthenticateClient,
    }
  );

  expect(createMock).toHaveBeenCalledTimes(2);
}, 1000 * 30);

/**
 * Ensures that the parseArguments function works correctly
 */
test('parseArguments returns correct defaults', () => {
  // Mock process.argv
  const originalArgv = process.argv;
  process.argv = ['node', 'script.js'];

  const args = courseScraper.parseArguments();

  expect(args.save).toBe(false);
  expect(args.limit).toBe(Number.MAX_VALUE);
  expect(args.term).toBe('1040');

  process.argv = originalArgv;
});

/**
 * Ensures that parseArguments parses provided arguments correctly
 */
test('parseArguments parses provided arguments', () => {
  // Mock process.argv
  const originalArgv = process.argv;
  process.argv = ['node', 'script.js', '--save', '--limit', '10', '--term', '1020'];

  const args = courseScraper.parseArguments();

  expect(args.save).toBe(true);
  expect(args.limit).toBe(10);
  expect(args.term).toBe('1020');

  process.argv = originalArgv;
});
