import { supabase } from '../config/supabase';

interface AuditLogOptions {
  tenant_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_values?: any;
  new_values?: any;
}

export const logAudit = async (options: AuditLogOptions) => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        tenant_id: options.tenant_id,
        user_id: options.user_id,
        action: options.action,
        resource_type: options.resource_type,
        resource_id: options.resource_id,
        old_values: options.old_values,
        new_values: options.new_values,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Audit log error:', error);
    }
  } catch (err) {
    console.error('Failed to log audit:', err);
  }
};
