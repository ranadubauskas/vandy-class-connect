
'use server'
import { cookies } from 'next/headers';
import { Review, User } from './lib/interfaces';
import pb from './lib/pocketbaseClient';


type UserInfoType = {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    graduationYear: string;
    profilePic: string;
    admin: boolean;
};

/**
 * Fetches all reviews for a specific user.
 *
 * @param {string} userId - The ID of the user whose reviews are to be fetched.
 * @return {Promise<Review[]>} A promise that resolves to an array of reviews.
 * @throws Will throw an error if fetching reviews fails.
 */
export async function getUserReviews(userId: string): Promise<Review[]> {
    try {
        const reviews = await pb.collection('reviews').getFullList<Review>(200, {
            filter: `user = "${userId}"`,
            expand: 'user,course,professors',
        });
        return reviews || [];
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        throw error;
    }
}

/**
 * Signs in a user using their email and password.
 *
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @return {Promise<UserInfoType>} A promise that resolves to the authenticated user's information.
 * @throws Will throw an error if authentication fails or if inputs are invalid.
 */
export async function signIn(email: string, password: string): Promise<UserInfoType> {
    if (!email || !password) {
        throw new Error('Invalid email or password');
    }
    try {
        // Authenticate the user
        const userAuthData = await pb.collection('users').authWithPassword(email, password);

        //Set user cookies
        const userReviews = await getUserReviews(userAuthData.record.id);

        const allCookies = await cookies();
        // Set cookies for authenticated user
        allCookies.set("id", userAuthData.record.id);
        allCookies.set("firstName", userAuthData.record.firstName);
        allCookies.set("lastName", userAuthData.record.lastName);
        allCookies.set("email", userAuthData.record.email);
        allCookies.set("graduationYear", userAuthData.record.graduationYear);
        allCookies.set("username", userAuthData.record.username);
        allCookies.set("admin", userAuthData.record.admin);

        // Extract the user record
        const userRecord = userAuthData.record;

        // Create a UserInfoType object
        const userInfo: UserInfoType = {
            id: userRecord.id,
            username: userRecord.username,
            firstName: userRecord.firstName,
            lastName: userRecord.lastName,
            email: userRecord.email,
            graduationYear: userRecord.graduationYear,
            profilePic: userRecord.profilePic,
            admin: userRecord.admin
        };

        return userInfo;
    } catch (err) {
        console.error("Error in signIn:", err);
        throw err;
    }
}

/**
 * Registers a new user.
 *
 * @param {FormData} formData - The form data containing user registration details.
 * @return {Promise<object>} A promise that resolves to the created user's data.
 * @throws Will throw an error if inputs are invalid or if user creation fails.
 */
export async function register(formData: FormData) {
    try {
        const username = formData.get("username");
        const email = formData.get("email");
        const password = formData.get("password");
        const passwordConfirm = formData.get("passwordConfirm");
        const firstName = formData.get("firstName");
        const lastName = formData.get("lastName");
        const graduationYear = formData.get("graduationYear");

        if (
            typeof username !== 'string' || username == "" ||
            typeof email !== 'string' || email == "" ||
            typeof password !== 'string' || password == "" ||
            typeof passwordConfirm !== 'string' || passwordConfirm == "" ||
            typeof firstName !== 'string' || firstName == "" ||
            typeof lastName !== 'string' || lastName == "" ||
            typeof graduationYear !== 'string' || graduationYear == ""
        ) {
            return { error: "Invalid input. Please provide all required fields." };
        }

        if (!email.endsWith('@vanderbilt.edu')) {
            return { error: "Only Vanderbilt email addresses are allowed." };
        }

        if (password.length < 8) {
            return { error: "Password must be at least 8 characters long." };
        }

        if (password !== passwordConfirm) {
            return { error: "Passwords do not match." };
        }

        const defaultProfilePicUrl = '/images/user.png';

        try {
            const newUser = await pb.collection('users').create({
                username,
                email,
                emailVisibility: true,
                password,
                passwordConfirm,
                firstName,
                lastName,
                graduationYear,
            });

            // Prepare user data and set cookies
            const userData = {
                id: newUser.id,
                username: newUser.username,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                graduationYear: newUser.graduationYear,
                profilePic: newUser.profilePic,
            };

            const allCookies = await cookies();
            allCookies.set("id", newUser.id);
            allCookies.set("username", newUser.username);
            allCookies.set("firstName", newUser.firstName);
            allCookies.set("lastName", newUser.lastName);
            allCookies.set("email", newUser.email);
            allCookies.set("graduationYear", newUser.graduationYear);
            allCookies.set("profilePic", defaultProfilePicUrl);
            allCookies.set("reviews", newUser.reviews);

            return { user: userData };
        } catch (err) {
            console.error("Error creating user:", err);
            return { error: "Username or email already exists" };
        }
    } catch (err) {
        console.error("Error creating user:", err);
        throw err;
    }
}

/**
 * Edits a user's information.
 *
 * @param {string} userId - The ID of the user to be edited.
 * @param {object} data - The data to update for the user.
 * @return {Promise<object>} A promise that resolves to the updated user data.
 * @throws Will throw an error if the update operation fails.
 */
