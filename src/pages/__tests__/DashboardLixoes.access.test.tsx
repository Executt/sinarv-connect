import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Mocked auth state - mutable between tests
const authState: {
  user: any;
  loading: boolean;
  roles: string[];
} = { user: null, loading: false, roles: [] };

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: authState.user,
    loading: authState.loading,
    roles: authState.roles,
    hasRole: (r: string) => authState.roles.includes("super_admin") || authState.roles.includes(r),
  }),
}));

const renderRoute = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard/lixoes"]}>
      <Routes>
        <Route
          path="/dashboard/lixoes"
          element={
            <ProtectedRoute requiredRole="gov">
              <div>LIXOES_CONTENT</div>
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<div>AUTH_PAGE</div>} />
        <Route path="/" element={<div>HOME</div>} />
        <Route path="/selecionar-perfil" element={<div>SELECIONAR_PERFIL</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("ProtectedRoute for /dashboard/lixoes", () => {
  beforeEach(() => {
    authState.user = null;
    authState.loading = false;
    authState.roles = [];
  });

  it("renders content for role 'gov'", () => {
    authState.user = { id: "u1" };
    authState.roles = ["gov"];
    renderRoute();
    expect(screen.getByText("LIXOES_CONTENT")).toBeInTheDocument();
  });

  it("renders content for role 'super_admin'", () => {
    authState.user = { id: "u2" };
    authState.roles = ["super_admin"];
    renderRoute();
    expect(screen.getByText("LIXOES_CONTENT")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to /auth", () => {
    renderRoute();
    expect(screen.getByText("AUTH_PAGE")).toBeInTheDocument();
    expect(screen.queryByText("LIXOES_CONTENT")).not.toBeInTheDocument();
  });

  it("blocks 'cooperativa' role and redirects to home", () => {
    authState.user = { id: "u3" };
    authState.roles = ["cooperativa"];
    renderRoute();
    expect(screen.getByText("HOME")).toBeInTheDocument();
    expect(screen.queryByText("LIXOES_CONTENT")).not.toBeInTheDocument();
  });

  it("blocks 'industria' role and redirects to home", () => {
    authState.user = { id: "u4" };
    authState.roles = ["industria"];
    renderRoute();
    expect(screen.getByText("HOME")).toBeInTheDocument();
  });

  it("redirects users without any role to /selecionar-perfil", () => {
    authState.user = { id: "u5" };
    authState.roles = [];
    renderRoute();
    expect(screen.getByText("SELECIONAR_PERFIL")).toBeInTheDocument();
  });
});
