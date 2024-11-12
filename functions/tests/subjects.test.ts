import { test, expect, jest } from '@jest/globals';
import subjectScraper from '../src/functions/subject-scraper';
import { client } from '../src/pocketbase';

/**
 * Ensures that the subject scraper function works and returns the correct data
 */
test('Subjects have properties', async () => {
  const subjects = await subjectScraper.execute({
    limit: 1,
    save: false,
  });

  const subject = subjects[0];

  expect(subject).toHaveProperty('id');
  expect(subject).toHaveProperty('name');

  expect(subject.id).toHaveLength(15);
  expect(subject.name).not.toBeNull();
}, 1000 * 30);

/**
 * Ensures that the subject scraper function limits the number of subjects
 */
test('Subjects are limited', async () => {
  let subjects = await subjectScraper.execute({
    limit: 3,
    save: false,
  });

  expect(subjects).toHaveLength(3);

  subjects = await subjectScraper.execute({
    limit: 5,
    save: false,
  });

  expect(subjects).toHaveLength(5);

  subjects = await subjectScraper.execute({
    limit: 10,
    save: false,
  });

  expect(subjects).toHaveLength(10);
}, 1000 * 30);

/**
 * Ensures that the subject scraper function sorts the subjects
 */
test('Subjects are sorted', async () => {
  const subjects = await subjectScraper.execute({
    limit: 5,
    save: false,
  });

  for (let i = 0; i < subjects.length - 1; i++) {
    expect(subjects[i].name.localeCompare(subjects[i + 1].name)).toBeLessThanOrEqual(0);
  }
}, 1000 * 30);

/**
 * Ensures that the subject scraper function saves subjects when save is true
 */
test('Subjects are saved when save is true', async () => {
  // Mock the database client
  const createMock = jest.spyOn(client.collection('subjects'), 'create').mockImplementation(async () => {
    return Promise.resolve();
  });

  await subjectScraper.execute({
    limit: 2,
    save: true,
  });

  expect(createMock).toHaveBeenCalledTimes(2);

  createMock.mockRestore();
}, 1000 * 30);

/**
 * Ensures that the parseArguments function works correctly
 */
test('parseArguments returns correct defaults', () => {
  // Mock process.argv
  const originalArgv = process.argv;
  process.argv = ['node', 'script.js'];

  const args = subjectScraper.parseArguments();

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

  const args = subjectScraper.parseArguments();

  expect(args.save).toBe(true);
  expect(args.limit).toBe(10);

  process.argv = originalArgv;
});
