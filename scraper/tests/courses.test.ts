import { expect, jest, test } from '@jest/globals';
import courseScraper from '../src/functions/course-scraper';

// Mock dependencies
const createMock = jest.fn().mockResolvedValue({});
const mockClient = {
  collection: jest.fn().mockReturnValue({
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
          abbreviation: `CS 101${i}`,
          name: `Introduction to Computer Science ${i}`,
        },
      };
      mockSections.push(mockSection);
    }

    mockSections.forEach((section, index) => {
      setTimeout(() => {
        callback(section, Date.now());
      }, 10 * index);
    });
  },
};

test('Courses have properties', async () => {
  const courses = await courseScraper.execute(
    {
      limit: 1,
      save: false,
      term: '1040',
      batchSize: 100,
      offset: 0,
    },
    {
      yes: mockYesApi,
    }
  );

  const course = courses[0];

  expect(course).toHaveProperty('name');
  expect(course).toHaveProperty('subject');
  expect(course).toHaveProperty('code');

  expect(course.name).not.toBeNull();
  expect(course.subject).not.toBeNull();
  expect(course.code).not.toBeNull();
}, 1000 * 30);

test('Courses are limited', async () => {
  let courses = await courseScraper.execute(
    {
      limit: 5,
      save: false,
      term: '1040',
      batchSize: 100,
      offset: 0,
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
      batchSize: 100,
      offset: 0,
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
      batchSize: 100,
      offset: 0,
    },
    {
      yes: mockYesApi,
    }
  );

  expect(courses).toHaveLength(15);
}, 1000 * 30);

test('Courses are sorted', async () => {
  const courses = await courseScraper.execute(
    {
      limit: 5,
      save: false,
      term: '1040',
      batchSize: 100,
      offset: 0,
    },
    {
      yes: mockYesApi,
    }
  );

  for (let i = 0; i < courses.length - 1; i++) {
    expect(courses[i].name.localeCompare(courses[i + 1].name)).toBeLessThanOrEqual(0);
  }
}, 1000 * 30);

test('Courses are saved when save is true', async () => {
  // Reset the mock call count
  createMock.mockClear();

  await courseScraper.execute(
    {
      limit: 2,
      save: true,
      term: '1040',
      batchSize: 100,
      offset: 0,
    },
    {
      yes: mockYesApi,
      client: mockClient,
      authenticateClient: mockAuthenticateClient,
    }
  );

  expect(createMock).toHaveBeenCalledTimes(2);
}, 1000 * 30);

test('parseArguments returns correct defaults', () => {
  const originalArgv = process.argv;
  process.argv = ['node', 'script.js'];

  const args = courseScraper.parseArguments();

  expect(args.save).toBe(false);
  expect(args.limit).toBeUndefined(); // Adjusted expectation
  expect(args.term).toBe('1040');

  process.argv = originalArgv;
});

test('parseArguments parses provided arguments', () => {
  const originalArgv = process.argv;
  process.argv = ['node', 'script.js', '--save', '--limit', '10', '--term', '1020'];

  const args = courseScraper.parseArguments();

  expect(args.save).toBe(true);
  expect(args.limit).toBe(10);
  expect(args.term).toBe('1020');

  process.argv = originalArgv;
});
