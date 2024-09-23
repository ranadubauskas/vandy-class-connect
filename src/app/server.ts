
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
    cookies().set("firstName", user.record.firstName);
    cookies().set("lastName", user.record.lastName);
    cookies().set("email", user.record.email);
    cookies().set("graduationYear", user.record.graduationYear);

    return user;
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

    console.log("REGISTERING!")

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

    cookies().set("id", newUser.id);
    cookies().set("firstName", newUser.firstName);
    cookies().set("lastName", newUser.lastName);
    cookies().set("email", newUser.email);
    cookies().set("graduationYear", newUser.graduationYear);
    cookies().set("profilePic", null);
   
    return newUser;

    } catch (err){
        console.error(err);
    }
    
}

export async function editUser(userId, data) {
    try {
        console.log("EDITING USER")
        const user = await pb.collection("users").update(userId, data);
        console.log("user", user);

        cookies().set("id", user.id);
        cookies().set("firstName", user.firstName);
        cookies().set("lastName", user.lastName);
        cookies().set("email", user.email);
        cookies().set("graduationYear", user.graduationYear);
        cookies().set("profilePic", user.profilePic);
        return user;
    } catch (error) {
        console.error("Error editing user:", error);
        return null;
    }
}