export async function editUser(userId, data) {
    try {
        const user = await pb.collection("users").update(userId, data);

        const allCookies = await cookies();

        allCookies.set("id", user.id);
        allCookies.set("username", user.username);
        allCookies.set("firstName", user.firstName);
        allCookies.set("lastName", user.lastName);
        allCookies.set("email", user.email);
        allCookies.set("graduationYear", user.graduationYear);
        allCookies.set("profilePic", user.profilePic);
        return user;
    } catch (err) {
        console.error("Error editing user:", err);
        throw err;
    }
}

/**
 * Fetches a review by its ID.
 *
 * @param {string} reviewId - The ID of the review to be fetched.
 * @return {Promise<object>} A promise that resolves to the review data.
 * @throws Will throw an error if fetching the review fails.
 */
export async function getReviewByID(reviewId) {
    try {
        const review = await pb.collection("reviews").getOne(reviewId);
        return review;
    } catch (err) {
        console.error("Error review:", err);
        throw err;
    }
}

/**
 * Edits a review and updates the associated course's average rating.
 *
 * @param {string} reviewId - The ID of the review to be edited.
 * @param {object} data - The data to update for the review.
 * @param {string} courseId - The ID of the course associated with the review.
 * @return {Promise<object>} A promise that resolves to the updated review data.
 * @throws Will throw an error if the update operation fails.
 */
export async function editReview(reviewId, data, courseId) {
    try {
        const review = await pb.collection("reviews").update(reviewId, data);

        const existingReviews = await pb.collection('reviews').getFullList({
            filter: `course="${courseId}"`,
        });


        const totalRating = existingReviews.reduce((sum, review) => sum + (review.rating || 0), 0)
        const avgRating = totalRating / (existingReviews.length || 1);

        await pb.collection('courses').update(courseId, {
            averageRating: avgRating,
        });

        return review;
    } catch (err) {
        console.error("Error review:", err);
        throw err;
    }
}

/**
 * Deletes a review and updates the associated course's average rating.
 *
 * @param {string} reviewId - The ID of the review to be deleted.
 * @param {string} courseId - The ID of the course associated with the review.
 * @return {Promise<object>} A promise that resolves to the result of the delete operation.
 * @throws Will throw an error if the delete operation fails.
 */
export async function deleteReview(reviewId, courseId) {
    try {
        const deletedReview = await pb.collection("reviews").delete(reviewId);

        const existingReviews = await pb.collection('reviews').getFullList({
            filter: `course="${courseId}"`,
        });

        const totalRating = existingReviews.reduce((sum, review) => sum + (review.rating || 0), 0)
        const avgRating = totalRating / (existingReviews.length || 1);

        await pb.collection('courses').update(courseId, {
            averageRating: avgRating,
        });


        return deletedReview;
    } catch (err) {
        console.error("Error review:", err);
        throw err;
    }
}

/**
 * Fetches all courses from the database.
 *
 * @return {Promise<object[]>} A promise that resolves to an array of all courses.
 * @throws Will throw an error if fetching courses fails.
 */
export async function getAllCourses() {
    try {
        // If subject is provided, filter by subject, otherwise get all courses
        const resultList = await pb.collection('courses').getFullList({
            sort: '-created', // Sort by latest created courses
        });
        return resultList;
    } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
    }
}

/**
 * Fetches courses filtered by a specific subject.
 *
 * @param {string} [subject=''] - The subject to filter courses by (optional).
 * @return {Promise<object[]>} A promise that resolves to an array of filtered courses.
 * @throws Will throw an error if fetching courses fails.
 */
export async function getCoursesBySubject(subject = '') {
    try {
        // If subject is provided, filter by subject, otherwise get all courses
        const filter = subject ? `subject="${subject}"` : '';
        const resultList = await pb.collection('courses').getFullList({
            filter: filter,
            sort: '-created', // Sort by latest created courses
        });
        return resultList;
    } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
    }
}

/**
 * Fetches a course and its associated reviews by course ID.
 *
 * @param {string} courseID - The ID of the course to be fetched.
 * @return {Promise<object|null>} A promise that resolves to the course and its reviews, or null if not found.
 * @throws Will throw an error if fetching the course or reviews fails.
 */
export async function getCourseAndReviews(courseID: string) {
    try {
        const fetchedCourse = await pb.collection('courses').getOne(courseID, {
            expand: 'reviews',
        });
        const expandedReviews = fetchedCourse.expand?.reviews || [];
        return { course: fetchedCourse, reviews: expandedReviews };
    } catch (error) {
        console.error('Error fetching courses:', error);
        return null;
    }
}

/**
 * Fetches a course by its ID.
 *
 * @param {string} courseID - The ID of the course to be fetched.
 * @return {Promise<object|null>} A promise that resolves to the course data, or null if not found.
 * @throws Will throw an error if fetching the course fails.
 */
export async function getCourseByID(courseID: string) {
    try {
        const fetchedCourse = await pb.collection('courses').getOne(courseID);
        return fetchedCourse;
    } catch (error) {
        console.error('Error fetching course:', error);
        return null;
    }
}

/**
 * Fetches a user by their ID.
 *
 * @param {string} userId - The ID of the user to be fetched.
 * @return {Promise<object|null>} A promise that resolves to the user data, or null if not found.
 * @throws Will throw an error if fetching the user fails.
 */
export async function getUserByID(userId) {
    try {
        const user = await pb.collection('users').getOne<User>(userId);
        return user;
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        return null;
    }
}
