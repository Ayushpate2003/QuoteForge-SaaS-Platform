-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Tenants: Users can see their own tenant
CREATE POLICY tenant_isolation_policy ON tenants
  FOR SELECT USING (id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Firms: Isolated by tenant
CREATE POLICY firm_tenant_isolation_policy ON firms
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Users: Isolated by tenant
CREATE POLICY user_tenant_isolation_policy ON users
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Items: Isolated by tenant
CREATE POLICY item_tenant_isolation_policy ON items
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Templates: Isolated by tenant
CREATE POLICY template_tenant_isolation_policy ON templates
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Quotes: Isolated by tenant
CREATE POLICY quote_tenant_isolation_policy ON quotes
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
