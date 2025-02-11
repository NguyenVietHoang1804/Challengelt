import { Client, Databases, Storage, Account,Query,ID } from 'appwrite';

const client = new Client()
.setEndpoint('https://cloud.appwrite.io/v1')
.setProject('678a0a09003d4f41cb57');
const databases = new Databases(client);
const storage = new Storage(client);
const account = new Account(client);


export { client, databases, storage, account,Query,ID  };