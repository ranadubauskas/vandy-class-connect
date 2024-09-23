
'use server'
import { cookies } from 'next/headers';
import PocketBase from 'pocketbase';


const NEXT_PUBLIC_POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const pb = new PocketBase(`${NEXT_PUBLIC_POCKETBASE_URL}`);

export async function signIn(formData: FormData) {
    try{
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
    } catch (err){
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

    cookies().set("id", newUser.id);
    cookies().set("firstName", newUser.firstName);
    cookies().set("lastName", newUser.lastName);
    cookies().set("email", newUser.email);
    cookies().set("graduationYear", newUser.graduationYear);
    cookies().set("profilePic", null);
    return newUser;
    } catch (err){
        console.error("Error creating user:", err);
        throw err;
    }
    
}

export async function editUser(userId, data) {
    try {
        const user = await pb.collection("users").update(userId, data);
        console.log("user", user);

        cookies().set("id", user.id);
        cookies().set("firstName", user.firstName);
        cookies().set("lastName", user.lastName);
        cookies().set("email", user.email);
        cookies().set("graduationYear", user.graduationYear);
        cookies().set("profilePic", user.profilePic);
        return user;
    } catch (err) {
        console.error("Error editing user:", err);
        throw err;
    }
}


