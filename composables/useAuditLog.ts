export async function auditLog(
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'VERIFY',
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null,
  tableName: string,
  rowId: string | null = null
) {
  try {
    const client = useSupabaseClient()
    const user = useSupabaseUser()
    const { error } = await client.from('audit_log').insert({
      action,
      table_name: tableName,
      row_id: rowId ? String(rowId) : null,
      old_values: oldValues,
      new_values: newValues,
      staff_id: user.value?.id || null,
    })
    if (error) console.error('Audit log failed:', error)
  } catch (e) {
    console.error('Audit log exception:', e)
  }
}
