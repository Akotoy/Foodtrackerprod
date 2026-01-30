
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user: {
        id: number;
        first_name: string;
        username?: string;
        language_code?: string;
      };
    }
  }
}
