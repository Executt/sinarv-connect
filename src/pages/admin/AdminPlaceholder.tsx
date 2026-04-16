import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface AdminPlaceholderProps {
  title: string;
  description: string;
  phase: string;
}

const AdminPlaceholder = ({ title, description, phase }: AdminPlaceholderProps) => {
  return (
    <Card className="shadow-fiori-1 border-dashed">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Construction className="h-4 w-4 text-warning" strokeWidth={1.75} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-wide font-semibold text-warning bg-warning/10 px-2 py-1 rounded">
          Em construção · {phase}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Este submódulo será implementado nas próximas fases do redesenho administrativo.
          A estrutura de menu, rotas e tokens visuais já está pronta.
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminPlaceholder;
