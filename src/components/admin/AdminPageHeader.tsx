import { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

const AdminPageHeader = ({ title, description, icon, actions }: AdminPageHeaderProps) => (
  <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
    <div className="flex items-start gap-2.5">
      {icon && <div className="mt-0.5 p-1.5 rounded-md bg-primary/10 text-primary">{icon}</div>}
      <div>
        <h2 className="text-base font-semibold text-foreground leading-tight">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export default AdminPageHeader;
