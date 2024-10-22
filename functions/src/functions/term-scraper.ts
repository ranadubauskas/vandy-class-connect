import * as yes from "@vanderbilt/yes-api"
import { parseArgs } from "util"
import { IFunction } from "../types/functions"
import { YesTermResponse } from "../types/yes-api"
import { nanoid } from "nanoid"
import client from "../pocketbase"

/**
 * CLI Arguments for the Term Scraper function
 */
export interface TermScraperArguments {
  save: boolean
  limit: number
}

export default {
  /**
   * Parses the arguments from the CLI to be used in the function
   * @returns TermScraperArguments
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
         * The maximum number of terms to return/save
         */
        limit: {
          type: 'string',
          default: Number.MAX_VALUE.toString()
        },
      },
      strict: false
    })

    return {
      save: Boolean(values.save),
      limit: Number(values.limit)
    } satisfies TermScraperArguments
  },
  /**
   * Executes the Term Scraper function to get terms from YES
   * @param args TermScraperArguments
   * @returns YesTermResponse[]
   */
  async execute(args: TermScraperArguments) {
    let terms: YesTermResponse[] = []

    //  Get the terms from the YES API
    await yes.getTerms(
      (term: YesTermResponse, timestamp: unknown) => {
        terms.push(term)
      }
    )

    //  Add IDs to the terms, sort them, and limit them
    terms = terms
      .map(term => {
        let id = term.id
        if (id.length < 15) {
          id = id + nanoid(15 - id.length)
        }

        return {
          id,
          title: term.title,
        }
      })
      .toSorted((a, b) => a.title.localeCompare(b.title))
      .toSpliced(args.limit)

    //  Save the terms to the database
    if (args.save) {
      let index = 0;

      const promises = terms.map((term, index) => {
        return new Promise<void>((resolve, reject) => {
         //  Important: A timeout is needed to prevent 429
          const timeout = setTimeout(async () => {
            try {
              console.log(`Saving term: ${term.title}`)
              
              await client.collection('terms').create(term)
              
              resolve()
            } catch (error) {
              console.error(JSON.stringify(error, null, 2))

              reject(error)
            }
          }, index++ * 250)
        })
      })
    
      await Promise.all(promises)
    }

    return terms
  }
} satisfies IFunction<TermScraperArguments, YesTermResponse[]>