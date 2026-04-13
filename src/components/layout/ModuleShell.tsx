import { Outlet, useLocation } from "react-router-dom";
import GlobalHeader from "./GlobalHeader";

interface PageMeta {
  title: string;
  subtitle: string;
}

interface ModuleShellProps {
  pageTitles?: Record<string, PageMeta>;
  defaultTitle?: string;
  defaultSubtitle?: string;
}

const ModuleShell = ({
  pageTitles = {},
  defaultTitle = "",
  defaultSubtitle = "",
}: ModuleShellProps) => {
  const location = useLocation();
  const page = pageTitles[location.pathname] || {
    title: defaultTitle,
    subtitle: defaultSubtitle,
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <GlobalHeader />
      {/* Page title bar */}
      {page.title && (
        <div className="bg-white border-b border-border px-4 lg:px-6 py-3">
          <h1 className="text-base lg:text-lg font-bold text-foreground">
            {page.title}
          </h1>
          {page.subtitle && (
            <p className="text-xs text-muted-foreground">{page.subtitle}</p>
          )}
        </div>
      )}
      <main className="flex-1 p-4 lg:p-6 space-y-5 overflow-auto bg-[hsl(210,20%,98%)]">
        <Outlet />
      </main>
    </div>
  );
};

export default ModuleShell;
