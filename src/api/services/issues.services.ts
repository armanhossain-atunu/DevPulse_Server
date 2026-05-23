import type { Request, Response } from "express";
import type { Issue } from "../../types";
import { sql } from "../../db";

class issuesService {
  // issue create
  async issues(issue: Issue) {
    const { title, description, type, reporter_id } = issue;
    const res = await sql`
        INSERT INTO issues (title, description, type,  reporter_id)
        VALUES (${title}, ${description}, ${type},  ${reporter_id})
        RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
    `;
    return res[0];
  }
  // get all issues
  async getAllIssues(query: { sort?: string; type?: string; status?: string }) {
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

    const issues = issuesResult as Issue[];
    // get unique reporter ids
    const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
    // get user data for each issue
    const users = await sql`
 SELECT id, name, role FROM users WHERE id = ANY(${reporterIds})
 `;
    //  create a map of user ids to user objects
    const userMap = new Map(users.map((user) => [user.id, user]));
    //attach user data to each issue
    const finalIssues = issues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter_id: userMap.get(issue.reporter_id) || null,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
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

    async getIssueById(id: number) {
      const issuesResult = await sql`
        SELECT * FROM issues WHERE id = ${id}
      `;
      if (issuesResult.length === 0) {
        return null;
      }
      const issue = issuesResult[0]!;
      // get user data for the issue
      const users = await sql`
        SELECT id, name, role FROM users WHERE id = ${issue.reporter_id}
      `;
      const user = users[0] || null;
      // return issue with user data
      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: user,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
      };
    }

    // update issue by id
    async updateIssueById(
      id: number,
      updates: { title?: string; description?: string; type?: string }
    ) {
      const issuesResult = await sql`
        SELECT * FROM issues WHERE id = ${id}
      `;
      if (issuesResult.length === 0) {
        return null;
      }

      const currentIssue = issuesResult[0]!;
      const title = updates.title ?? currentIssue.title;
      const description = updates.description ?? currentIssue.description;
      const type = updates.type ?? currentIssue.type;
      // Auto-update status to 'in_progress' if issue is being modified from 'open'
      const newStatus = currentIssue.status === 'open' ? 'in_progress' : currentIssue.status;

      const updatedResult = await sql`
        UPDATE issues
        SET title = ${title}, description = ${description}, type = ${type}, status = ${newStatus}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
      `;

      return updatedResult[0];
    }

    // delete issue by id
    async deleteIssueById(id: number) {
      const result = await sql`
        DELETE FROM issues
        WHERE id = ${id}
        RETURNING id
      `;
      return result.length > 0;
    }
}

export default new issuesService();
