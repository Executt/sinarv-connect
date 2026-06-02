
-- 1. Convert remaining public views to security_invoker
ALTER VIEW public.vw_ranking_estadual SET (security_invoker = true);
ALTER VIEW public.vw_comparativo_municipal SET (security_invoker = true);

-- 2. Restrict contenedores writes to gov/super_admin
DROP POLICY IF EXISTS "Auth insert contenedores" ON public.contenedores;
DROP POLICY IF EXISTS "Auth update contenedores" ON public.contenedores;

CREATE POLICY "Admin insert contenedores"
ON public.contenedores
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admin update contenedores"
ON public.contenedores
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'));

-- 3. Restrict contenedor_localizacoes writes to gov/super_admin
DROP POLICY IF EXISTS "Auth insert contenedor_localizacoes" ON public.contenedor_localizacoes;
DROP POLICY IF EXISTS "Auth update contenedor_localizacoes" ON public.contenedor_localizacoes;

CREATE POLICY "Admin insert contenedor_localizacoes"
ON public.contenedor_localizacoes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admin update contenedor_localizacoes"
ON public.contenedor_localizacoes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'));

-- 4. Harden role_audit_logs: ensure performed_by = auth.uid() and role-scoped
DROP POLICY IF EXISTS "Admin insert audit logs" ON public.role_audit_logs;

CREATE POLICY "Admin insert audit logs"
ON public.role_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'))
  AND performed_by = auth.uid()
);
