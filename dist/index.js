

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/middleware/logger.ts
var logger = (req, res, next) => {
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}], ${req.method}, ${req.url}`);
  next();
};

// src/config/index.ts
import dotenv from "dotenv";
import { env } from "process";
dotenv.config({ quiet: true });
var config = {
  port: env.PORT,
  database_url: env.DATABASE_URL,
  node_env: env.NODE_ENV,
  jwt_secret: env.JWT_SECRET,
  refresh_secret: env.REFRESH_SECRET
};
var config_default = config;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err instanceof Error ? err.message : "An unexpected error occurred.",
    stack: config_default.node_env === "development" ? void 0 : err instanceof Error ? err.stack : void 0
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/api/router/auth.router.ts
import { Router } from "express";

// src/db/index.ts
import { neon } from "@neondatabase/serverless";
var sql = neon(config_default.database_url);
var initDB = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(75) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(50) NOT NULL,
        passwordhash TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()

    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50)  DEFAULT 'open' 
        CHECK (status IN ('open', 'in_progress', 'resolved')),
        reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`;
  console.log("Initializing database connection...!");
};

// src/api/services/auth.servecs.ts
import bcrypt from "bcrypt";
var authService = class {
  // Create a new user in the database
  async createUser(user) {
    const { name, email, role, password } = user;
    const hash = await bcrypt.hash(password, 10);
    const res = await sql`
INSERT INTO users (name, email, role, passwordhash)
VALUES (${name}, ${email}, COALESCE(${role}, 'contributor'), ${hash})
RETURNING id, name, email, role, created_at, updated_at
`;
    return res[0];
  }
  // login user
  async validateUser(email, password) {
    const res = await sql`
SELECT * FROM users WHERE email = ${email}
`;
    if (!res.length) return null;
    const { passwordhash, ...user } = res[0];
    const isValid = await bcrypt.compare(password, passwordhash);
    return isValid ? user : null;
  }
  async getUserById(id) {
    const res = await sql`
SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ${id}
`;
    return res[0];
  }
};
var auth_servecs_default = new authService();

// src/utility/sendResponse.ts
function sendResponse(res, { message, data, error }, status = 200) {
  res.status(status).json({
    success: error ? false : true,
    message,
    data: error ? void 0 : data
  });
}

// src/utility/jwt.ts
import jwt from "jsonwebtoken";
var verifyToken = (token, type) => {
  const secret = type === "access" ? config_default.jwt_secret : config_default.refresh_secret;
  const decoded = jwt.verify(token, secret);
  return decoded;
};
var signToken = (user) => {
  const payload = { id: user.id, name: user.name, role: user.role };
  const accessToken = jwt.sign(payload, config_default.jwt_secret, { expiresIn: "1d" });
  const refreshToken = jwt.sign(payload, config_default.refresh_secret, {
    expiresIn: "7d"
  });
  return { accessToken, refreshToken };
};

// src/api/controller/auth.controller.ts
var signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = await auth_servecs_default.createUser({ name, email, password, role });
  if (!user) {
    return sendResponse(
      res,
      { message: "Failed to create user", error: true },
      400
    );
  }
  sendResponse(
    res,
    { message: "User registered successfully", data: user },
    201
  );
};
var login = async (req, res) => {
  const { email, password } = req.body;
  const user = await auth_servecs_default.validateUser(email, password);
  if (!user) {
    return sendResponse(
      res,
      { message: "Invalid email or password", error: true },
      401
    );
  }
  const { accessToken, refreshToken } = signToken(user);
  res.cookie("refreshToken", refreshToken, {
    sameSite: "lax",
    httpOnly: true,
    secure: true
  });
  const result = {
    user,
    accessToken,
    refreshToken
  };
  return sendResponse(res, { message: "Login successful", data: result }, 200);
};
var refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return sendResponse(
      res,
      { message: "No refresh token provided", error: true },
      400
    );
  }
  const payload = verifyToken(refreshToken, "refresh");
  if (!payload) {
    return sendResponse(
      res,
      { message: "Invalid refresh token", error: true },
      401
    );
  }
  const user = await auth_servecs_default.getUserById(payload.id);
  if (!user) {
    return sendResponse(
      res,
      { message: "User not found", error: true },
      404
    );
  }
  const { accessToken, refreshToken: newRefreshToken } = signToken(user);
  res.cookie("refreshToken", newRefreshToken, {
    sameSite: "lax",
    httpOnly: true,
    secure: true
  });
  sendResponse(
    res,
    { message: "Token refreshed successfully", data: { accessToken, newRefreshToken } },
    200
  );
};

