// src/functions/course-scraper.ts

import minimist from "minimist";
import { nanoid } from "nanoid";
import { IFunction } from "../types/functions";
import { YesCourseResponse, YesSectionResponse } from "../types/yes-api";

/**
 * CLI Arguments for the Course Scraper function
 */
export interface CourseScraperArguments {
  save: boolean;
  limit: number;
  term: string;
}

export default {
  /**
   * Parses the arguments from the CLI to be used in the function
   * @returns CourseScraperArguments
   */
  parseArguments() {
    const argv = minimist(process.argv.slice(2), {
      boolean: ["save"],
      string: ["term", "limit"],
      default: {
        save: false,
        limit: Number.MAX_VALUE.toString(),
        term: "1040",
      },
    });

    return {
      save: argv.save,
      limit: Number(argv.limit),
      term: argv.term as string,
    } satisfies CourseScraperArguments;
  },

  /**
   * Executes the Course Scraper function to get courses from YES
   * @param args CourseScraperArguments
   * @param dependencies Optional dependencies for testing
   * @returns YesCourseResponse[]
   */
  async execute(
    args: CourseScraperArguments,
    dependencies?: {
      yes?: typeof import("@vanderbilt/yes-api");
      client?: typeof import("../pocketbase").default;
      authenticateClient?: typeof import("../pocketbase").authenticateClient;
    }
  ) {
    // Use the provided dependencies or default to actual modules
    const yes = dependencies?.yes ?? (await import("@vanderbilt/yes-api"));
    const client = dependencies?.client ?? (await import("../pocketbase")).default;
    const authenticateClient =
      dependencies?.authenticateClient ?? (await import("../pocketbase")).authenticateClient;

    let courses: YesCourseResponse[] = [];

    const getSectionsPromise = new Promise<YesCourseResponse[]>((resolve) => {
      yes.getAllSections(
        {
          id: args.term,
          title: "",
        },
        false,
        (section: YesSectionResponse, timestamp: unknown) => {
          if (courses.length >= args.limit) {
            resolve(courses);
            return;
          }

          courses.push(section.course);
        }
      );
    });

    const limitPromise = new Promise<YesCourseResponse[]>((resolve) => {
      setInterval(() => {
        if (courses.length >= args.limit) {
          resolve(courses);
        }
      }, 1000);
    });

    await Promise.race([getSectionsPromise, limitPromise]);

    //  Add IDs to the courses, sort them, and limit them
    courses = courses
      .map((course) => ({
        ...course,
        id: nanoid(15),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, args.limit);

    //  Save the courses to the database
    if (args.save) {
      await authenticateClient();

      const promises = courses.map((course, index) => {
        return new Promise<void>((resolve, reject) => {
          //  Important: A timeout is needed to prevent 429
          setTimeout(async () => {
            try {
              console.log(`Saving course: ${course.name}`);

              await client.collection("courses").create(course);

              resolve();
            } catch (error) {
              console.error(JSON.stringify(error, null, 2));

              reject(error);
            }
          }, index * 250);
        });
      });

      await Promise.all(promises);
    }

    return courses;
  },
} satisfies IFunction<CourseScraperArguments, YesCourseResponse[]>;
