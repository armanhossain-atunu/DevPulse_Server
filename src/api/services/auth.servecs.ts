import { sql } from "../../db";
import type { RUser } from "../../types";
import bcrypt from "bcrypt";

class authService {
  async createUser(user: RUser & { password: string }) {
    const { name, email, role, password } = user;
    // Hash the password before storing it in the database
    const hash = await bcrypt.hash(password, 10);
    const res = await sql`
INSERT INTO users (name, email, role, passwordHash)
VALUES (${name}, ${email}, COALESCE(${role}, 'contributor'), ${hash})
RETURNING id, name, email, role, created_at, updated_at
`;
    return res[0];
  }
}

export default new authService();
