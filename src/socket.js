import { io } from 'socket.io-client';

const URL = process.env.SERVER === 'true' ? 'https://sound.hackrland.dev' : 'http://localhost:3000';

export const socket = io(URL);