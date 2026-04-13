import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
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

// Module layouts
import CooperativaLayout from "./components/modules/CooperativaLayout.tsx";
import IndustriaLayout from "./components/modules/IndustriaLayout.tsx";
import PontoColetaLayout from "./components/modules/PontoColetaLayout.tsx";

// Cooperativa pages
import CooperativaPainel from "./pages/cooperativa/CooperativaPainel.tsx";
import CooperativaLotesEntrada from "./pages/cooperativa/CooperativaLotesEntrada.tsx";
import CooperativaFaturamento from "./pages/cooperativa/CooperativaFaturamento.tsx";

// Indústria pages
import IndustriaMetasLogisticas from "./pages/industria/IndustriaMetasLogisticas.tsx";
import IndustriaCertificados from "./pages/industria/IndustriaCertificados.tsx";

// Ponto de Coleta pages
import PontoColetaDashboard from "./pages/ponto-coleta/PontoColetaDashboard.tsx";
import PontoColetaNovoRecebimento from "./pages/ponto-coleta/PontoColetaNovoRecebimento.tsx";
import PontoColetaMetas from "./pages/ponto-coleta/PontoColetaMetas.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Governo Dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="rastreabilidade" element={<Rastreabilidade />} />
            <Route path="auditoria" element={<Auditoria />} />
            <Route path="alertas" element={<Alertas />} />
          </Route>

          {/* Cooperativa Module */}
          <Route path="/cooperativa" element={<CooperativaLayout />}>
            <Route index element={<Navigate to="/cooperativa/painel" replace />} />
            <Route path="painel" element={<CooperativaPainel />} />
            <Route path="lotes-entrada" element={<CooperativaLotesEntrada />} />
            <Route path="faturamento" element={<CooperativaFaturamento />} />
          </Route>

          {/* Indústria Module */}
          <Route path="/industria" element={<IndustriaLayout />}>
            <Route index element={<Navigate to="/industria/metas-logisticas" replace />} />
            <Route path="metas-logisticas" element={<IndustriaMetasLogisticas />} />
            <Route path="certificados" element={<IndustriaCertificados />} />
          </Route>

          {/* Ponto de Coleta Module */}
          <Route path="/ponto-coleta" element={<PontoColetaLayout />}>
            <Route index element={<Navigate to="/ponto-coleta/dashboard" replace />} />
            <Route path="dashboard" element={<PontoColetaDashboard />} />
            <Route path="novo-recebimento" element={<PontoColetaNovoRecebimento />} />
            <Route path="metas" element={<PontoColetaMetas />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
