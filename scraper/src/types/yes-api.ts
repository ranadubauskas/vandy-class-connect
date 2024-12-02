/**
 * The response from the YES API for a subject
 */
export interface YesSubjectResponse {
  id: string
  name: string
}

/**
 * The response from the YES API for a term
 */
export interface YesTermResponse {
  id: string
  title: string
  sessions?: YesTermSessionResponse[]
}

/**
 * The response from the YES API for a term session
 */
export interface YesTermSessionResponse {
  id: string
  titleShort: string
  titleLong: string
}

/**
 * The response from the YES API for a course
 */
export interface YesCourseResponse {
  id: string
  subject: string
  abbreviation: string
  name: string
}

/**
 * The response from the YES API for a section's capacity
 */
export interface YesSectionDetailsCapacityResponse {
  seats: number
  enrolled: number
  waitlistSeats: number
  waitlistEnrolled: number
}

/**
 * The response from the YES API for a section's details
 */
export interface YesSectionDetailsResponse {
  school: string
  description: string
  notes: string
  attributes: string[]
  availability: YesSectionDetailsCapacityResponse
  requirements: string
  bookURL: string
}

/**
 * The response from the YES API for a section
 */
export interface YesSectionResponse {
  id: string
  term: string
  course: YesCourseResponse
  number: string
  instructors: string[]
  type: string
  schedule: string
  hours: number
  details?: YesSectionDetailsResponse
}