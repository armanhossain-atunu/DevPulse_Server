import { Router } from "express";
import { getIssues, getIssueById, issues, updateIssue, deleteIssue } from "../controller/issues.controller";
import { auth } from "../../utility/auth";


const router = Router();
router.post("/issues",auth,  issues);
router.get("/issues",  getIssues );
router.get("/issues/:id",  getIssueById );
router.patch("/issues/:id", auth, updateIssue);
router.delete("/issues/:id", auth, deleteIssue);
export default router;
