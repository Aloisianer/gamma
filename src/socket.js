import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === 'production' ? 'https://sound.hackrland.dev' : 'http://192.168.178.34:3000';

export const socket = io(URL);