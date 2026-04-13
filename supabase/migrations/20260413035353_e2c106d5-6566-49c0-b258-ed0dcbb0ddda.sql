
CREATE TABLE public.role_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('add', 'remove')),
  performed_by UUID NOT NULL,
  ip_address TEXT,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.role_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gov can view audit logs"
ON public.role_audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'gov'::app_role));

CREATE POLICY "System can insert audit logs"
ON public.role_audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);
