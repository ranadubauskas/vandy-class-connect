
'use server'
import { cookies } from 'next/headers';
import PocketBase from 'pocketbase';


const NEXT_PUBLIC_POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const pb = new PocketBase(`${NEXT_PUBLIC_POCKETBASE_URL}`);

export async function signIn(formData: FormData) {
    const email = formData.get("email");
    const password = formData.get("password");

    // Check if email or password is null, and throw an error if they are
    if (typeof email !== 'string' || typeof password !== 'string') {
        throw new Error("Invalid email or password");
    }

    // Now email and password are guaranteed to be strings

    const user = await pb.collection('users').authWithPassword(email, password);
    // Set cookies for authenticated user
    cookies().set("id", user.record.id);
    cookies().set("firstName", user.record.first_name);
    cookies().set("lastName", user.record.last_name);
    cookies().set("email", user.record.email);
    cookies().set("graduationYear", user.record.graduation_year);
    cookies().set("profilePic", user.record.profile_pic);

    return user;
}

export async function register(formData: FormData) {
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");
    const passwordConfirm = formData.get("passwordConfirm");
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const graduationYear = formData.get("graduationYear");

    if (
        typeof username !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        typeof passwordConfirm !== 'string' ||
        typeof firstName !== 'string' ||
        typeof lastName !== 'string' ||
        typeof graduationYear !== 'string'
    ) {
        throw new Error("Invalid input. Please provide all required fields.");
    }

    const newUser = await pb.collection('users').create({
        email,
        password,
        passwordConfirm,
        first_name: firstName,
        last_name: lastName,
        graduation_year: graduationYear,
        username
    });

    cookies().set("id", newUser.id);
    cookies().set("firstName", newUser.first_name);
    cookies().set("lastName", newUser.last_name);
    cookies().set("email", newUser.email);
    cookies().set("graduationYear", newUser.graduation_year);
    cookies().set("profilePic", newUser.profile_pic);
   
    return newUser;
}

