import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { logger } from "./middleware/logger";
import globalErrorHandler from "./middleware/globalErrorHandler";
import authRouter from "./api/router/auth.router";
import cookies from "cookie-parser";
import issuesRouter from "./api/router/issues.router";

const app: Application = express();

app.use(logger);
app.use(cookies());
app.use(express.json());


app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to DevPulse API");
});
const api = '/api/auth';
// Mounting the auth router 
app.use(api, authRouter);
app.use("/api", issuesRouter);

app.use(globalErrorHandler);
export default app;
