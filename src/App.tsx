import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import DashboardLayout from "./components/dashboard/DashboardLayout.tsx";
import DashboardOverview from "./pages/DashboardOverview.tsx";
import Rastreabilidade from "./pages/DashboardRastreabilidade.tsx";
import Auditoria from "./pages/DashboardAuditoria.tsx";
import Alertas from "./pages/DashboardAlertas.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="rastreabilidade" element={<Rastreabilidade />} />
            <Route path="auditoria" element={<Auditoria />} />
            <Route path="alertas" element={<Alertas />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
