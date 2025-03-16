'use client';
import React, { createContext, useState, useEffect } from 'react';
import { account, databases } from '~/appwrite/config';

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
                    '678a0e0000363ac81b93', 
                    '678a207f00308710b3b2', 
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
