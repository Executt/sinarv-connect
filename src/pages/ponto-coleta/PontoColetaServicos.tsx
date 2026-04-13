import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Recycle, Box, Truck, Calendar, ClipboardCheck, AlertTriangle,
  Leaf, Zap, Beaker, HardHat, Package, Info,
} from "lucide-react";

/* ── Modelo ARP-GAN adaptado ao SINARV ─────────────────── */

const CONTENEDORES = [
  {
    cor: "bg-blue-500", nome: "Contenedor Azul", material: "PMC (Plástico / Metal / Cartonados)",
    volumes: ["240L", "660L", "1100L"], icone: Recycle,
    descricao: "Embalagens plásticas, latas de alumínio, embalagens tetra pak e embalagens de metal.",
    boas_praticas: ["Esvaziar e enxaguar embalagens", "Não amassar latas", "Remover tampas plásticas grandes"],
  },
  {
    cor: "bg-yellow-400", nome: "Contenedor Amarelo", material: "Papel e Papelão",
    volumes: ["240L", "660L", "1100L"], icone: Box,
    descricao: "Jornais, revistas, papelão ondulado, caixas de papel, papel de escritório.",
    boas_praticas: ["Remover fitas adesivas", "Dobrar caixas de papelão", "Não incluir papel plastificado ou engordurado"],
  },
  {
    cor: "bg-green-600", nome: "Contenedor Verde", material: "Vidro",
    volumes: ["240L", "660L"], icone: Beaker,
    descricao: "Garrafas de vidro, frascos, potes de conserva. Sem cerâmica ou espelhos.",
    boas_praticas: ["Remover tampas metálicas", "Não incluir vidro temperado", "Separar por cor quando possível"],
  },
  {
    cor: "bg-orange-500", nome: "Contenedor Laranja", material: "Resíduos Alimentares / Orgânicos",
    volumes: ["25L", "120L", "240L"], icone: Leaf,
    descricao: "Restos de alimentos, cascas de frutas/legumes, borra de café, sachês de chá.",
    boas_praticas: ["Usar sacola biodegradável", "Não incluir óleos de cozinha", "Evitar ossos grandes"],
  },
  {
    cor: "bg-gray-700", nome: "Contenedor Cinza/Preto", material: "Resíduos Residuais (Rejeito)",
    volumes: ["120L", "240L", "660L", "1100L"], icone: Package,
    descricao: "Materiais não recicláveis que não se enquadram nas demais categorias.",
    boas_praticas: ["Último recurso — priorizar triagem", "Fraldas e absorventes", "Resíduos sanitários"],
  },
];

const COLETA_ESPECIFICA = [
  { tipo: "REEE (Resíduos Eletroeletrônicos)", icone: Zap, exemplos: "Computadores, celulares, TVs, impressoras, cabos", procedimento: "Depositar em Ecoponto especializado ou solicitar coleta agendada", regulamentacao: "PNRS Art. 33 — Logística reversa obrigatória" },
  { tipo: "Resíduos Químicos / Perigosos", icone: AlertTriangle, exemplos: "Tintas, solventes, baterias automotivas, lâmpadas fluorescentes", procedimento: "Armazenar separadamente e solicitar coleta especial credenciada", regulamentacao: "Resolução CONAMA 401/2008" },
  { tipo: "Resíduos de Construção (RCC)", icone: HardHat, exemplos: "Entulho, concreto, gesso, telhas, pisos cerâmicos", procedimento: "Caçamba ou contenedor dedicado (10m³ a 36m³)", regulamentacao: "Resolução CONAMA 307/2002" },
  { tipo: "Óleos de Cozinha Usados", icone: Beaker, exemplos: "Óleo vegetal usado de frituras", procedimento: "Coletar em garrafas PET e entregar no Ecoponto", regulamentacao: "PNRS Art. 33 — Acordo setorial" },
  { tipo: "Pneus Inservíveis", icone: Recycle, exemplos: "Pneus de automóveis e motocicletas", procedimento: "Entregar em pontos Reciclanip ou ecopontos parceiros", regulamentacao: "Resolução CONAMA 416/2009" },
];

