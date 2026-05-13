import { STATUS_LABELS } from '../../utils/formatters'

export function StatusBadge({ status }) {
  const { label, cls } = STATUS_LABELS[status] || { label: status, cls: 'badge-gray' }
  return <span className={cls}>{label}</span>
}

export function RoleBadge({ role }) {
  return role === 'admin'
    ? <span className="badge badge-purple">Admin</span>
    : <span className="badge badge-blue">Staff</span>
}
