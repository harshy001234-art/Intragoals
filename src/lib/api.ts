import type { AuthError, User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { Role, User } from "@/lib/store";
import { isSupabaseConfigured, requireSupabase, supabase } from "@/lib/supabase";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "https://goal-nexus-production.up.railway.app/api";

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

const metadataRole = (user: SupabaseAuthUser): Role => {
  const role = user.user_metadata?.role;
  return role === "admin" || role === "manager" || role === "employee" ? role : "employee";
};

const fallbackUserFromSupabase = (user: SupabaseAuthUser): User => {
  const role = metadataRole(user);
  return {
    id: user.id,
    name: metadataName(user),
    email: user.email || "",
    role,
    department: "Intragoals",
    title: roleTitle[role],
    avatarColor: roleColor[role],
  };
};

function normalizeAuthError(error: AuthError | null) {
  if (!error) return "Authentication failed.";
  if (error.message.toLowerCase().includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  return error.message;
}

async function getOrCreateProfile(user: SupabaseAuthUser) {
  const client = requireSupabase();
  const fallback = fallbackUserFromSupabase(user);
  const { data, error } = await client
    .from("profiles")
    .select("id, organization_id, email, full_name, role, department, title, manager_id, avatar_color, entra_object_id")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (data) return profileToAppUser(data);

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  const { data: created, error: createError } = await client
    .from("profiles")
    .upsert({
      id: user.id,
      email: fallback.email,
      full_name: fallback.name,
      role: fallback.role,
      department: fallback.department,
      title: fallback.title,
      avatar_color: fallback.avatarColor,
    })
    .select("id, organization_id, email, full_name, role, department, title, manager_id, avatar_color, entra_object_id")
    .maybeSingle<ProfileRow>();

  if (createError) {
    // If RLS blocks auto-profile creation, still allow the session to work
    // with Auth metadata so admins can fix the profile table later.
    console.warn("Unable to create Supabase profile:", createError.message);
    return fallback;
  }

  return created ? profileToAppUser(created) : fallback;
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

async function legacyRegister(input: { name: string; email: string; password: string }): Promise<RegisterResult> {
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

  async register(input: { name: string; email: string; password: string }): Promise<RegisterResult> {
    if (!isSupabaseConfigured) return legacyRegister(input);

    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.name,
          role: "employee",
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
    if (!isSupabaseConfigured) {
      await apiRequest<{ loggedOut: boolean }>("/auth/logout", { method: "POST" });
      return;
    }

    await requireSupabase().auth.signOut();
  },

  async resetPassword(email: string) {
    if (!isSupabaseConfigured) return;

    const redirectTo = `${window.location.origin}/login`;
    const { error } = await requireSupabase().auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(error.message);
  },

  async signInWithMicrosoft() {
    if (!isSupabaseConfigured) {
      throw new Error("Connect Supabase before enabling Microsoft sign-in.");
    }

    const { error } = await requireSupabase().auth.signInWithOAuth({
      provider: "azure",
      options: {
        redirectTo: `${window.location.origin}/app/dashboard`,
        scopes: "openid email profile offline_access User.Read",
      },
    });
    if (error) throw new Error(error.message);
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

export const demoCredentials: Record<Role, { email: string; password: string }> = {
  employee: { email: "employee@intragoals.com", password: "Password@123" },
  manager: { email: "manager@intragoals.com", password: "Password@123" },
  admin: { email: "admin@intragoals.com", password: "Password@123" },
};
