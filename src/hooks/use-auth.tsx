import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "gov" | "cooperativa" | "industria" | "ponto_coleta" | "super_admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  /** Mantém o identificador usado no carimbo de responsabilidade das exportações. */
  const registrarUsuarioExportacao = (email?: string | null) => {
    try {
      if (email) localStorage.setItem("sinarv-export-user", email);
      else localStorage.removeItem("sinarv-export-user");
    } catch {
      /* storage indisponível */
    }
  };

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("Erro ao carregar perfis do usuário", error);
      setRoles([]);
      return;
    }

    setRoles((data || []).map((r: any) => r.role as AppRole));
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setLoading(true);
          setTimeout(async () => {
            await fetchRoles(session.user.id);
            setLoading(false);
          }, 0);
        } else {
          setRoles([]);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchRoles(session.user.id);
      } else {
        setRoles([]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  const hasRole = (role: AppRole) => {
    // super_admin has access to all modules
    if (roles.includes("super_admin")) return true;
    return roles.includes(role);
  };

  const isSuperAdmin = roles.includes("super_admin");

  return (
    <AuthContext.Provider value={{ user, session, roles, loading, signOut, hasRole, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
