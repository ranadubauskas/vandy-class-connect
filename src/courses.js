import * as yes from "@vanderbilt/yes-api";

async function fetchSubjects() {
  try {
    const subjects = await yes.getSubjects();
    console.log(subjects);
    // Handle the subjects, maybe store them in state or display them in the UI
  } catch (error) {
    console.error("Error fetching subjects:", error);
  }
}

fetchSubjects();