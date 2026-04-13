import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="max-w-3xl">
          <div
            className="inline-flex items-center gap-2 bg-primary-light text-primary px-3 py-1 rounded-full text-sm font-medium mb-6 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0ms", animationFillMode: "forwards" }}
          >
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Sistema em operação
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-6 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "150ms", animationFillMode: "forwards" }}
          >
            Rastreabilidade completa dos resíduos sólidos recicláveis do Brasil
          </h2>
          <p
            className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl opacity-0 animate-fade-in-up"
            style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
          >
            O SINARV é a plataforma oficial do Governo Federal para monitoramento, rastreio e valorização 
            de materiais recicláveis em todo o território nacional. Transparência, dados abertos e impacto 
            ambiental mensurável.
          </p>
          <div
            className="flex flex-wrap gap-3 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "450ms", animationFillMode: "forwards" }}
          >
            <Button className="bg-accent text-accent-foreground hover:bg-primary-glow/90 px-6 py-3 h-auto text-base font-semibold rounded-lg">
              Consultar Dados Públicos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary px-6 py-3 h-auto text-base rounded-lg">
              Saiba Mais sobre o SINARV
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
