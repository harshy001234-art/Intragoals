import type { AuthError, User as SupabaseAuthUser } from "@supabase/supabase-js";
import { clearPersistedAppState, type Role, type User } from "@/intragoals/workspace/store";
import { isSupabaseConfigured, requireSupabase, supabase } from "@/lib/supabase";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "https://goal-nexus-production.up.railway.app/api";
export const isMicrosoftAuthEnabled = import.meta.env.VITE_ENABLE_MICROSOFT_AUTH === "true";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type BackendUser = {
  id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "MANAGER" | "ADMIN";
  departmentId?: string | null;
  managerId?: string | null;
};

type ProfileRow = {
  id: string;
  organization_id: string | null;
  email: string;
  full_name: string;
  role: Role;
  department: string | null;
  title: string | null;
  manager_id: string | null;
  avatar_color: string | null;
  entra_object_id?: string | null;
};

export type RegisterResult = {
  user: User | null;
  needsEmailConfirmation: boolean;
};

type UpdateRoleResult = {
  user: User;
};

type OAuthStartResult = {
  url: string;
};

const roleMap: Record<BackendUser["role"], Role> = {
  EMPLOYEE: "employee",
  MANAGER: "manager",
  ADMIN: "admin",
};

const roleTitle: Record<Role, string> = {
  employee: "Employee",
  manager: "Manager",
  admin: "Admin / HR",
};

const roleColor: Record<Role, string> = {
  employee: "#00d8ff",
  manager: "#8438ff",
  admin: "#ff7a18",
};

const toAppUser = (user: BackendUser): User => {
  const role = roleMap[user.role];
  return {
    id: user.id,
    managerId: user.managerId,
    name: user.name,
    email: user.email,
    role,
    department: user.departmentId ?? "Intragoals",
    title: roleTitle[role],
    avatarColor: roleColor[role],
  };
};

const profileToAppUser = (profile: ProfileRow): User => ({
  id: profile.id,
  organizationId: profile.organization_id,
  managerId: profile.manager_id,
  name: profile.full_name || profile.email,
  email: profile.email,
  role: profile.role,
  department: profile.department || "Intragoals",
  title: profile.title || roleTitle[profile.role],
  avatarColor: profile.avatar_color || roleColor[profile.role],
});

const metadataName = (user: SupabaseAuthUser) =>
  typeof user.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name
    : typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : user.email?.split("@")[0] || "Intragoals user";

function normalizeAuthError(error: AuthError | null) {
  if (!error) return "Authentication failed.";
  if (error.message.toLowerCase().includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  return error.message;
}

function clearBrowserAuthArtifacts() {
  if (typeof window === "undefined") return;

  const shouldClear = (key: string) => {
    const normalized = key.toLowerCase();
    return (
      key === "intragoals-state-v2" ||
      key.startsWith("sb-") ||
      normalized.includes("supabase") ||
      normalized.includes("demo")
    );
  };

  for (const storage of [window.localStorage, window.sessionStorage]) {
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && shouldClear(key)) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  }
}

async function getOrCreateProfile(user: SupabaseAuthUser) {
  const client = requireSupabase();
  const { data: bootstrapped, error: bootstrapError } = await client.rpc("bootstrap_workspace", {
    workspace_name: null,
    workspace_domain: null,
  });

  if (bootstrapError) {
    throw new Error(bootstrapError.message);
  }

  if (bootstrapped) return profileToAppUser(bootstrapped as ProfileRow);

  const { data, error } = await client
    .from("profiles")
    .select(
      "id, organization_id, email, full_name, role, department, title, manager_id, avatar_color, entra_object_id",
    )
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (data) return profileToAppUser(data);

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  throw new Error(
    `Unable to initialize your workspace profile for ${user.email || metadataName(user)}. Run the latest Supabase migrations and try again.`,
  );
}

async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...options.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || "Request failed");
  }
  return payload.data;
}

async function legacyLogin(email: string, password: string) {
  const data = await apiRequest<{ user: BackendUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return toAppUser(data.user);
}

async function legacyRegister(input: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const user = await apiRequest<BackendUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...input, role: "EMPLOYEE" }),
  });
  await legacyLogin(input.email, input.password);
  return { user: toAppUser(user), needsEmailConfirmation: false };
}

export const authApi = {
  async login(email: string, password: string) {
    if (!isSupabaseConfigured) return legacyLogin(email, password);

    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new Error(normalizeAuthError(error));
    return getOrCreateProfile(data.user);
  },

  async register(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<RegisterResult> {
    if (!isSupabaseConfigured) return legacyRegister(input);

    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.name,
        },
      },
    });

    if (error) throw new Error(normalizeAuthError(error));
    if (!data.user) throw new Error("Account could not be created.");
    if (!data.session) return { user: null, needsEmailConfirmation: true };

    return { user: await getOrCreateProfile(data.user), needsEmailConfirmation: false };
  },

  async me() {
    if (!isSupabaseConfigured) {
      const user = await apiRequest<BackendUser>("/auth/me");
      return toAppUser(user);
    }

    const client = requireSupabase();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) throw new Error("No active session.");
    return getOrCreateProfile(data.user);
  },

  async logout() {
    try {
      if (!isSupabaseConfigured) {
        await apiRequest<{ loggedOut: boolean }>("/auth/logout", { method: "POST" });
      } else {
        await requireSupabase().auth.signOut({ scope: "local" });
      }
    } finally {
      clearPersistedAppState();
      clearBrowserAuthArtifacts();
    }
  },

  async resetPassword(email: string) {
    if (!isSupabaseConfigured) return;

    const redirectTo = `${window.location.origin}/login`;
    const { error } = await requireSupabase().auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(error.message);
  },

  async signInWithMicrosoft() {
    if (!isMicrosoftAuthEnabled) {
      throw new Error("Microsoft sign-in is not enabled for this workspace yet.");
    }
    if (!isSupabaseConfigured) {
      throw new Error("Connect Supabase before enabling Microsoft sign-in.");
    }

    const { data, error } = await requireSupabase().auth.signInWithOAuth({
      provider: "azure",
      options: {
        redirectTo: `${window.location.origin}/app/dashboard`,
        scopes: "email openid profile offline_access User.Read",
      },
    });
    if (error) throw new Error(error.message);
    if (!data?.url) {
      throw new Error("Microsoft sign-in is not configured in Supabase yet.");
    }
    return { url: data.url } satisfies OAuthStartResult;
  },

  async signInWithSsoDomain(domain: string) {
    if (!isSupabaseConfigured) {
      throw new Error("Connect Supabase before enabling enterprise SSO.");
    }

    const { error } = await requireSupabase().auth.signInWithSSO({
      domain,
      options: {
        redirectTo: `${window.location.origin}/app/dashboard`,
      },
    });
    if (error) throw new Error(error.message);
  },

  hasSupabase: () => Boolean(supabase),
};

export const adminApi = {
  async updateUserRole(userId: string, role: Role): Promise<UpdateRoleResult> {
    const { data, error } = await requireSupabase().rpc("update_profile_role", {
      target_profile_id: userId,
      new_role: role,
    });

    if (error) throw new Error(error.message);

    return {
      user: profileToAppUser(data as ProfileRow),
    };
  },
};

export const demoCredentials: Record<Role, { email: string; password: string }> = {
  employee: { email: "neha.sharma@intragoals.com", password: "password123" },
  manager: { email: "priya.iyer@intragoals.com", password: "password123" },
  admin: { email: "rohan.kapoor@intragoals.com", password: "password123" },
};
