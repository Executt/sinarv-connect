
CREATE TABLE IF NOT EXISTS public.admin_session_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_accessed text NOT NULL,
  session_start timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view own logs"
  ON public.admin_session_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert logs"
  ON public.admin_session_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'super_admin'));
