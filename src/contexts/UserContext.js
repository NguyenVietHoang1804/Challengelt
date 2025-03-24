'use client';
import React, { createContext, useState, useEffect } from 'react';
import { account, databases,DATABASE_ID,USERS_ID } from '~/appwrite/config';

export const UserContext = createContext();

const UserProvider = ({ children }) => {
    const [userId, setUserId] = useState(null);
    const [displayName, setDisplayName] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = await account.get();
                setUserId(user.$id);
                const userDocument = await databases.getDocument(
                    DATABASE_ID, 
                    USERS_ID, 
                    user.$id 
                );
                setDisplayName(userDocument.displayName);
            } catch {
                setUserId(null);
                setDisplayName(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const updateUserContext = (id, name) => {
        setUserId(id);
        setDisplayName(name);
    };
    return (
        <UserContext.Provider value={{ userId, displayName, setUserId: updateUserContext, setDisplayName, unreadCount, setUnreadCount }}>
            {!loading && children}
        </UserContext.Provider>
    );
};

export default UserProvider;
