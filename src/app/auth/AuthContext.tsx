import { Octokit } from '@octokit/rest';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAllowedUsers, getEnv } from '../env';
import { clearPkceSession, startGitHubLogin } from './githubOAuth';

type AuthState = {
  accessToken: string | null;
  username: string | null;
};

type AuthContextValue = {
  state: AuthState;
  isAllowedUser: boolean;
  login: (returnTo: string) => Promise<void>;
  logout: () => void;
  getOctokit: () => Octokit;
  setAuth: (next: { accessToken: string; username: string }) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ accessToken: null, username: null });

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e.detail as { token?: string; username?: string };
      if (!detail?.token || !detail?.username) return;
      setState({ accessToken: detail.token, username: detail.username });
    };
    window.addEventListener('blog-auth', handler as any);
    return () => window.removeEventListener('blog-auth', handler as any);
  }, []);

  const env = getEnv();
  const allowed = getAllowedUsers(env);
  const isAllowedUser = allowed ? (state.username ? allowed.includes(state.username) : false) : true;

  const value = useMemo<AuthContextValue>(() => {
    return {
      state,
      isAllowedUser,
      login: async (returnTo: string) => {
        await startGitHubLogin(returnTo);
      },
      logout: () => {
        clearPkceSession();
        setState({ accessToken: null, username: null });
      },
      getOctokit: () => {
        if (!state.accessToken) throw new Error('Not authenticated.');
        return new Octokit({ auth: state.accessToken });
      },
      setAuth: (next) => setState({ accessToken: next.accessToken, username: next.username })
    };
  }, [isAllowedUser, state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext missing.');
  return ctx;
}

export async function hydrateUser(accessToken: string) {
  const octokit = new Octokit({ auth: accessToken });
  const me = await octokit.users.getAuthenticated();
  return me.data.login;
}

