-- Junction table for assigning firms to users (Phase 6)
CREATE TABLE user_firms (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, firm_id)
);

-- Enable RLS
ALTER TABLE user_firms ENABLE ROW LEVEL SECURITY;

-- Policies for user_firms
CREATE POLICY "Admins can manage all user_firms assignments"
  ON user_firms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own assignments"
  ON user_firms FOR SELECT
  USING (user_id = auth.uid());
