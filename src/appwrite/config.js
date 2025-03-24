import { Client, Databases, Storage, Account, Query, ID } from 'appwrite';

const client = new Client().setEndpoint(process.env.REACT_APP_APPWRITE_ENDPOINT).setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID);
const databases = new Databases(client);
const storage = new Storage(client);
const account = new Account(client);

// Xuất các ID dưới dạng biến để sử dụng trong các component khác
export const DATABASE_ID = process.env.REACT_APP_APPWRITE_DATABASE_ID;
export const CHALLENGES_ID = process.env.REACT_APP_APPWRITE_COLLECTION_CHALLENGES_ID;
export const USERS_ID = process.env.REACT_APP_APPWRITE_COLLECTION_USERS_ID;
export const JOINED_CHALLENGES_ID = process.env.REACT_APP_APPWRITE_COLLECTION_JOINED_CHALLENGES_ID;
export const NOTIFICATIONS_ID = process.env.REACT_APP_APPWRITE_COLLECTION_NOTIFICATIONS_ID;
export const MESSAGES_ID = process.env.REACT_APP_APPWRITE_COLLECTION_MESSAGES_ID;
export const FRIEND_REQUESTS_ID = process.env.REACT_APP_APPWRITE_COLLECTION_FRIEND_REQUESTS_ID;
export const FRIENDS_ID = process.env.REACT_APP_APPWRITE_COLLECTION_FRIENDS_ID;
export const PENDING_CHALLENGES_ID = process.env.REACT_APP_APPWRITE_COLLECTION_PENDING_CHALLENGES_ID;
export const RATINGS_ID = process.env.REACT_APP_APPWRITE_COLLECTION_RATINGS_ID;
export const LIKES_ID = process.env.REACT_APP_APPWRITE_COLLECTION_LIKES_ID;
export const COMMENTS_ID = process.env.REACT_APP_APPWRITE_COLLECTION_COMMENTS_ID;
export const BUCKET_ID = process.env.REACT_APP_APPWRITE_BUCKET_ID;
export const DEFAULT_IMG = process.env.REACT_APP_APPWRITE_DEFAULT_IMG;
export const APPWRITE_ENDPOINT = process.env.REACT_APP_APPWRITE_ENDPOINT;
export const APPWRITE_PROJECT_ID = process.env.REACT_APP_APPWRITE_PROJECT_ID;

export { client, databases, storage, account, Query, ID };
