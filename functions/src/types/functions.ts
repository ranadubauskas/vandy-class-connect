/**
 * Interface for functions tha can be run from the CLI
 */
export interface IFunction<Arguments, Result> {
  /**
   * Parses the arguments from the CLI to be used in the function
   * @returns Arguments
   */
  parseArguments: () => Arguments
  /**
   * Executes the function to get the result
   * @param args Arguments
   * @returns Result
   */
  execute: (args: Arguments) => Promise<Result>
}