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
import RegrasTriagem from "./pages/RegrasTriagem";

// Dashboard (Gov)
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardOverview from "./pages/DashboardOverview";
import Rastreabilidade from "./pages/DashboardRastreabilidade";
import Auditoria from "./pages/DashboardAuditoria";
import Alertas from "./pages/DashboardAlertas";
import DashboardBenchmarks from "./pages/DashboardBenchmarks";
import DashboardLixoes from "./pages/DashboardLixoes";
import DashboardSustentabilidade from "./pages/DashboardSustentabilidade";
import DashboardRadarRejeitos from "./pages/DashboardRadarRejeitos";
import DashboardResiduosCriticos from "./pages/DashboardResiduosCriticos";

// Module layouts
import CooperativaLayout from "./components/modules/CooperativaLayout";
import IndustriaLayout from "./components/modules/IndustriaLayout";
import PontoColetaLayout from "./components/modules/PontoColetaLayout";

// Cooperativa pages
import CooperativaPainel from "./pages/cooperativa/CooperativaPainel";
import CooperativaLotesEntrada from "./pages/cooperativa/CooperativaLotesEntrada";
import CooperativaFaturamento from "./pages/cooperativa/CooperativaFaturamento";
import CooperativaRecepcao from "./pages/cooperativa/CooperativaRecepcao";
import CooperativaDespacho from "./pages/cooperativa/CooperativaDespacho";
import CooperativaCadastro from "./pages/cooperativa/CooperativaCadastro";

// Indústria pages
import IndustriaMetasLogisticas from "./pages/industria/IndustriaMetasLogisticas";
import IndustriaCertificados from "./pages/industria/IndustriaCertificados";
import IndustriaDashboardESG from "./pages/industria/IndustriaDashboardESG";
import IndustriaIntegracao from "./pages/industria/IndustriaIntegracao";
import IndustriaCadastro from "./pages/industria/IndustriaCadastro";

// Ponto de Coleta pages
import PontoColetaDashboard from "./pages/ponto-coleta/PontoColetaDashboard";
import PontoColetaNovoRecebimento from "./pages/ponto-coleta/PontoColetaNovoRecebimento";
import PontoColetaMetas from "./pages/ponto-coleta/PontoColetaMetas";
import PontoColetaHistorico from "./pages/ponto-coleta/PontoColetaHistorico";
import PontoColetaCredenciamento from "./pages/ponto-coleta/PontoColetaCredenciamento";
import PontoColetaServicos from "./pages/ponto-coleta/PontoColetaServicos";
import PontoColetaConfiguracoes from "./pages/ponto-coleta/PontoColetaConfiguracoes";

// Admin pages
import AdminLayout from "./components/modules/AdminLayout";
import AdminPainel from "./pages/admin/AdminPainel";
import AdminContenedores from "./pages/admin/AdminContenedores";
import AdminLocalizacoes from "./pages/admin/AdminLocalizacoes";
import AdminIntegracoes from "./pages/admin/AdminIntegracoes";
import AdminParametros from "./pages/admin/AdminParametros";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";
import AdminRegrasNegocio from "./pages/admin/AdminRegrasNegocio";
import AdminListasSuspensas from "./pages/admin/AdminListasSuspensas";
import AdminAcoesAutomaticas from "./pages/admin/AdminAcoesAutomaticas";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminBancoDados from "./pages/admin/AdminBancoDados";
import AdminInventarioIoT from "./pages/admin/AdminInventarioIoT";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminPerfisUsuario from "./pages/admin/AdminPerfisUsuario";
import AdminPerfisEntidade from "./pages/admin/AdminPerfisEntidade";
import AdminLDAP from "./pages/admin/AdminLDAP";
import AdminWebhooks from "./pages/admin/AdminWebhooks";
import AdminSEI from "./pages/admin/AdminSEI";
import AdminNotificacoes from "./pages/admin/AdminNotificacoes";
import AdminImportacoes from "./pages/admin/AdminImportacoes";

