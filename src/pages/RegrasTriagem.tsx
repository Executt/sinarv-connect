import GovHeader from "@/components/landing/GovHeader";
import GovFooter from "@/components/landing/GovFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Recycle, Newspaper, Wine, Package, Cpu, Battery, Droplet, Leaf,
  CheckCircle2, XCircle, AlertTriangle, Info,
} from "lucide-react";

const categorias = [
  {
    icon: Newspaper,
    color: "text-info",
    titulo: "Papel e Papelão",
    aceitos: ["Jornais, revistas, folhetos", "Caixas de papelão (desmontadas e secas)", "Cadernos sem espiral metálica", "Embalagens longa vida (Tetra Pak limpas)"],
    rejeitados: ["Papel higiênico ou guardanapos usados", "Papel plastificado / parafinado", "Fotografias e papel carbono", "Papéis sujos com gordura ou alimentos"],
    dica: "Mantenha sempre seco e dobrado. Papel molhado perde valor e contamina o lote.",
  },
  {
    icon: Package,
    color: "text-warning",
    titulo: "Plásticos",
    aceitos: ["Garrafas PET (refrigerantes, água)", "Embalagens de produtos de limpeza", "Sacolas e sacos plásticos limpos", "Potes de iogurte / margarina lavados", "Tampas, brinquedos e canos"],
    rejeitados: ["Plásticos metalizados (sacos de salgadinho)", "Adesivos e fitas adesivas", "Espuma (isopor sujo, EVA pequeno)", "Cabos de panela, tomadas"],
    dica: "Lave rapidamente para retirar resíduos orgânicos. Compacte garrafas para ocupar menos espaço.",
  },
  {
    icon: Wine,
    color: "text-success",
    titulo: "Vidro",
    aceitos: ["Garrafas (cerveja, vinho, suco)", "Frascos de conserva", "Potes de cosméticos", "Cacos limpos embalados em jornal"],
    rejeitados: ["Espelhos e vidros planos (janelas)", "Cristal, cerâmica e porcelana", "Lâmpadas (descarte separado)", "Tubos de TV e box temperado"],
    dica: "Embale cacos em jornal e identifique como “VIDRO QUEBRADO” para proteger o coletor.",
  },
  {
    icon: Recycle,
    color: "text-fiori-accent-9",
    titulo: "Metais e Alumínio",
    aceitos: ["Latas de alumínio (refrigerante, cerveja)", "Latas de aço (sardinha, leite em pó)", "Tampas metálicas, arames, pregos", "Sucata de cobre, chumbo, zinco"],
    rejeitados: ["Latas de tinta ou solvente", "Embalagens de aerossol pressurizadas", "Esponjas de aço usadas", "Pilhas e baterias"],
    dica: "Compacte latas com o pé. Aumenta a eficiência logística e reduz emissões de transporte.",
  },
  {
    icon: Cpu,
    color: "text-fiori-accent-5",
    titulo: "Resíduos Eletrônicos (REEE)",
    aceitos: ["Celulares e carregadores", "Computadores e periféricos", "Pequenos eletrodomésticos", "Cabos e placas eletrônicas"],
    rejeitados: ["Eletrônicos com vazamento de líquidos", "Equipamentos médicos contaminados", "Lâmpadas fluorescentes (canal específico)"],
    dica: "Entregue sempre em pontos de coleta credenciados. Logística reversa obrigatória pela PNRS.",
  },
  {
    icon: Battery,
    color: "text-destructive",
    titulo: "Pilhas e Baterias",
    aceitos: ["Pilhas alcalinas e recarregáveis", "Baterias de celular e notebook", "Baterias automotivas (em revendedores)"],
    rejeitados: ["Pilhas vazando (manuseio especial)", "Misturar com lixo comum"],
    dica: "Logística reversa obrigatória. Devolva em supermercados, lojas ou ecopontos credenciados.",
  },
  {
    icon: Droplet,
    color: "text-fiori-accent-6",
    titulo: "Óleo de Cozinha Usado",
    aceitos: ["Óleo vegetal usado (filtrado)", "Gorduras animais (em frascos PET vedados)"],
    rejeitados: ["Óleo misturado com água ou solventes", "Óleo de motor / lubrificantes (canal próprio)"],
    dica: "1 litro de óleo contamina até 25 mil litros de água. Acondicione em garrafas PET fechadas.",
  },
  {
    icon: Leaf,
    color: "text-success",
    titulo: "Resíduos Orgânicos",
    aceitos: ["Restos de frutas, legumes e verduras", "Borra de café, cascas de ovo", "Folhas, podas e grama"],
    rejeitados: ["Carnes e laticínios (atraem vetores)", "Fezes de animais", "Óleos e gorduras"],
    dica: "Compostagem doméstica reduz em até 50% o volume da lixeira. Procure ecopontos com aceitação.",
  },
];

