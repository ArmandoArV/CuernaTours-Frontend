/**
 * Express Type Extensions
 * 
 * Type definitions for Express request extensions
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        roleId: number;
        username: string;
      };
    }
  }
}