// src/api/router/auth.router.ts
var router = Router();
router.post("/signup", signup);
router.post("/login", login);
router.get("/refresh", refresh);
var auth_router_default = router;

// src/app.ts
import cookies from "cookie-parser";

// src/api/router/issues.router.ts
import { Router as Router2 } from "express";

// src/api/services/issues.services.ts
var issuesService = class {
  // issue create
  async issues(issue) {
    const { title, description, type, reporter_id } = issue;
    const res = await sql`
        INSERT INTO issues (title, description, type,  reporter_id)
        VALUES (${title}, ${description}, ${type},  ${reporter_id})
        RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
    `;
    return res[0];
  }
  // get all issues
  async getAllIssues(query) {
    const isOldestFirst = query.sort === "oldest";
    let issuesResult;
    if (query.type && query.status) {
      if (isOldestFirst) {
        issuesResult = await sql`
          SELECT * FROM issues
          WHERE type = ${query.type} AND status = ${query.status}
          ORDER BY created_at ASC
        `;
      } else {
        issuesResult = await sql`
          SELECT * FROM issues
          WHERE type = ${query.type} AND status = ${query.status}
          ORDER BY created_at DESC
        `;
      }
    } else if (query.type) {
      if (isOldestFirst) {
        issuesResult = await sql`
          SELECT * FROM issues
          WHERE type = ${query.type}
          ORDER BY created_at ASC
        `;
      } else {
        issuesResult = await sql`
          SELECT * FROM issues
          WHERE type = ${query.type}
          ORDER BY created_at DESC
        `;
      }
    } else if (query.status) {
      if (isOldestFirst) {
        issuesResult = await sql`
          SELECT * FROM issues
          WHERE status = ${query.status}
          ORDER BY created_at ASC
        `;
      } else {
        issuesResult = await sql`
          SELECT * FROM issues
          WHERE status = ${query.status}
          ORDER BY created_at DESC
        `;
      }
    } else {
      if (isOldestFirst) {
        issuesResult = await sql`
          SELECT * FROM issues
          ORDER BY created_at ASC
        `;
      } else {
        issuesResult = await sql`
          SELECT * FROM issues
          ORDER BY created_at DESC
        `;
      }
    }
    const issues2 = issuesResult;
    const reporterIds = [...new Set(issues2.map((issue) => issue.reporter_id))];
    const users = await sql`
 SELECT id, name, role FROM users WHERE id = ANY(${reporterIds})
 `;
    const userMap = new Map(users.map((user) => [user.id, user]));
    const finalIssues = issues2.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter_id: userMap.get(issue.reporter_id) || null,
      created_at: issue.created_at,
      updated_at: issue.updated_at
    }));
    return finalIssues;
  }
  // get single issue by id
  //   async getIssueById(id: number) {
  //     const issue = await sql`
  //     SELECT * FROM issues WHERE id = ${id}
  //   `;
  //     if (!issue[0]) return null;
  //     const reporter = await sql`
  //     SELECT id, name, role
  //     FROM users
  //     WHERE id = ${issue[0].reporter_id}
  //   `;
  //     return {
  //       ...issue[0],
  //       reporter: reporter[0] || null,
  //     };
  //   }
  async getIssueById(id) {
    const issuesResult = await sql`
        SELECT * FROM issues WHERE id = ${id}
      `;
    if (issuesResult.length === 0) {
      return null;
    }
    const issue = issuesResult[0];
    const users = await sql`
        SELECT id, name, role FROM users WHERE id = ${issue.reporter_id}
      `;
    const user = users[0] || null;
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: user,
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
  }
  // update issue by id
  async updateIssueById(id, updates) {
    const issuesResult = await sql`
        SELECT * FROM issues WHERE id = ${id}
      `;
    if (issuesResult.length === 0) {
      return null;
    }
    const currentIssue = issuesResult[0];
    const title = updates.title ?? currentIssue.title;
    const description = updates.description ?? currentIssue.description;
    const type = updates.type ?? currentIssue.type;
    const newStatus = currentIssue.status === "open" ? "in_progress" : currentIssue.status;
    const updatedResult = await sql`
        UPDATE issues
        SET title = ${title}, description = ${description}, type = ${type}, status = ${newStatus}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
      `;
    return updatedResult[0];
  }
  // delete issue by id
  async deleteIssueById(id) {
    const result = await sql`
        DELETE FROM issues
        WHERE id = ${id}
        RETURNING id
      `;
    return result.length > 0;
  }
};
var issues_services_default = new issuesService();

