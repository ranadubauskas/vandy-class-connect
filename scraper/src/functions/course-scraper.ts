// src/functions/course-scraper.ts

import minimist from "minimist";
import { IFunction } from "../types/functions";
import { YesSectionResponse } from "../types/yes-api";
import { ClientResponseError } from "pocketbase";

/**
 * CLI Arguments for the Course Scraper function
 */
export interface CourseScraperArguments {
  save: boolean;
  limit: number;
  term: string;
  batchSize: number;
  offset: number;
}

const courseScraper: IFunction<CourseScraperArguments, any[]> = {
  /**
   * Parses the arguments from the CLI to be used in the function
   * @returns CourseScraperArguments
   */
  parseArguments() {
    const argv = minimist(process.argv.slice(2), {
      boolean: ["save"],
      string: ["term", "limit", "batchSize", "offset"],
      default: {
        save: false,
        limit: undefined, // We'll set this in execute method
        term: "1040",
        batchSize: "100", // Default batch size
        offset: "0",
      },
    });

    return {
      save: argv.save,
      limit: argv.limit ? Number(argv.limit) : undefined,
      term: argv.term as string,
      batchSize: Number(argv.batchSize),
      offset: Number(argv.offset),
    };
  },

  /**
   * Executes the Course Scraper function to get courses from YES
   * @param args CourseScraperArguments
   * @param dependencies Optional dependencies for testing
   * @returns Array of course objects
   */
  async execute(
    args: CourseScraperArguments,
    dependencies?: {
      yes?: typeof import("@vanderbilt/yes-api");
      client?: any; // Adjusted type for simplicity
      authenticateClient?: any;
    }
  ): Promise<any[]> {
    // Use the provided dependencies or default to actual modules
    const yes = dependencies?.yes ?? (await import("@vanderbilt/yes-api"));

    // Correctly use the client from dependencies if provided
    const client =
      dependencies?.client ?? (await import("../pocketbase")).client;

    // Correctly use authenticateClient from dependencies if provided
    const authenticateClient =
      dependencies?.authenticateClient ??
      (await import("../pocketbase")).authenticateClient;

    // Set the limit to offset + batchSize if not provided
    if (!args.limit) {
      args.limit = args.offset + args.batchSize;
    }

    console.log(
      `Starting course scraper with batchSize: ${args.batchSize}, offset: ${args.offset}, limit: ${args.limit}`
    );

    const coursesMap = new Map<
      string,
      { subject: string; abbreviation: string; name: string }
    >();

    // Fetch sections and collect unique courses
    await new Promise<void>((resolve) => {
      yes.getAllSections(
        {
          id: args.term,
          title: "",
        },
        false,
        (section: YesSectionResponse, timestamp: unknown) => {
          const course = section.course;
          const courseKey = `${course.subject} ${course.abbreviation}`; // Unique key

          if (!coursesMap.has(courseKey)) {
            coursesMap.set(courseKey, course);
          }

          if (coursesMap.size >= args.limit) {
            resolve();
            return;
          }
        }
      );
    });

    console.log(`Collected ${coursesMap.size} unique courses.`);

    // Convert the Map to an array
    let coursesArray = Array.from(coursesMap.values());

    // Map the courses to the desired format (without 'id')
    coursesArray = coursesArray.map((course) => ({
      name: course.name,
      code: course.abbreviation,
      subject: course.subject,
    }));

    // Sort the courses by name
    coursesArray = coursesArray.sort((a, b) => a.name.localeCompare(b.name));

    // Apply offset and batch size
    coursesArray = coursesArray.slice(
      args.offset,
      args.offset + args.batchSize
    );

    console.log(
      `Processing ${coursesArray.length} courses after applying offset and batchSize.`
    );

    // Save the courses to the database
    if (args.save) {
      await authenticateClient(client);

      console.log(`Adding ${coursesArray.length} courses to PocketBase...`);

      const promises = coursesArray.map((course, index) => {
        return new Promise<void>((resolve, reject) => {
          // Important: A timeout is needed to prevent 429 errors
          setTimeout(async () => {
            try {
              const result = await client.collection("courses").create(course);
              console.log(
                "Successfully saved course:",
                JSON.stringify(result, null, 2)
              );
              resolve();
            } catch (error) {
              console.error("Error saving course:", course);
              if (error instanceof ClientResponseError) {
                console.error(
                  "Error details:",
                  JSON.stringify(error.response, null, 2)
                );
              } else {
                console.error("Error details:", error);
              }
              reject(error);
            }
          }, index * 250); // Adjust delay as needed
        });
      });

      await Promise.all(promises);
    }

    return coursesArray;
  },
};

export default courseScraper;
