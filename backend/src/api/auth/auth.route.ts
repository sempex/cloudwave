import { Router } from "express";
import { deserializeUser } from "../../middleware/deserializeUser.js";
import { requireUser } from "../../middleware/requireUser.js";
import {
  getGithubOAuthUrl,
  githubOauthHandler,
  logoutHandler,
} from "./auth.handler.js";

const authRouter = Router();

authRouter.get("/github/callback", githubOauthHandler);
authRouter.get("/github", (_, res) => res.redirect(getGithubOAuthUrl()));
// Logout User
authRouter.get("/logout", deserializeUser, requireUser, logoutHandler);

export default authRouter;
