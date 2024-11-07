import { expect, test } from "@jest/globals"
import subjectScraper from "../src/functions/subject-scraper"

/**
 * Ensures that the subject scraper function works returns the correct data
 * types
 */
test("Subjects have properties", async () => {
  const subjects = await subjectScraper.execute({
    limit: 1,
    save: false
  })

  const subject = subjects[0]

  expect(subject).toHaveProperty("id")
  expect(subject).toHaveProperty("name")

  expect(subject.id).toHaveLength(15)
  expect(subject.name).not.toBeNull()
})

/**
 * Ensures that the subject scraper function limits the number of subjects
 * returned
 */
test("Subjects are limited", async () => {
  let subjects = await subjectScraper.execute({
    limit: 3,
    save: false
  })

  expect(subjects).toHaveLength(3)

  subjects = await subjectScraper.execute({
    limit: 5,
    save: false
  })

  expect(subjects).toHaveLength(5)

  subjects = await subjectScraper.execute({
    limit: 10,
    save: false
  })

  expect(subjects).toHaveLength(10)
})

/**
 * Ensures that the subject scraper function sorts the subjects
 */
test("Subjects are sorted", async () => {
  const subjects = await subjectScraper.execute({
    limit: 5,
    save: false
  })

  for (let i = 0; i < subjects.length - 1; i++) {
    expect(subjects[i].name.localeCompare(subjects[i + 1].name)).toBeLessThan(0);
  }
})