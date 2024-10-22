import { test } from "@jest/globals"
import termScraper from "../src/functions/term-scraper"

/**
 * Ensures that the term scraper function works returns the correct data
 */
test("Terms have properties", async () => {
  const terms = await termScraper.execute({
    limit: 1,
    save: false
  })

  const term = terms[0]

  expect(term).toHaveProperty("id")
  expect(term).toHaveProperty("title")

  expect(term.id).toHaveLength(15)
  expect(term.title).not.toBeNull()
})

/**
 * Ensures that the term scraper function limits the number of terms
 */
test("Terms are limited", async () => {
  let terms = await termScraper.execute({
    limit: 5,
    save: false
  })

  expect(terms).toHaveLength(5)

  terms = await termScraper.execute({
    limit: 10,
    save: false
  })

  expect(terms).toHaveLength(10)

  terms = await termScraper.execute({
    limit: 15,
    save: false
  })

  expect(terms).toHaveLength(15)
})

/**
 * Ensures that the term scraper function sorts the terms
 */
test("Terms are sorted", async () => {
  const terms = await termScraper.execute({
    limit: 5,
    save: false
  })

  for (let i = 0; i < terms.length - 1; i++) {
    expect(terms[i].title.localeCompare(terms[i + 1].title)).toBeLessThan(0);
  }
})