import { defineString } from 'firebase-functions/params';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

export const JWT_SECRET = defineString('JWT_SECRET');


export function getJwtSecret(): string {
 
  return process.env.JWT_SECRET || JWT_SECRET.value();
}
