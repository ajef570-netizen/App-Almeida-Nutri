/**
 * Neon Auth Client Configuration for Almeida Nutri
 */

export const NEON_AUTH_URL = "https://ep-summer-waterfall-b69ce26g.neonauth.c-2.sa-east-1.aws.neon.tech/neondb/auth";
const STORAGE_KEY = "almeida_nutri_auth_session";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt?: string;
}

export interface SessionData {
  user: User;
  token?: string;
  expiresAt?: string;
}

export interface AuthResponse {
  user?: User;
  session?: {
    id: string;
    userId: string;
    token: string;
    expiresAt?: string;
  };
  token?: string;
  error?: {
    message: string;
    code?: string;
    status?: number;
  };
  message?: string;
}

/**
 * Traduz mensagens de erro do Neon Auth para português amigável
 */
export function translateAuthError(errorMsg: string): string {
  const msg = errorMsg.toLowerCase();

  if (msg.includes("invalid password") || msg.includes("invalid credentials") || msg.includes("invalid email or password")) {
    return "E-mail ou senha incorretos. Por favor, verifique seus dados e tente novamente.";
  }
  if (msg.includes("user already exists") || msg.includes("already exists") || msg.includes("email already in use")) {
    return "Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.";
  }
  if (msg.includes("password must be at least") || msg.includes("password is too short")) {
    return "A senha deve ter no mínimo 9 caracteres.";
  }
  if (msg.includes("invalid email") || msg.includes("email format")) {
    return "Por favor, informe um endereço de e-mail válido.";
  }
  if (msg.includes("failed to fetch") || msg.includes("network error")) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
  }

  return errorMsg || "Ocorreu um erro ao processar sua solicitação. Tente novamente.";
}

/**
 * Salva a sessão no localStorage
 */
export function saveLocalSession(data: SessionData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Erro ao salvar sessão local:", e);
  }
}

/**
 * Recupera a sessão do localStorage
 */
export function getStoredSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.user && parsed.user.email) {
      return parsed;
    }
  } catch (e) {
    console.error("Erro ao ler sessão do storage:", e);
  }
  return null;
}

/**
 * Remove a sessão do localStorage
 */
export function clearLocalSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Erro ao limpar sessão local:", e);
  }
}

/**
 * Realiza cadastro no Neon Auth
 */
export async function signUpWithNeon(name: string, email: string, password: string): Promise<User> {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  const response = await fetch(`${NEON_AUTH_URL}/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: trimmedName,
      email: trimmedEmail,
      password: password,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.message || data?.error?.message || "Falha ao realizar cadastro.";
    throw new Error(translateAuthError(errorMessage));
  }

  // Extrai dados do usuário da resposta
  const user: User = data?.user || {
    id: data?.id || crypto.randomUUID(),
    name: trimmedName,
    email: trimmedEmail,
    createdAt: new Date().toISOString(),
  };

  const token = data?.token || data?.session?.token;

  saveLocalSession({
    user,
    token,
  });

  return user;
}

/**
 * Realiza login no Neon Auth
 */
export async function signInWithNeon(email: string, password: string): Promise<User> {
  const trimmedEmail = email.trim().toLowerCase();

  const response = await fetch(`${NEON_AUTH_URL}/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: trimmedEmail,
      password: password,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.message || data?.error?.message || "E-mail ou senha inválidos.";
    throw new Error(translateAuthError(errorMessage));
  }

  const user: User = data?.user || {
    id: data?.id || "user_" + Date.now(),
    name: data?.name || "Nutricionista",
    email: trimmedEmail,
    createdAt: new Date().toISOString(),
  };

  const token = data?.token || data?.session?.token;

  saveLocalSession({
    user,
    token,
  });

  return user;
}

/**
 * Encerra a sessão
 */
export async function signOutFromNeon(): Promise<void> {
  try {
    const session = getStoredSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.token) {
      headers["Authorization"] = `Bearer ${session.token}`;
    }

    await fetch(`${NEON_AUTH_URL}/sign-out`, {
      method: "POST",
      headers,
    }).catch(() => null);
  } finally {
    clearLocalSession();
  }
}

/**
 * Verifica a sessão ativa
 */
export async function checkNeonSession(): Promise<User | null> {
  const stored = getStoredSession();
  if (!stored) return null;

  try {
    const headers: Record<string, string> = {};
    if (stored.token) {
      headers["Authorization"] = `Bearer ${stored.token}`;
    }

    const res = await fetch(`${NEON_AUTH_URL}/get-session`, {
      headers,
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.user) {
        saveLocalSession({
          user: data.user,
          token: data.token || stored.token,
        });
        return data.user;
      }
    }
  } catch (err) {
    console.warn("Neon auth server check skipped, using stored session:", err);
  }

  // Se a sessão local existe e o servidor estiver temporariamente inacessível, mantém logado
  return stored.user;
}
