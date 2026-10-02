interface Session {
  accessToken: string | null;
  revision: number;
}

interface RefreshDependencies {
  getSession: () => Session;
  requestToken: () => Promise<string>;
  setToken: (token: string) => void;
  expire: () => void;
  normalizeError: (error: unknown) => Error & { status?: number };
  expiredError: () => Error;
}

/** Share one refresh and never let its response overwrite a newer login/logout. */
export function createSessionRefresh(dependencies: RefreshDependencies) {
  let pending: Promise<string> | null = null;
  return function refresh(): Promise<string> {
    if (pending) return pending;
    const revision = dependencies.getSession().revision;
    pending = (async () => {
      try {
        const token = await dependencies.requestToken();
        const current = dependencies.getSession();
        if (current.revision !== revision) {
          if (current.accessToken) return current.accessToken;
          throw dependencies.expiredError();
        }
        dependencies.setToken(token);
        return token;
      } catch (reason) {
        const error = dependencies.normalizeError(reason);
        if (dependencies.getSession().revision === revision && [401, 403].includes(error.status ?? 0)) {
          dependencies.expire();
        }
        throw error;
      } finally {
        pending = null;
      }
    })();
    return pending;
  };
}
