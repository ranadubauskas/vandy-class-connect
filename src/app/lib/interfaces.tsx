export interface User {
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expand: any;
    id: string;
    collectionId: string;
    collectionName: string;
    username: string;
    verified: boolean;
    emailVisibility: boolean;
    email: string;
    created: string;
    updated: string;
    firstName: string;
    lastName: string;
    graduationYear: number;
    profilePic?: string;
    reviews: string[]; // Array of review IDs
    courses_tutored: string[]; // Array of course IDs
    savedCourses: string[]; // Array of course IDs
    admin: boolean;
};

export interface Course {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    code: string;
    name: string;
    subject: string;
    averageRating: number;
    reviews: string[]; // Array of review IDs
    syllabus?: string; // Filename of the syllabus
    tutors: string[]; // Array of user IDs
    professors: string[]; // Array of professor IDs
};

export interface Professor {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    firstName: string;
    lastName: string;
    course: string; // Course ID
}

export interface Review {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    rating: number;
    comment: string;
    course: string; // Course ID
    user: string; // User ID
    professors: string[]; // Array of professor IDs
    anonymous: boolean;
    expand?: {
        user?: User;
        course?: Course;
        professors?: Professor[];
    };
}