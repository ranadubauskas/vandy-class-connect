import * as yes from "@vanderbilt/yes-api"
import { nanoid } from "nanoid"
import { parseArgs } from "util"
import client from "../pocketbase"
import { IFunction } from "../types/functions"
import { YesCourseResponse, YesSectionResponse } from "../types/yes-api"

/**
 * CLI Arguments for the Course Scraper function
 */
export interface CourseScraperArguments {
  save: boolean
  limit: number
  term: string
}

export default {
  /**
   * Parses the arguments from the CLI to be used in the function
   * @returns CourseScraperArguments
   */
  parseArguments() {
    const {
      values,
      positionals
    } = parseArgs({
      options: {
        /**
         * Whether or not to save the courses to the database
         */
        save: {
          type: 'boolean',
          default: false
        },
        /**
         * The maximum number of courses to return/save
         */
        limit: {
          type: 'string',
          default: Number.MAX_VALUE.toString()
        },
        /**
         * The term to scrape courses from the YES API
         */
        term: {
          type: 'string',
          default: "1040",
          /**
           * Please note that these are the Term IDs. 1040 is the most recent term,
           * Spring 2025 with 1015 being the oldest, Fall 2023.
           */
          choices: ["1015", "1020", "1025", "1030", "1035", "1040"]
        }
      },
      strict: false
    })

    return {
      save: Boolean(values.save),
      limit: Number(values.limit),
      term: values.term as string
    } satisfies CourseScraperArguments
  },
  /**
   * Executes the Course Scraper function to get courses from YES
   * @param args CourseScraperArguments
   * @returns YesCourseResponse[]
   */
  async execute(args: CourseScraperArguments) {
    let courses: YesCourseResponse[] = []

    const getSectionsPromise = new Promise<YesCourseResponse[]>((resolve) => {
      yes.getAllSections(
        {
          id: args.term,
          title: ""
        },
        false,
        (section: YesSectionResponse, timestamp: unknown) => {
          if (courses.length >= args.limit) {
            resolve(courses)
            return
          }

          courses.push(section.course)
        }
      )
    })

    const limitPromise = new Promise<YesCourseResponse[]>((resolve) => {
      setInterval(() => {
        if (courses.length >= args.limit) {
          resolve(courses)
        }
      }, 1000)
    })

    await Promise.race([getSectionsPromise, limitPromise])

    //  Add IDs to the courses, sort them, and limit them
    courses = courses
      .map(course => ({
        ...course,
        id: nanoid(15),
      }))
      .toSorted((a, b) => a.name.localeCompare(b.name))
      .toSpliced(args.limit)

    //  Save the courses to the database
    if (args.save) {
      let index = 0

      const promises = courses.map((course, index) => {
        return new Promise<void>((resolve, reject) => {
         //  Important: A timeout is needed to prevent 429
          const timeout = setTimeout(async () => {
            try {
              console.log(`Saving course: ${course.name}`)
              
              await client.collection('courses').create(course)
              
              resolve()
            } catch (error) {
              console.error(JSON.stringify(error, null, 2))

              reject(error)
            }
          }, index++ * 250)
        });
      })

      await Promise.all(promises)
    }

    return courses
  }
} satisfies IFunction<CourseScraperArguments, YesCourseResponse[]>