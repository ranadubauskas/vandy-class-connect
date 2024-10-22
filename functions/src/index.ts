import { parseArgs } from "util";
import courseScraper from "./functions/course-scraper";
import subjectScraper from "./functions/subject-scraper";

//  Define the functions that can be run
const functions = {
  'courses': courseScraper,
  'subjects': subjectScraper,
} as const

//  Parse the arguments for the CLI to figure out which function to run
const { values } = parseArgs({
  options: {
    function: {
      type: 'string',
      required: true,
      choices: Object.keys(functions)
    },
  },
  strict: false
});

//  Get the selected function
const selectedFunction = functions[values.function as keyof typeof functions];

//  If the function was not found, print an error
if (selectedFunction === undefined) {
  console.error(`Function "${values.function}" not found`);
} else {
  try {
    //  Parse the arguments for the selected function
    const functionArguments = selectedFunction.parseArguments();
    //  Execute the selected function
    const functionResult = await selectedFunction.execute(functionArguments as any);

    //  If the function returned a result, print it
    if (functionResult !== undefined) {
      console.log(JSON.stringify(functionResult));
    }
  } catch (err) {
    //  If the function errored, print the error
    console.error(JSON.stringify(err, null, 2))
  }
}