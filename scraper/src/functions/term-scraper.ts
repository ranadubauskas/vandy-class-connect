// src/functions/term-scraper.ts

import { IFunction } from "../types/functions";
import { YesTermResponse } from "../types/yes-api";
import { nanoid } from "nanoid";
import minimist from "minimist";

/**
 * CLI Arguments for the Term Scraper function
 */
export interface TermScraperArguments {
  save: boolean;
  limit: number;
}

export default {
  /**
   * Parses the arguments from the CLI to be used in the function
   * @returns TermScraperArguments
   */
  parseArguments() {
    const argv = minimist(process.argv.slice(2), {
      boolean: ["save"],
      default: {
        save: false,
        limit: Number.MAX_VALUE.toString(),
      },
    });

    return {
      save: argv.save,
      limit: Number(argv.limit),
    } satisfies TermScraperArguments;
  },

  /**
   * Executes the Term Scraper function to get terms from YES
   * @param args TermScraperArguments
   * @param dependencies Optional dependencies for testing
   * @returns YesTermResponse[]
   */
  async execute(
    args: TermScraperArguments,
    dependencies?: {
      yesApi?: typeof import("@vanderbilt/yes-api");
      client?: typeof import("../pocketbase").default;
      authenticateClient?: typeof import("../pocketbase").authenticateClient;
    }
  ) {
    // Use the provided dependencies or default to actual modules
    const yes = dependencies?.yesApi ?? (await import("@vanderbilt/yes-api"));
    const client = dependencies?.client ?? (await import("../pocketbase")).default;
    const authenticateClient =
      dependencies?.authenticateClient ?? (await import("../pocketbase")).authenticateClient;

    let terms: YesTermResponse[] = [];

    const getTermsPromise = new Promise<YesTermResponse[]>((resolve) => {
      yes.getTerms((term: YesTermResponse, timestamp: unknown) => {
        if (terms.length >= args.limit) {
          resolve(terms);
          return;
        }

        terms.push(term);
      });
    });

    const limitPromise = new Promise<YesTermResponse[]>((resolve) => {
      setInterval(() => {
        if (terms.length >= args.limit) {
          resolve(terms);
        }
      }, 1000);
    });

    await Promise.race([getTermsPromise, limitPromise]);

    //  Add IDs to the terms, sort them, and limit them
    terms = terms
      .map((term) => {
        let id = term.id;
        if (id.length < 15) {
          id = id + nanoid(15 - id.length);
        }

        return {
          id,
          title: term.title,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, args.limit);

    //  Save the terms to the database
    if (args.save) {
      await authenticateClient();

      const promises = terms.map((term, index) => {
        return new Promise<void>((resolve, reject) => {
          //  Important: A timeout is needed to prevent 429
          setTimeout(async () => {
            try {
              await client.collection("terms").create(term);

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

    return terms;
  },
} satisfies IFunction<TermScraperArguments, YesTermResponse[]>;