const SERVICOS_COMPLEMENTARES = [
  { nome: "Coleta Seletiva Programada", descricao: "Definição de frequência e dias fixos de coleta por fração de material, otimizando rotas e custos.", referencia: "Modelo ARP-GAN — Bruxelles-Propreté Pro" },
  { nome: "Locação de Compactadores", descricao: "Contenedores de alta capacidade (10m³ a 36m³) com compactação integrada para grandes geradores.", referencia: "ARP-GAN — Contrats PRO" },
  { nome: "Coleta Eventual / Eventos", descricao: "Serviço temporário de gestão de resíduos para feiras, festivais, mercados e eventos públicos.", referencia: "ARP-GAN — Nettoyage événementiel" },
  { nome: "Consultoria em Gestão de Resíduos", descricao: "Elaboração de Planos de Gerenciamento (PGRS) com minimização na fonte e conformidade regulatória.", referencia: "ARP-GAN — Suivi et conseil" },
  { nome: "Sacolas Comerciais Certificadas", descricao: "Venda de sacolas identificadas por cor e volume (30L, 50L, 80L) para estabelecimentos credenciados.", referencia: "ARP-GAN — Sacs commerciaux" },
];

const RESIDUOS_PROIBIDOS = [
  "Resíduos hospitalares/infectantes (Grupo A)",
  "Substâncias radioativas",
  "Explosivos, munições e fogos de artifício",
  "Peças automotivas com fluidos (motor, câmbio)",
  "Amianto e materiais friáveis",
  "Medicamentos controlados (devolver na farmácia)",
  "Animais mortos",
  "Resíduos industriais Classe I (alta periculosidade)",
];