const principios = [
  { titulo: "Reduzir", desc: "Consuma de forma consciente. O melhor resíduo é aquele que não se gera.", icon: AlertTriangle },
  { titulo: "Reutilizar", desc: "Dê um segundo uso a embalagens, frascos e materiais antes do descarte.", icon: Recycle },
  { titulo: "Reciclar", desc: "Separe corretamente para que o material possa retornar ao ciclo produtivo.", icon: CheckCircle2 },
  { titulo: "Recuperar", desc: "Materiais que ainda têm valor energético devem seguir rotas de recuperação.", icon: Info },
];

const RegrasTriagem = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GovHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-14 md:py-20">
          <div className="container max-w-7xl mx-auto px-4 text-center">
            <Badge className="mb-4 bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20">Educação Ambiental</Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
              Regras de Triagem de Reciclagem
            </h1>
            <p className="text-primary-foreground/90 max-w-3xl mx-auto text-lg">
              Orientações práticas para separar corretamente seus resíduos e maximizar o aproveitamento da cadeia de reciclagem brasileira.
            </p>
            <p className="text-primary-foreground/70 text-sm mt-4">
              Conteúdo inspirado nas melhores práticas internacionais (referência: ARP-GAN — Bélgica).
            </p>
          </div>
        </section>

        {/* Princípios 4R */}
        <section className="py-12 md:py-16 bg-surface">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Princípio dos 4R</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">A hierarquia da gestão sustentável de resíduos sólidos.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {principios.map((p) => {
                const Icon = p.icon;
                return (
                  <Card key={p.titulo} className="bg-card border-border hover:border-primary/40 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center mb-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{p.titulo}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{p.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Categorias de materiais */}
        <section className="py-12 md:py-16">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Como separar cada material</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Confira o que pode e o que não pode ser depositado em cada categoria. A correta separação aumenta o valor do material e protege os trabalhadores da reciclagem.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {categorias.map((c) => {
                const Icon = c.icon;
                return (
                  <Card key={c.titulo} className="bg-card border-border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-lg bg-primary-light flex items-center justify-center ${c.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg">{c.titulo}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <h4 className="text-sm font-semibold text-success">Aceitos</h4>
                        </div>
                        <ul className="space-y-1 text-sm text-foreground/80 ml-6 list-disc">
                          {c.aceitos.map((i) => <li key={i}>{i}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="h-4 w-4 text-destructive" />
                          <h4 className="text-sm font-semibold text-destructive">Não aceitos</h4>
                        </div>
                        <ul className="space-y-1 text-sm text-foreground/80 ml-6 list-disc">
                          {c.rejeitados.map((i) => <li key={i}>{i}</li>)}
                        </ul>
                      </div>
                      <div className="bg-primary-light/60 border border-primary/20 rounded-md p-3 flex items-start gap-2">
                        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-sm text-foreground/90"><span className="font-semibold">Dica: </span>{c.dica}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Boas práticas */}
        <section className="py-12 md:py-16 bg-surface">
          <div className="container max-w-7xl mx-auto px-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-2xl">Boas práticas universais</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {[
                    "Esvazie e enxágue rapidamente embalagens com restos de alimentos.",
                    "Separe os materiais por categoria — não misture papel com plástico.",
                    "Compacte garrafas e latas para reduzir volume de transporte.",
                    "Não amasse caixas de papelão antes de retirar etiquetas grandes.",
                    "Mantenha o material seco até a coleta.",
                    "Embale cacos de vidro em jornal e identifique.",
                    "Procure pontos de coleta credenciados para REEE, pilhas e óleo.",
                    "Organize a coleta seletiva em sua casa, escola ou empresa.",
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <GovFooter />
    </div>
  );
};

export default RegrasTriagem;
