import type { Request, Response } from "express";
import issuesServices from "../services/issues.services";
import type { Issue } from "../../types";
// issue create
export const issues = async (req: Request, res: Response) => {
  const { title, description, type } = req.body;
  const reporter_id = req.user?.id; // Assuming auth middleware sets req.user
  if (!title || !description || !type) {
    return res
      .status(400)
      .json({ message: "All fields are required", error: true });
  }
  const issue = await issuesServices.issues({
    title,
    description,
    type,

    reporter_id,
  } as Issue);
  if (!issue) {
    return res
      .status(500)
      .json({ message: "Failed to create issue", error: true });
  }
  return res
    .status(201)
    .json({ message: "Issue created successfully", data: issue });
};

// get all issues
export const getIssues  = async (req: Request, res: Response) => {
  const issues = await issuesServices.getAllIssues(req.query);
  return res
    .status(200)
    .json({ message: "Issues fetched successfully", data: issues });
};

// get single issue
export const getIssueById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res
      .status(400)
      .json({ message: "Invalid issue ID", error: true });
  }
  const issue = await issuesServices.getIssueById(Number(id));
  if (!issue) {
    return res
      .status(404)
      .json({ message: "Issue not found", error: true });
  }
  return res
    .status(200)
    .json({ message: "Issue retrived successfully", data: issue });
};

// update issue
export const updateIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, type } = req.body;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  // Validate ID
  if (!id || isNaN(Number(id))) {
    return res
      .status(400)
      .json({ message: "Invalid issue ID", error: true });
  }

  // Validate request body
  if (!title && !description && !type) {
    return res
      .status(400)
      .json({ message: "At least one field must be provided", error: true });
  }

  // Fetch the issue
  const issue = await issuesServices.getIssueById(Number(id));
  if (!issue) {
    return res
      .status(404)
      .json({ message: "Issue not found", error: true });
  }

  // Check access control
  // Maintainers can update any issue
  // Contributors can only update their own issue if status is open
  if (userRole === "contributor") {
    if (issue.reporter?.id !== userId) {
      return res
        .status(403)
        .json({ message: "You can only update your own issues", error: true });
    }
    if (issue.status !== "open") {
      return res
        .status(403)
        .json({ message: "Contributors can only update open issues", error: true });
    }
  }

  // Update the issue
  const updatedIssue = await issuesServices.updateIssueById(Number(id), {
    title,
    description,
    type,
  });

  if (!updatedIssue) {
    return res
      .status(500)
      .json({ message: "Failed to update issue", error: true });
  }

  return res
    .status(200)
    .json({ message: "Issue updated successfully", data: updatedIssue });
};

// delete issue
export const deleteIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = req.user?.role;

  // Validate ID
  if (!id || isNaN(Number(id))) {
    return res
      .status(400)
      .json({ message: "Invalid issue ID", error: true });
  }

  // Check access control - only maintainers can delete
  if (userRole !== "maintainer") {
    return res
      .status(403)
      .json({ message: "Only maintainers can delete issues", error: true });
  }

  // Fetch the issue to check if it exists
  const issue = await issuesServices.getIssueById(Number(id));
  if (!issue) {
    return res
      .status(404)
      .json({ message: "Issue not found", error: true });
  }

  // Delete the issue
  const deleted = await issuesServices.deleteIssueById(Number(id));

  if (!deleted) {
    return res
      .status(500)
      .json({ message: "Failed to delete issue", error: true });
  }

  return res
    .status(200)

    .json( {success: true, message: "Issue deleted successfully" });
};
