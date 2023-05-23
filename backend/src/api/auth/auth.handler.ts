import { NextFunction, Request, Response } from "express";
import { getGithubOathToken, getGithubUser } from "../../lib/auth/github.js";
import { prisma } from "../../lib/db/prisma.js";
import jwt from "jsonwebtoken";
import queryString from "query-string";

export function exclude<User, Key extends keyof User>(
  user: User,
  keys: Key[]
): Omit<User, Key> {
  for (let key of keys) {
    delete user[key];
  }
  return user;
}

export const logoutHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.cookie("token", "", { maxAge: -1 });
    res.status(200).json({ status: "success" });
  } catch (err: any) {
    next(err);
  }
};

export const githubOauthHandler = async (req: Request, res: Response) => {
  const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;

  try {
    const code = req.query.code as string;
    const pathUrl = (req.query.state as string) ?? "/";

    if (req.query.error) {
      return res.redirect(`${FRONTEND_ORIGIN}/login`);
    }

    if (!code) {
      return res.status(401).json({
        status: "error",
        message: "Authorization code not provided!",
      });
    }

    const { access_token } = await getGithubOathToken({ code });

    const { email, avatar_url, login, id } = await getGithubUser({
      access_token,
    });

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        createdAt: new Date(),
        githubId: String(id),
        name: login,
        email,
        photo: avatar_url,
        verified: true,
        provider: "GitHub",
      },
      update: { name: login, email, photo: avatar_url, provider: "GitHub" },
    });

    if (!user)
      return res.status(500).send({
        status: "error",
        message: "No Valid user",
      });

    const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN as unknown as number;
    const TOKEN_SECRET = process.env.SESSION_SECRET as unknown as string;
    const token = jwt.sign({ sub: user.id }, TOKEN_SECRET, {
      expiresIn: `${TOKEN_EXPIRES_IN}m`,
    });

    res.cookie("token", token, {
      expires: new Date(Date.now() + TOKEN_EXPIRES_IN * 60 * 1000),
    });

    res.redirect(`${FRONTEND_ORIGIN}${pathUrl}`);
  } catch (err: any) {
    console.error(err);

    return res.redirect(`${FRONTEND_ORIGIN}/oauth/error`);
  }
};

export const getGithubOAuthUrl = () => {
  const params = queryString.stringify({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL + "/auth/github/callback",
    scope: ["user:email"].join(" "),
    allow_signup: true,
  });

  return `https://github.com/login/oauth/authorize?${params}`;
};
