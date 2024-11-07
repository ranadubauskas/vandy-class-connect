
'use server'
import { cookies } from 'next/headers';
import PocketBase from 'pocketbase';
import { UserInfoType } from './lib/contexts';


const NEXT_PUBLIC_POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const pb = new PocketBase(`${NEXT_PUBLIC_POCKETBASE_URL}`);


export async function getUserReviews(userID: string){
    try{
        const user = await pb.collection('users').getOne(userID, {
            expand: "reviews.course",
        });
        const expandedReviews = user.expand?.reviews || [];
        return expandedReviews;
    } catch(error){
        console.error(error);
        return [];
    }
}

export async function signIn(email: string, password: string): Promise<UserInfoType> {
    console.log("IN SIGN IN");
    try {
      // Authenticate the user
      const userAuthData = await pb.collection('users').authWithPassword(email, password);

      //Set user cookies
      const userReviews = await getUserReviews(userAuthData.record.id);
        console.log('userRevs: ' +  userReviews);

        const allCookies = await cookies();
        // Set cookies for authenticated user
        allCookies.set("id", userAuthData.record.id);
        allCookies.set("firstName", userAuthData.record.firstName);
        allCookies.set("lastName", userAuthData.record.lastName);
        allCookies.set("email", userAuthData.record.email);
        allCookies.set("graduationYear", userAuthData.record.graduationYear);
        allCookies.set("username", userAuthData.record.username);
  
      // Extract the user record
      const userRecord = userAuthData.record;
      console.log("IN SIGN I2");
  
      // Create a UserInfoType object
      const userInfo: UserInfoType = {
        id: userRecord.id,
        username: userRecord.username,
        firstName: userRecord.firstName,
        lastName: userRecord.lastName,
        email: userRecord.email,
        graduationYear: userRecord.graduationYear,
        profilePic: userRecord.profilePic,
      };
  
      console.log('userInfo: ', userInfo);
      // Optionally set cookies here if needed
  
      return userInfo;
    } catch (err) {
      console.error("Error in signIn:", err);
      throw err;
    }
}

export async function register(formData: FormData) {
    try{
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
        typeof graduationYear !== 'string' ||  graduationYear == ""
    ) {
        throw new Error("Invalid input. Please provide all required fields.");
    }

    if (!email.endsWith('@vanderbilt.edu')) {
        throw new Error("Only Vanderbilt email addresses are allowed.");
    }

    if (password !== passwordConfirm) {
        throw new Error("Passwords do not match.");
    }


    const newUser = await pb.collection('users').create({
        username,
        email,
        emailVisibility: true,
        password,
        passwordConfirm,
        firstName: firstName,
        lastName: lastName,
        graduationYear: graduationYear
    });
    console.log('newUser: ', newUser);
    
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
    allCookies.set("profilePic", null);
    allCookies.set("reviews", newUser.reviews);
    
    return userData;
    } catch (err){
        console.error("Error creating user:", err);
        throw err;
    }
    
}

export async function editUser(userId, data) {
    try {
        const user = await pb.collection("users").update(userId, data);
        console.log("user", user);

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


export async function getReviewByID(reviewId) {
    try {
        const review = await pb.collection("reviews").getOne(reviewId);
        return review;
    } catch (err) {
        console.error("Error review:", err);
        throw err;
    }
}


export async function editReview(reviewId, data) {
    try {
        const review = await pb.collection("reviews").update(reviewId, data);
        return review;
    } catch (err) {
        console.error("Error review:", err);
        throw err;
    }
}


export async function deleteReview(reviewId) {
    try {
        const deletedReview = await pb.collection("reviews").delete(reviewId);
        return deletedReview;
    } catch (err) {
        console.error("Error review:", err);
        throw err;
    }
}


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


export async function getCourseAndReviews(courseID: string) {
    try {
        const fetchedCourse = await pb.collection('courses').getOne(courseID, {
            expand: 'reviews',
        });
        const expandedReviews = fetchedCourse.expand?.reviews || [];
        return {course: fetchedCourse, reviews: expandedReviews};
    } catch (error) {
        console.error('Error fetching courses:', error);
        return null;
    }
}

export async function getCourseByID(courseID: string) {
    try {
        const fetchedCourse = await pb.collection('courses').getOne(courseID);
        return fetchedCourse;
    } catch (error) {
        console.error('Error fetching course:', error);
        return null;
    }
}

export async function getUserByID(userID: string) {
    try {
        const fetchedUser = await pb.collection('users').getOne(userID);
        return fetchedUser
    } catch (error) {
        console.error('Error fetching review:', error);
        return null;
    }
}


