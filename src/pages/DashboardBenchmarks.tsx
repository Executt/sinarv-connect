import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { Globe, TrendingUp, Recycle, AlertTriangle, CheckCircle2, Building2, Leaf } from "lucide-react";

/* ── Dados de referência ARP-GAN / Eurostat ────────────────────────── */

const taxasReciclagem = [
  { pais: "Alemanha", taxa: 66.1, meta2030: 65 },
  { pais: "Áustria", taxa: 62.5, meta2030: 65 },
  { pais: "Bélgica", taxa: 54.3, meta2030: 65 },
  { pais: "Países Baixos", taxa: 57.2, meta2030: 65 },
  { pais: "Eslovênia", taxa: 59.1, meta2030: 65 },
  { pais: "Itália", taxa: 51.4, meta2030: 65 },
  { pais: "França", taxa: 44.6, meta2030: 65 },
  { pais: "Espanha", taxa: 36.8, meta2030: 65 },
  { pais: "Portugal", taxa: 28.9, meta2030: 65 },
  { pais: "Brasil (est.)", taxa: 4.0, meta2030: 20 },
];

const materiaisARP = [
  { material: "Papel/Papelão", pesoTon: 48200, percentual: 25.1 },
  { material: "PMD (Plástico/Metal)", pesoTon: 35800, percentual: 18.6 },
  { material: "Vidro", pesoTon: 22400, percentual: 11.7 },
  { material: "Resíduos Alimentares", pesoTon: 31600, percentual: 16.4 },
  { material: "Resíduos Verdes", pesoTon: 18900, percentual: 9.8 },
  { material: "WEEE (Eletrônicos)", pesoTon: 8700, percentual: 4.5 },
  { material: "Resíduos Construção", pesoTon: 15200, percentual: 7.9 },
  { material: "Outros", pesoTon: 11500, percentual: 6.0 },
];

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(210, 70%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(35, 85%, 55%)",
  "hsl(120, 50%, 45%)",
  "hsl(280, 50%, 55%)",
  "hsl(0, 60%, 55%)",
  "hsl(210, 20%, 60%)",
];

const radarData = [
  { indicador: "Coleta Seletiva", bruxelas: 92, brasil: 18 },
  { indicador: "Compostagem", bruxelas: 78, brasil: 5 },
  { indicador: "Reciclagem WEEE", bruxelas: 90, brasil: 22 },
  { indicador: "Logística Reversa", bruxelas: 85, brasil: 12 },
  { indicador: "Rastreabilidade", bruxelas: 70, brasil: 8 },
  { indicador: "Inclusão Catadores", bruxelas: 40, brasil: 65 },
];

const recyparkInfo = [
  { nome: "Woluwe-Saint-Pierre", comunas: "WSP + WSL", horario: "7/7 (exceto feriados)", capacidade: "2m³/dia/cidadão" },
  { nome: "Demets", comunas: "Anderlecht", horario: "Ter-Sáb", capacidade: "2m³/dia/cidadão" },
  { nome: "Sud (Forest)", comunas: "Forest + Uccle", horario: "7/7 (exceto feriados)", capacidade: "2m³/dia/cidadão" },
];

const residuosRecusados = [
  "Resíduos residuais (lixo doméstico)",
  "Medicamentos (devolver na farmácia)",
  "Bonbonnes/cartuchos de gás, LPG",
  "Fogos de artifício, explosivos, munições",
  "Peças automotivas e motores a explosão",
  "Pneus de caminhão",
  "Substâncias radioativas",
  "Terra, areia, carvão e fuligem",
  "Amianto",
  "Material de revestimento de telhado",
];

