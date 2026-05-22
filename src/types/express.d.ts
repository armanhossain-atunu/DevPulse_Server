import type { RUser } from ".";

declare global{
    namespace Express {
        interface Request {
            user: RUser & { id: number };
        }
    }
}