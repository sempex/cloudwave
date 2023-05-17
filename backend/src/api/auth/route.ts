import { Router } from "express";
import { post } from "./stuff.js";
import passport from "../../lib/auth/passport.js";

const authRouter = Router();

authRouter.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

authRouter.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

export default authRouter;
