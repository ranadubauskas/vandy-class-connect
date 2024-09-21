'use client';
import { useContext, useEffect, useState } from 'react';
import { AuthContext, useAuth } from "../lib/contexts";


export default function Profile() {
    const userVal = useContext(AuthContext);
    return (
        <div className="flex items-center justify-center h-screen">
            <ul>
                <li>Profile:</li>
                <li>First Name: {userVal.firstName}</li>
                <li>Last Name: {userVal.lastName}</li>
                <li>Email: {userVal.email}</li>
                <li>Graduation Year: {userVal.graduationYear}</li>
                <li>Profile Pic: {userVal.profilePic}</li>
            </ul>
        </div>
    );
}


