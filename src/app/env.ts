import { z } from 'zod';

const EnvSchema = z.object({
  VITE_GITHUB_CLIENT_ID: z.string().optional().default(''),
  VITE_GITHUB_REDIRECT_URI: z.string().optional().default(''),
  // Token exchange must happen server-side due to GitHub CORS. Provide a proxy endpoint.
  // Example: https://<your-worker>.<subdomain>.workers.dev
  VITE_OAUTH_PROXY_URL: z.string().optional().default(''),
  VITE_CONTENT_REPO_OWNER: z.string().optional().default('local'),
  VITE_CONTENT_REPO_NAME: z.string().optional().default('blog-content'),
  VITE_ALLOWED_USERS: z.string().optional(),
  VITE_BASE_PATH: z.string().optional(),
  VITE_LOCAL_MODE: z.string().optional()
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function getEnv(): AppEnv {
  // 개발 편의: 로컬 모드에서는 env 없이도 실행 가능해야 한다.
  // (배포/운영에서 필요한 값이 없으면 Write 기능만 비활성화)
  return EnvSchema.parse(import.meta.env);
}

export function getAllowedUsers(env: AppEnv): string[] | null {
  const raw = env.VITE_ALLOWED_USERS?.trim();
  if (!raw) return null;
  const users = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return users.length ? users : null;
}
