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
import DashboardBenchmarks from "./pages/DashboardBenchmarks";

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
              <Route path="benchmarks" element={<DashboardBenchmarks />} />
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
              <Route path="regras-negocio" element={<AdminPlaceholder title="Regras de Negócio" description="Editor de parâmetros tipados (numeric/bool/enum/lista) com validação e versionamento." phase="Fase 3" />} />
              <Route path="banco-dados" element={<AdminPlaceholder title="Banco de Dados" description="Métricas read-only do PostgreSQL: versão, tamanho, conexões ativas, top queries." phase="Fase 3" />} />
              <Route path="logs" element={<AdminPlaceholder title="Logs do Sistema" description="Visualizador unificado de admin_session_logs, role_audit_logs e app_logs_sistema com filtros." phase="Fase 3" />} />
              {/* Identidade & Acesso */}
              <Route path="usuarios" element={<AdminPlaceholder title="Usuários" description="CRUD de usuários com filtros por role, entidade e status; ações de bloqueio/reset." phase="Fase 4" />} />
              <Route path="perfis-usuario" element={<AdminPlaceholder title="Perfis de Usuário" description="Gestão de roles do sistema e permissões granulares por módulo." phase="Fase 4" />} />
              <Route path="perfis-entidade" element={<AdminPlaceholder title="Perfis de Entidade" description="Templates de perfil por tipo de entidade (cooperativa, indústria, ponto de coleta)." phase="Fase 4" />} />
              <Route path="ldap" element={<AdminPlaceholder title="LDAP / Active Directory" description="Configuração de servidor LDAP, bind credentials, base DN, mapeamento de atributos e cadastro automático de usuários." phase="Fase 4" />} />
              {/* Integrações */}
              <Route path="integracoes" element={<AdminIntegracoes />} />
              <Route path="webhooks" element={<AdminPlaceholder title="Webhooks" description="CRUD de webhooks com eventos suscritos, header customizado, retry policy e log de envios." phase="Fase 5" />} />
              <Route path="sei" element={<AdminPlaceholder title="SEI" description="Configuração de integração com Sistema Eletrônico de Informações (URL, token, unidade)." phase="Fase 5" />} />
              <Route path="notificacoes" element={<AdminPlaceholder title="Notificações" description="Configuração multi-canal: SMTP, Microsoft Teams, SMS, WhatsApp Business e Telegram, com templates por evento." phase="Fase 5" />} />
              {/* Operacional */}
              <Route path="contenedores" element={<AdminContenedores />} />
              <Route path="localizacoes" element={<AdminLocalizacoes />} />
              <Route path="iot" element={<AdminPlaceholder title="Inventário IoT" description="Catálogo de modelos de dispositivos (sensores de nível, balanças, RFID) e instâncias vinculadas a contenedores." phase="Fase 3" />} />
              <Route path="listas" element={<AdminPlaceholder title="Listas Suspensas" description="CRUD de listas e opções reutilizáveis em formulários do sistema." phase="Fase 3" />} />
              <Route path="acoes-automaticas" element={<AdminPlaceholder title="Ações Automáticas" description="Builder visual de gatilhos: evento → condição → ação (ex: nível alto → notificar coleta)." phase="Fase 3" />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