// Admin IA
import AdminAiModelos from "./pages/admin/AdminAiModelos";
import AdminAiMcp from "./pages/admin/AdminAiMcp";
import AdminAiBaseConhecimento from "./pages/admin/AdminAiBaseConhecimento";
import AdminAiSkills from "./pages/admin/AdminAiSkills";
import AdminAiAgentes from "./pages/admin/AdminAiAgentes";
import AdminAiTokens from "./pages/admin/AdminAiTokens";
import AdminAiCotas from "./pages/admin/AdminAiCotas";
import AdminAiConsumo from "./pages/admin/AdminAiConsumo";

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
            <Route path="/regras-triagem" element={<RegrasTriagem />} />
            <Route path="/lixoes" element={<Navigate to="/dashboard/lixoes" replace />} />

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
              <Route path="benchmarks" element={<DashboardBenchmarks />} />
              <Route path="lixoes" element={<DashboardLixoes />} />
              <Route path="sustentabilidade" element={<DashboardSustentabilidade />} />
              <Route path="radar-rejeitos" element={<DashboardRadarRejeitos />} />
              <Route path="residuos-criticos" element={<DashboardResiduosCriticos />} />
            </Route>

            {/* Cooperativa - requires 'cooperativa' role */}
            <Route path="/cooperativa" element={
              <ProtectedRoute requiredRole="cooperativa">
                <CooperativaLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/cooperativa/painel" replace />} />
              <Route path="painel" element={<CooperativaPainel />} />
              <Route path="recepcao" element={<CooperativaRecepcao />} />
              <Route path="lotes-entrada" element={<CooperativaLotesEntrada />} />
              <Route path="despacho" element={<CooperativaDespacho />} />
              <Route path="faturamento" element={<CooperativaFaturamento />} />
              <Route path="cadastro" element={<CooperativaCadastro />} />
            </Route>

            {/* Indústria - requires 'industria' role */}
            <Route path="/industria" element={
              <ProtectedRoute requiredRole="industria">
                <IndustriaLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/industria/dashboard" replace />} />
              <Route path="dashboard" element={<IndustriaDashboardESG />} />
              <Route path="metas-logisticas" element={<IndustriaMetasLogisticas />} />
              <Route path="integracao" element={<IndustriaIntegracao />} />
              <Route path="certificados" element={<IndustriaCertificados />} />
              <Route path="cadastro" element={<IndustriaCadastro />} />
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
              <Route path="servicos" element={<PontoColetaServicos />} />
              <Route path="configuracoes" element={<PontoColetaConfiguracoes />} />
            </Route>

            {/* Admin - requires 'super_admin' role */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="super_admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/painel" replace />} />
              {/* Sistema */}
              <Route path="painel" element={<AdminPainel />} />
              <Route path="parametros" element={<AdminParametros />} />
              <Route path="regras-negocio" element={<AdminRegrasNegocio />} />
              <Route path="banco-dados" element={<AdminBancoDados />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="importacoes" element={<AdminImportacoes />} />
              {/* Identidade & Acesso */}
              <Route path="usuarios" element={<AdminUsuarios />} />
              <Route path="perfis-usuario" element={<AdminPerfisUsuario />} />
              <Route path="perfis-entidade" element={<AdminPerfisEntidade />} />
              <Route path="ldap" element={<AdminLDAP />} />
              {/* Integrações */}
              <Route path="integracoes" element={<AdminIntegracoes />} />
              <Route path="webhooks" element={<AdminWebhooks />} />
              <Route path="sei" element={<AdminSEI />} />
              <Route path="notificacoes" element={<AdminNotificacoes />} />
              {/* Operacional */}
              <Route path="contenedores" element={<AdminContenedores />} />
              <Route path="localizacoes" element={<AdminLocalizacoes />} />
              <Route path="iot" element={<AdminInventarioIoT />} />
              <Route path="listas" element={<AdminListasSuspensas />} />
              <Route path="acoes-automaticas" element={<AdminAcoesAutomaticas />} />
              {/* IA & Agentes */}
              <Route path="ia/modelos" element={<AdminAiModelos />} />
              <Route path="ia/mcp" element={<AdminAiMcp />} />
              <Route path="ia/base-conhecimento" element={<AdminAiBaseConhecimento />} />
              <Route path="ia/skills" element={<AdminAiSkills />} />
              <Route path="ia/agentes" element={<AdminAiAgentes />} />
              <Route path="ia/tokens" element={<AdminAiTokens />} />
              <Route path="ia/cotas" element={<AdminAiCotas />} />
              <Route path="ia/consumo" element={<AdminAiConsumo />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
