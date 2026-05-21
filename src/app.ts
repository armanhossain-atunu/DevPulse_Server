import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { logger } from "./middleware/logger";
import globalErrorHandler from "./middleware/globalErrorHandler";
import authRouter from "./api/router/auth.router";

const app: Application = express();

app.use(logger);
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});
const api = '/api/auth';
app.use(api, authRouter);
app.use(globalErrorHandler);
export default app;
