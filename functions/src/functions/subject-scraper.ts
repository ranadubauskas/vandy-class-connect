import * as yes from "@vanderbilt/yes-api";
import { nanoid } from "nanoid";
import { parseArgs } from "util";
import client from "../pocketbase";
import { IFunction } from "../types/functions";
import { YesSubjectResponse } from "../types/yes-api";

/**
 * CLI Arguments for the Subject Scraper function
 */
export interface SubjectScraperArguments {
  save: boolean
  limit: number
}

export default {
  /**
   * Parses the arguments from the CLI to be used in the function
   * @returns SubjectScraperArguments
   */
  parseArguments() {
    const {
      values,
      positionals
    } = parseArgs({
      options: {
        /**
         * Whether or not to save the subjects to the database
         */
        save: {
          type: 'boolean',
          default: false
        },
        /**
         * The maximum number of subjects to return/save
         */
        limit: {
          type: 'string',
          default: Number.MAX_VALUE.toString()
        }
      },
      strict: false
    })

    return {
      save: Boolean(values.save),
      limit: Number(values.limit)
    } satisfies SubjectScraperArguments
  },
  /** 
   * Executes the Subject Scraper function to get subjects from YES
   * @param args SubjectScraperArguments
   * @returns YesSubjectResponse[]
   */
  async execute(args: SubjectScraperArguments) {
    let subjects: YesSubjectResponse[] = []

    //  Get the subjects from the YES API
    await yes.getSubjects(
      (subject: YesSubjectResponse, timestamp: unknown) => {
        subjects.push(subject)
      }
    )

    //  Add IDs to the subjects, sort them, and limit them
    subjects = subjects
      .map(subject => {
        let id = subject.id.substring(0, 15)
        if (id.length < 15) {
          id = id + nanoid(15 - id.length)
        }

        return {
          id,
          name: subject.name
        }
      })
      .toSorted((a, b) => a.name.localeCompare(b.name))
      .toSpliced(args.limit)

    //  Save the subjects to the database
    if (args.save) {
      let index = 0

      const promises = subjects.map((subject, index) => {
        return new Promise<void>((resolve, reject) => {
         //  Important: A timeout is needed to prevent 429
          const timeout = setTimeout(async () => {
            try {
              console.log(`Saving subject: ${subject.name}`)
              
              await client.collection('subjects').create(subject)
              
              resolve()
            } catch (error) {
              console.error(JSON.stringify(error, null, 2))

              reject(error)
            }
          }, index++ * 250)
        });
      });

      await Promise.all(promises)
    }

    return subjects
  }
} satisfies IFunction<SubjectScraperArguments, YesSubjectResponse[]>