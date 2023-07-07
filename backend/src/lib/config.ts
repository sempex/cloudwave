export const globalConfig = {
  k8s: {
    svcSuffix: "svc",
    ingressSuffix: "ingress",
    tlsIngressSuffix: "tls-ingress",
    evnSecretSuffix: "env-secret",
    ssl: {
      issuer: "letsencrypt-prod",
      email: "ssl@shiper.app",
    },
  },
  git: {
    githubBaseUrl: "https://github.com",
  },
};
