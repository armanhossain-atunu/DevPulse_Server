import { sql } from "../../db";
import type { RUser, User } from "../../types";
import bcrypt from "bcrypt";

class authService {
  // Create a new user in the database
  async createUser(user: RUser & { password: string }) {
    const { name, email, role, password } = user;
    // Hash the password before storing it in the database
    const hash = await bcrypt.hash(password, 10);
    const res = await sql`
INSERT INTO users (name, email, role, passwordhash)
VALUES (${name}, ${email}, COALESCE(${role}, 'contributor'), ${hash})
RETURNING id, name, email, role, created_at, updated_at
`;
    return res[0];
  }
  // login user
  async validateUser(email: string, password: string) {
    const res = await sql`
SELECT * FROM users WHERE email = ${email}
`;
    if (!res.length) return null; // User not found
    const { passwordhash, ...user } = res[0] as User;

    const isValid = await bcrypt.compare(password, passwordhash);
    return isValid ? user : null; // Return user data if valid, otherwise null
  }
  async getUserById(id: number) {
    const res = await sql`
SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ${id}
`;
    return res[0] as User & { id: number };
  }
}

export default new authService();
