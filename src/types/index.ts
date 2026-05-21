export const role = ["contributor", "maintainer"] as const;
type Role = (typeof role)[number];

export type User = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  created_at: Date;
  updated_at: Date;
};

export type RUser = Omit<
  User,
  "id" | "passwordHash" | "created_at" | "updated_at"
>;

export type Issue = {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
};
