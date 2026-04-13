
-- Gov users can view all roles
CREATE POLICY "Gov can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'gov'));

-- Gov users can insert roles
CREATE POLICY "Gov can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'gov'));

-- Gov users can delete roles
CREATE POLICY "Gov can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'gov'));

-- Gov users can view all profiles
CREATE POLICY "Gov can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'gov'));
