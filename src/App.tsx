import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DashboardUsuarios from "./pages/DashboardUsuarios";
import ResetPassword from "./pages/ResetPassword";
import SelecionarPerfil from "./pages/SelecionarPerfil";
import NotFound from "./pages/NotFound";
import TransparenciaMapaReciclagem from "./pages/TransparenciaMapaReciclagem";

// Dashboard (Gov)
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardOverview from "./pages/DashboardOverview";
import Rastreabilidade from "./pages/DashboardRastreabilidade";
import Auditoria from "./pages/DashboardAuditoria";
import Alertas from "./pages/DashboardAlertas";

// Module layouts
import CooperativaLayout from "./components/modules/CooperativaLayout";
import IndustriaLayout from "./components/modules/IndustriaLayout";
import PontoColetaLayout from "./components/modules/PontoColetaLayout";

// Cooperativa pages
import CooperativaPainel from "./pages/cooperativa/CooperativaPainel";
import CooperativaLotesEntrada from "./pages/cooperativa/CooperativaLotesEntrada";
import CooperativaFaturamento from "./pages/cooperativa/CooperativaFaturamento";

// Indústria pages
import IndustriaMetasLogisticas from "./pages/industria/IndustriaMetasLogisticas";
import IndustriaCertificados from "./pages/industria/IndustriaCertificados";

// Ponto de Coleta pages
import PontoColetaDashboard from "./pages/ponto-coleta/PontoColetaDashboard";
import PontoColetaNovoRecebimento from "./pages/ponto-coleta/PontoColetaNovoRecebimento";
import PontoColetaMetas from "./pages/ponto-coleta/PontoColetaMetas";
import PontoColetaHistorico from "./pages/ponto-coleta/PontoColetaHistorico";
import PontoColetaCredenciamento from "./pages/ponto-coleta/PontoColetaCredenciamento";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/selecionar-perfil" element={<SelecionarPerfil />} />
            <Route path="/transparencia/mapa-reciclagem" element={<TransparenciaMapaReciclagem />} />

            {/* Gov Dashboard - requires 'gov' role */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="gov">
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardOverview />} />
              <Route path="rastreabilidade" element={<Rastreabilidade />} />
              <Route path="auditoria" element={<Auditoria />} />
              <Route path="alertas" element={<Alertas />} />
              <Route path="usuarios" element={<DashboardUsuarios />} />
            </Route>

            {/* Cooperativa - requires 'cooperativa' role */}
            <Route path="/cooperativa" element={
              <ProtectedRoute requiredRole="cooperativa">
                <CooperativaLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/cooperativa/painel" replace />} />
              <Route path="painel" element={<CooperativaPainel />} />
              <Route path="lotes-entrada" element={<CooperativaLotesEntrada />} />
              <Route path="faturamento" element={<CooperativaFaturamento />} />
            </Route>

            {/* Indústria - requires 'industria' role */}
            <Route path="/industria" element={
              <ProtectedRoute requiredRole="industria">
                <IndustriaLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/industria/metas-logisticas" replace />} />
              <Route path="metas-logisticas" element={<IndustriaMetasLogisticas />} />
              <Route path="certificados" element={<IndustriaCertificados />} />
            </Route>

            {/* Ponto de Coleta - requires 'ponto_coleta' role */}
            <Route path="/ponto-coleta" element={
              <ProtectedRoute requiredRole="ponto_coleta">
                <PontoColetaLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/ponto-coleta/dashboard" replace />} />
              <Route path="dashboard" element={<PontoColetaDashboard />} />
              <Route path="novo-recebimento" element={<PontoColetaNovoRecebimento />} />
              <Route path="historico" element={<PontoColetaHistorico />} />
              <Route path="metas" element={<PontoColetaMetas />} />
              <Route path="credenciamento" element={<PontoColetaCredenciamento />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