// src/api/controller/issues.controller.ts
var issues = async (req, res) => {
  const { title, description, type } = req.body;
  const reporter_id = req.user?.id;
  if (!title || !description || !type) {
    return res.status(400).json({ message: "All fields are required", error: true });
  }
  const issue = await issues_services_default.issues({
    title,
    description,
    type,
    reporter_id
  });
  if (!issue) {
    return res.status(500).json({ message: "Failed to create issue", error: true });
  }
  return res.status(201).json({ message: "Issue created successfully", data: issue });
};
var getIssues = async (req, res) => {
  const issues2 = await issues_services_default.getAllIssues(req.query);
  return res.status(200).json({ message: "Issues fetched successfully", data: issues2 });
};
var getIssueById = async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ message: "Invalid issue ID", error: true });
  }
  const issue = await issues_services_default.getIssueById(Number(id));
  if (!issue) {
    return res.status(404).json({ message: "Issue not found", error: true });
  }
  return res.status(200).json({ message: "Issue retrived successfully", data: issue });
};
var updateIssue = async (req, res) => {
  const { id } = req.params;
  const { title, description, type } = req.body;
  const userId = req.user?.id;
  const userRole = req.user?.role;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ message: "Invalid issue ID", error: true });
  }
  if (!title && !description && !type) {
    return res.status(400).json({ message: "At least one field must be provided", error: true });
  }
  const issue = await issues_services_default.getIssueById(Number(id));
  if (!issue) {
    return res.status(404).json({ message: "Issue not found", error: true });
  }
  if (userRole === "contributor") {
    if (issue.reporter?.id !== userId) {
      return res.status(403).json({ message: "You can only update your own issues", error: true });
    }
    if (issue.status !== "open") {
      return res.status(403).json({ message: "Contributors can only update open issues", error: true });
    }
  }
  const updatedIssue = await issues_services_default.updateIssueById(Number(id), {
    title,
    description,
    type
  });
  if (!updatedIssue) {
    return res.status(500).json({ message: "Failed to update issue", error: true });
  }
  return res.status(200).json({ message: "Issue updated successfully", data: updatedIssue });
};
var deleteIssue = async (req, res) => {
  const { id } = req.params;
  const userRole = req.user?.role;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ message: "Invalid issue ID", error: true });
  }
  if (userRole !== "maintainer") {
    return res.status(403).json({ message: "Only maintainers can delete issues", error: true });
  }
  const issue = await issues_services_default.getIssueById(Number(id));
  if (!issue) {
    return res.status(404).json({ message: "Issue not found", error: true });
  }
  const deleted = await issues_services_default.deleteIssueById(Number(id));
  if (!deleted) {
    return res.status(500).json({ message: "Failed to delete issue", error: true });
  }
  return res.status(200).json({ success: true, message: "Issue deleted successfully" });
};

// src/utility/auth.ts
var auth = async (req, res, next) => {
  const Token = req.headers.authorization;
  if (!Token) {
    return sendResponse(res, { message: "No token provided", error: true }, 401);
  }
  const Payload = verifyToken(Token, "access");
  if (!Payload) {
    return sendResponse(res, { message: "Invalid token", error: true }, 401);
  }
  const user = await auth_servecs_default.getUserById(Payload.id);
  if (!user) {
    return sendResponse(res, { message: "User not found", error: true }, 404);
  }
  req.user = user;
  next();
};

// src/api/router/issues.router.ts
var router2 = Router2();
router2.post("/issues", auth, issues);
router2.get("/issues", getIssues);
router2.get("/issues/:id", getIssueById);
router2.patch("/issues/:id", auth, updateIssue);
router2.delete("/issues/:id", auth, deleteIssue);
var issues_router_default = router2;

// src/app.ts
var app = express();
app.use(logger);
app.use(cookies());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Welcome to DevPulse API");
});
var api = "/api/auth";
app.use(api, auth_router_default);
app.use("/api", issues_router_default);
app.use(globalErrorHandler_default);
var app_default = app;

// src/index.ts
var main = async () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Server is running on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=index.js.map