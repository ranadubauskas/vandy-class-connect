import { test } from "@jest/globals";
import courseScraper from "../src/functions/course-scraper";

/**
 * Ensures that the course scraper function works returns the correct data
 */
test("Courses have properties", async () => {
  const courses = await courseScraper.execute({
    limit: 1,
    save: false,
    term: "1040"
  })

  const course = courses[0]

  expect(course).toHaveProperty("id")
  expect(course).toHaveProperty("name")
  expect(course).toHaveProperty("subject")
  expect(course).toHaveProperty("abbreviation")
  expect(course).toHaveProperty("name")

  expect(course.id).toHaveLength(15)
  expect(course.name).not.toBeNull()
  expect(course.subject).not.toBeNull()
  expect(course.abbreviation).not.toBeNull()
  expect(course.name).not.toBeNull()
})

/**
 * Ensures that the course scraper function works returns the correct data
 */
test("Courses are limited", async () => {
  let courses = await courseScraper.execute({
    limit: 5,
    save: false,
    term: "1040"
  })

  expect(courses).toHaveLength(5)

  courses = await courseScraper.execute({
    limit: 10,
    save: false,
    term: "1040"
  })

  expect(courses).toHaveLength(10)

  courses = await courseScraper.execute({
    limit: 15,
    save: false,
    term: "1040"
  })

  expect(courses).toHaveLength(15)
})

/**
 * Ensures that the course scraper function sorts the courses
 */
test("Courses are sorted", async () => {
  const courses = await courseScraper.execute({
    limit: 5,
    save: false,
    term: "1040"
  })

  for (let i = 0; i < courses.length - 1; i++) {
    expect(courses[i].name.localeCompare(courses[i + 1].name)).toBeLessThan(0);
  }
})