const PontoColetaServicos = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-sm border-l-4 border-l-[hsl(var(--primary))]">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--primary)/0.1)]">
              <Info className="h-5 w-5 text-[hsl(var(--primary))]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Catálogo de Serviços — Modelo ARP-GAN / SINARV</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Referência baseada no modelo europeu da <strong>Bruxelles-Propreté Pro (ARP-GAN)</strong>, adaptado às diretrizes 
                da <strong>PNRS (Lei 12.305/2010)</strong> e do <strong>PLANARES</strong>. Este catálogo orienta os pontos de 
                coleta credenciados sobre as melhores práticas de triagem, contenedores e serviços disponíveis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="contenedores" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="contenedores" className="text-xs gap-1.5">
            <Box className="h-3.5 w-3.5" /> Contenedores
          </TabsTrigger>
          <TabsTrigger value="especifica" className="text-xs gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Coleta Específica
          </TabsTrigger>
          <TabsTrigger value="servicos" className="text-xs gap-1.5">
            <Truck className="h-3.5 w-3.5" /> Serviços
          </TabsTrigger>
          <TabsTrigger value="proibidos" className="text-xs gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Itens Proibidos
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Contenedores ──────────────────────────── */}
        <TabsContent value="contenedores" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONTENEDORES.map((c) => (
              <Card key={c.nome} className="shadow-sm overflow-hidden">
                <div className={`h-2 ${c.cor}`} />
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <c.icone className="h-4 w-4 text-foreground/60" />
                    {c.nome}
                  </CardTitle>
                  <CardDescription className="text-xs">{c.material}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{c.descricao}</p>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Volumes Disponíveis</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {c.volumes.map((v) => (
                        <Badge key={v} variant="outline" className="text-[10px] px-2">{v}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Boas Práticas de Triagem</p>
                    <ul className="space-y-1">
                      {c.boas_praticas.map((bp) => (
                        <li key={bp} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                          <span className="text-[hsl(var(--success))] mt-0.5">✓</span> {bp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Escala de Capacidade */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Escala de Capacidade — Contenedores Especiais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { tipo: "Contenedor Padrão", faixa: "120L — 1.100L", uso: "Estabelecimentos de pequeno a médio porte", pct: 25 },
                  { tipo: "Contenedor Grande", faixa: "3m³ — 10m³", uso: "Centros comerciais, condomínios, hospitais", pct: 50 },
                  { tipo: "Compactador", faixa: "10m³ — 20m³", uso: "Indústrias, galpões logísticos", pct: 75 },
                  { tipo: "Roll-on/Roll-off", faixa: "20m³ — 36m³", uso: "Obras de construção, grandes geradores", pct: 100 },
                ].map((item) => (
                  <div key={item.tipo} className="flex items-center gap-4">
                    <div className="w-32 shrink-0">
                      <p className="text-xs font-semibold text-foreground">{item.tipo}</p>
                      <p className="text-[10px] text-muted-foreground">{item.faixa}</p>
                    </div>
                    <div className="flex-1">
                      <Progress value={item.pct} className="h-2" />
                    </div>
                    <p className="text-[10px] text-muted-foreground w-44 text-right shrink-0">{item.uso}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Coleta Específica ─────────────────────── */}
        <TabsContent value="especifica" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COLETA_ESPECIFICA.map((ce) => (
              <Card key={ce.tipo} className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ce.icone className="h-4 w-4 text-[hsl(var(--warning))]" />
                    {ce.tipo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Exemplos</p>
                    <p className="text-xs text-foreground">{ce.exemplos}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Procedimento</p>
                    <p className="text-xs text-foreground">{ce.procedimento}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] mt-1">{ce.regulamentacao}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Tab: Serviços Complementares ────────────────── */}
        <TabsContent value="servicos" className="space-y-4 mt-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Serviços Disponíveis para Pontos de Coleta Credenciados</CardTitle>
              <CardDescription className="text-xs">
                Baseados no catálogo de serviços da ARP-GAN (Bruxelles-Propreté Pro), adaptados ao contexto brasileiro.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Serviço</TableHead>
                    <TableHead className="text-xs font-semibold">Descrição</TableHead>
                    <TableHead className="text-xs font-semibold hidden md:table-cell">Referência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SERVICOS_COMPLEMENTARES.map((s) => (
                    <TableRow key={s.nome}>
                      <TableCell className="text-xs font-medium align-top">{s.nome}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.descricao}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground hidden md:table-cell">{s.referencia}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Fluxo Operacional */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-[hsl(var(--primary))]" />
                Fluxo Operacional — Da Coleta à Cooperativa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                {[
                  { etapa: "1. Recepção", desc: "Cidadão entrega material no Ponto de Coleta", icone: "📥" },
                  { etapa: "2. Pesagem", desc: "Aferição do peso em balança calibrada", icone: "⚖️" },
                  { etapa: "3. Triagem", desc: "Classificação por tipo de material e contenedor", icone: "🔍" },
                  { etapa: "4. Armazenamento", desc: "Contenedor apropriado por cor/fração", icone: "📦" },
                  { etapa: "5. Despacho", desc: "Envio consolidado para cooperativa credenciada", icone: "🚛" },
                ].map((e, i) => (
                  <div key={e.etapa} className="flex-1 relative">
                    <div className="bg-muted/30 rounded-lg border border-border p-3 text-center h-full flex flex-col justify-center">
                      <span className="text-2xl mb-1">{e.icone}</span>
                      <p className="text-[10px] font-bold text-foreground">{e.etapa}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{e.desc}</p>
                    </div>
                    {i < 4 && (
                      <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-muted-foreground/40 text-lg">
                        →
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Itens Proibidos ────────────────────────── */}
        <TabsContent value="proibidos" className="space-y-4 mt-4">
          <Card className="shadow-sm border-l-4 border-l-[hsl(var(--destructive))]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-[hsl(var(--destructive))]">
                <AlertTriangle className="h-4 w-4" />
                Resíduos NÃO Aceitos em Pontos de Coleta
              </CardTitle>
              <CardDescription className="text-xs">
                Os materiais abaixo requerem destinação especializada e não podem ser recebidos em ecopontos regulares.
                O descarte irregular está sujeito a multas conforme Lei 12.305/2010.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RESIDUOS_PROIBIDOS.map((r) => (
                  <div key={r} className="flex items-center gap-2 p-2.5 rounded-lg bg-[hsl(var(--destructive)/0.05)] border border-[hsl(var(--destructive)/0.15)]">
                    <span className="text-[hsl(var(--destructive))] text-sm shrink-0">✕</span>
                    <span className="text-xs text-foreground">{r}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sanções */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Penalidades por Descarte Irregular</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Infração</TableHead>
                    <TableHead className="text-xs font-semibold">Base Legal</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Multa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { infracao: "Resíduo perigoso em contenedor comum", base: "PNRS Art. 51", multa: "R$ 5.000 — R$ 50.000.000" },
                    { infracao: "Resíduo hospitalar sem tratamento", base: "RDC ANVISA 222/2018", multa: "R$ 2.000 — R$ 1.500.000" },
                    { infracao: "Uso de sacolas comerciais não certificadas", base: "Decreto Municipal", multa: "R$ 500 — R$ 5.000" },
                    { infracao: "Descarte de REEE em lixo comum", base: "PNRS Art. 33 §6º", multa: "R$ 500 — R$ 2.000.000" },
                  ].map((p) => (
                    <TableRow key={p.infracao}>
                      <TableCell className="text-xs">{p.infracao}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.base}</TableCell>
                      <TableCell className="text-xs text-right font-semibold text-[hsl(var(--destructive))]">{p.multa}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PontoColetaServicos;
