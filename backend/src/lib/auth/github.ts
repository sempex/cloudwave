import axios from "axios";
import qs from "qs";

type GitHubOauthToken = {
  access_token: string;
};

interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: any;
}

interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: string;
  blog: string;
  location: null;
  email: string;
  hireable: boolean;
  bio: string;
  twitter_username: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: Date;
  updated_at: Date;
}

export const getGithubOathToken = async ({
  code,
}: {
  code: string;
}): Promise<GitHubOauthToken> => {
  const rootUrl = "https://github.com/login/oauth/access_token";
  const options = {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code,
  };

  const queryString = qs.stringify(options);

  try {
    const { data } = await axios.post(`${rootUrl}?${queryString}`, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const decoded = qs.parse(data) as GitHubOauthToken;

    return decoded;
  } catch (err: any) {
    throw Error(err);
  }
};

export const getGithubUser = async ({
  access_token,
}: {
  access_token: string;
}): Promise<GitHubUser> => {
  const headers = {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  };

  try {
    const { data } = await axios.get<GitHubUser>(
      "https://api.github.com/user",
      headers
    );

    if (!data.email) {
      const { data: emailData } = await axios.get<GithubEmail[]>(
        "https://api.github.com/user/emails",
        headers
      );

      const primaryMail = emailData.find((email) => email.primary);

      if (!primaryMail) throw Error();

      data.email = primaryMail?.email;
    }

    return data;
  } catch (err: any) {
    throw Error(err);
  }
};
