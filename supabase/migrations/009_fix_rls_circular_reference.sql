-- ============================================================
-- FIX: Replace all self-referencing RLS policies
-- Run this in Supabase SQL Editor → Primary Database
-- ============================================================

-- Create a stable, security-definer function that bypasses RLS
-- This breaks the circular reference in the users table policy
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Drop all old policies (they use circular self-referencing subqueries)
DROP POLICY IF EXISTS user_tenant_isolation_policy ON users;
DROP POLICY IF EXISTS tenant_isolation_policy ON tenants;
DROP POLICY IF EXISTS firm_tenant_isolation_policy ON firms;
DROP POLICY IF EXISTS item_tenant_isolation_policy ON items;
DROP POLICY IF EXISTS template_tenant_isolation_policy ON templates;
DROP POLICY IF EXISTS quote_tenant_isolation_policy ON quotes;

-- USERS: Can see own row + all users in same tenant
CREATE POLICY users_policy ON users
  FOR ALL USING (
    id = auth.uid()
    OR tenant_id = public.get_my_tenant_id()
  );

-- TENANTS: Can see own tenant
CREATE POLICY tenants_policy ON tenants
  FOR SELECT USING (id = public.get_my_tenant_id());

-- FIRMS: Isolated by tenant
CREATE POLICY firms_policy ON firms
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- ITEMS: Isolated by tenant
CREATE POLICY items_policy ON items
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- TEMPLATES: Isolated by tenant
CREATE POLICY templates_policy ON templates
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- QUOTES: Isolated by tenant
CREATE POLICY quotes_policy ON quotes
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Verify: should return your own user row
SELECT * FROM public.users WHERE id = auth.uid();