const escalaLansink = [
  { etapa: "Prevenção", descricao: "Evitar a geração do resíduo", nivel: 1, cor: "hsl(120, 60%, 45%)" },
  { etapa: "Reutilização", descricao: "Dar nova vida ao objeto", nivel: 2, cor: "hsl(160, 60%, 45%)" },
  { etapa: "Reciclagem", descricao: "Transformar em matéria-prima", nivel: 3, cor: "hsl(200, 60%, 50%)" },
  { etapa: "Recuperação Energética", descricao: "Incineração com geração de energia", nivel: 4, cor: "hsl(35, 85%, 55%)" },
  { etapa: "Eliminação", descricao: "Aterro sanitário", nivel: 5, cor: "hsl(0, 60%, 50%)" },
];

const DashboardBenchmarks = () => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-[hsl(var(--primary))]">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--primary)/0.1)]">
                <Globe className="h-5 w-5 text-[hsl(var(--primary))]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Referência Analisada</p>
                <p className="text-lg font-bold text-foreground">ARP-GAN</p>
                <p className="text-[10px] text-muted-foreground">Bruxelas, Bélgica</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[hsl(160,60%,45%)]">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(160,60%,45%,0.1)]">
                <Recycle className="h-5 w-5 text-[hsl(160,60%,45%)]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa Reciclagem UE (média)</p>
                <p className="text-lg font-bold text-foreground">49,6%</p>
                <p className="text-[10px] text-muted-foreground">Meta 2030: 65%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[hsl(35,85%,55%)]">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(35,85%,55%,0.1)]">
                <TrendingUp className="h-5 w-5 text-[hsl(35,85%,55%)]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Brasil (estimativa)</p>
                <p className="text-lg font-bold text-foreground">4,0%</p>
                <p className="text-[10px] text-muted-foreground">Meta PLANARES: 20%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[hsl(280,50%,55%)]">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(280,50%,55%,0.1)]">
                <Building2 className="h-5 w-5 text-[hsl(280,50%,55%)]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">RECYPARKs Bruxelas</p>
                <p className="text-lg font-bold text-foreground">5 fixos</p>
                <p className="text-[10px] text-muted-foreground">+ Recypark Mobile 2x/ano</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="comparativo" className="w-full">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="comparativo">Comparativo Europeu</TabsTrigger>
          <TabsTrigger value="materiais">Materiais ARP-GAN</TabsTrigger>
          <TabsTrigger value="recypark">Modelo Recypark</TabsTrigger>
          <TabsTrigger value="lansink">Escala de Lansink</TabsTrigger>
        </TabsList>

        {/* ── Tab: Comparativo ──────────────────────────────── */}
        <TabsContent value="comparativo" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Taxa de Reciclagem por País (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taxasReciclagem} layout="vertical" margin={{ left: 80, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 70]} tick={{ fontSize: 11 }} />
                      <YAxis dataKey="pais" type="category" tick={{ fontSize: 11 }} width={75} />
                      <Tooltip
                        contentStyle={{ background: "white", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                        formatter={(value: number, name: string) => [`${value}%`, name === "taxa" ? "Taxa Atual" : "Meta 2030"]}
                      />
                      <Bar dataKey="taxa" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Taxa Atual" />
                      <Bar dataKey="meta2030" fill="hsl(var(--primary)/0.2)" radius={[0, 4, 4, 0]} name="Meta 2030" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Radar: Bruxelas vs Brasil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="70%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="indicador" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                      <Radar name="Bruxelas (ARP-GAN)" dataKey="bruxelas" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                      <Radar name="Brasil (SINARV)" dataKey="brasil" stroke="hsl(160, 60%, 45%)" fill="hsl(160, 60%, 45%)" fillOpacity={0.2} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ranking Europeu — Detalhamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {taxasReciclagem.map((p) => (
                  <div key={p.pais} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-28 text-right truncate">{p.pais}</span>
                    <div className="flex-1">
                      <Progress value={p.taxa} className="h-3" />
                    </div>
                    <span className="text-xs font-bold w-12 text-right">{p.taxa}%</span>
                    <Badge variant={p.taxa >= p.meta2030 ? "default" : "secondary"} className="text-[10px] px-1.5">
                      {p.taxa >= p.meta2030 ? "✓ Meta" : `Falta ${(p.meta2030 - p.taxa).toFixed(1)}pp`}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Materiais ──────────────────────────────── */}
        <TabsContent value="materiais" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Composição de Resíduos — Bruxelas (ARP-GAN)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={materiaisARP}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        innerRadius={50}
                        dataKey="percentual"
                        nameKey="material"
                        label={({ material, percentual }) => `${material.split(" ")[0]} ${percentual}%`}
                        labelLine
                      >
                        {materiaisARP.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "white", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                        formatter={(v: number, _: string, entry: any) => [`${v}% (${entry.payload.pesoTon.toLocaleString("pt-BR")} ton)`, entry.payload.material]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sistema de Sacolas por Cor — Bruxelas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { cor: "bg-yellow-400", nome: "Amarelo", tipo: "Papel e Papelão", destino: "Reciclagem de fibras" },
                    { cor: "bg-blue-500", nome: "Azul (PMD)", tipo: "Plástico, Metal, Cartonados", destino: "Fost Plus → reciclagem" },
                    { cor: "bg-orange-400", nome: "Laranja", tipo: "Resíduos Alimentares", destino: "Biometanização (15d a 37°C)" },
                    { cor: "bg-green-500", nome: "Verde", tipo: "Resíduos de Jardim", destino: "Compostagem (5-6 meses)" },
                    { cor: "bg-white border border-gray-300", nome: "Branco", tipo: "Resíduos Residuais", destino: "Incineração + recuperação energética" },
                  ].map((s) => (
                    <div key={s.nome} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border">
                      <div className={`w-5 h-5 rounded-full ${s.cor} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{s.nome} — {s.tipo}</p>
                        <p className="text-[10px] text-muted-foreground">{s.destino}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-[hsl(var(--primary)/0.05)] rounded-lg border border-[hsl(var(--primary)/0.15)]">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <Leaf className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                    <strong>Obrigatório desde 15/05/2023:</strong> Triagem de resíduos alimentares em toda Bruxelas. Multa: €50-200.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Parceiros do Ecossistema de Reciclagem Belga</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { nome: "Fost Plus", area: "Embalagens PMD" },
                  { nome: "Bebat", area: "Pilhas e baterias" },
                  { nome: "Recycpel", area: "Eletroeletrônicos (90% reciclados)" },
                  { nome: "Recytyre", area: "Pneus" },
                  { nome: "Valorfrit", area: "Óleos de cozinha" },
                  { nome: "Valorlub", area: "Óleos lubrificantes" },
                  { nome: "Valumat", area: "Colchões" },
                  { nome: "Les Petits Riens", area: "Reutilização / economia social" },
                ].map((p) => (
                  <div key={p.nome} className="p-2.5 rounded-lg bg-muted/30 border border-border text-center">
                    <p className="text-xs font-semibold text-foreground">{p.nome}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{p.area}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Recypark ──────────────────────────────── */}
        <TabsContent value="recypark" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[hsl(var(--primary))]" />
                  Modelo Recypark — Pontos de Coleta Europeu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Os <strong>Recyparks</strong> são centros de coleta seletiva geridos pela ARP-GAN onde cidadãos depositam resíduos volumosos e especializados. Modelo de referência para os Pontos de Coleta do SINARV.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-semibold">Recypark</th>
                        <th className="text-left py-2 font-semibold">Comunas</th>
                        <th className="text-left py-2 font-semibold">Horário</th>
                        <th className="text-left py-2 font-semibold">Limite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recyparkInfo.map((r) => (
                        <tr key={r.nome} className="border-b border-border/50">
                          <td className="py-2 font-medium">{r.nome}</td>
                          <td className="py-2 text-muted-foreground">{r.comunas}</td>
                          <td className="py-2 text-muted-foreground">{r.horario}</td>
                          <td className="py-2 text-muted-foreground">{r.capacidade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 rounded-lg bg-[hsl(var(--primary)/0.05)] border border-[hsl(var(--primary)/0.15)]">
                  <p className="text-[10px] font-semibold text-foreground mb-1">Regras de Acesso</p>
                  <ul className="text-[10px] text-muted-foreground space-y-0.5 list-disc list-inside">
                    <li>Apresentação obrigatória de cartão de identidade</li>
                    <li>Residência na comuna correspondente</li>
                    <li>Pagamento somente por cartão bancário</li>
                    <li>Veículos &lt; 3,5 toneladas; ciclistas aceitos</li>
                    <li>Resíduos devem ser pré-triados por categoria</li>
                    <li>Recuperação de objetos é proibida</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Resíduos Recusados no Recypark
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {residuosRecusados.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-destructive/5 border border-destructive/10">
                      <span className="text-destructive text-xs mt-0.5">✕</span>
                      <span className="text-xs text-foreground">{r}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[hsl(160,60%,45%)]" />
                Espaço Réemploi (Reutilização) — Dentro dos Recyparks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Operado pela ASBL <strong>Les Petits Riens</strong>, os objetos em bom estado são triados, limpos, reparados e revendidos — promovendo a economia social e circular.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[hsl(160,60%,45%,0.05)] border border-[hsl(160,60%,45%,0.15)]">
                  <p className="text-[10px] font-semibold text-foreground mb-1">✓ Aceitos</p>
                  <p className="text-[10px] text-muted-foreground">Textêis, livros, bicicletas, malas, pequenos eletrodomésticos, louças, brinquedos completos, pelúcias limpas, pequenos móveis</p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <p className="text-[10px] font-semibold text-foreground mb-1">✕ Recusados</p>
                  <p className="text-[10px] text-muted-foreground">Textêis contaminados/sujos/molhados, cassetes VHS, louça quebrada</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Escala de Lansink ──────────────────────────────── */}
        <TabsContent value="lansink" className="space-y-5 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Escala de Lansink — Hierarquia de Tratamento de Resíduos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                A <strong>Escala de Lansink</strong> (Ad Lansink, 1979) é a hierarquia de gestão de resíduos adotada pela UE e aplicada pela ARP-GAN nos Recyparks. O SINARV utiliza esta referência para classificar o destino dos materiais rastreados.
              </p>
              <div className="space-y-3">
                {escalaLansink.map((e) => (
                  <div key={e.etapa} className="flex items-stretch gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: e.cor }}
                      >
                        {e.nivel}
                      </div>
                      {e.nivel < 5 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-semibold text-foreground">{e.etapa}</p>
                      <p className="text-xs text-muted-foreground">{e.descricao}</p>
                    </div>
                    <div className="shrink-0">
                      <Badge
                        variant={e.nivel <= 2 ? "default" : e.nivel <= 3 ? "secondary" : "outline"}
                        className="text-[10px]"
                      >
                        {e.nivel <= 2 ? "Prioritário" : e.nivel === 3 ? "Recomendado" : "Último recurso"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Aplicação no SINARV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs font-semibold text-foreground">Ponto de Coleta</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Nível 3 — Reciclagem. Recebe materiais pré-triados dos cidadãos e envia para cooperativas.</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs font-semibold text-foreground">Cooperativa</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Nível 2-3 — Reutilização/Reciclagem. Processa, tria e despacha materiais para a indústria.</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs font-semibold text-foreground">Indústria</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Nível 3 — Reciclagem. Transforma resíduo em matéria-prima e emite Certificados de Reciclagem.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fonte */}
      <div className="text-[10px] text-muted-foreground text-center py-2 border-t border-border">
        Dados baseados em: ARP-GAN / Bruxelles-Propreté (arp-gan.be) • Eurostat Recycling Rates • PLANARES/MMA Brasil — Abril 2026
      </div>
    </div>
  );
};

export default DashboardBenchmarks;
