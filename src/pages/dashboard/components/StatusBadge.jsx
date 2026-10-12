import { REQUEST_STATUS } from '@/constants/requestStatus.js'

const statusClasses = {
  [REQUEST_STATUS.PENDING]: 'status-pending',
  [REQUEST_STATUS.IN_PROGRESS]: 'status-progress',
  [REQUEST_STATUS.FINISHED]: 'status-finished',
}

export default function StatusBadge({ status }) {
  return <span className={`status-badge ${statusClasses[status] ?? ''}`}>{status}</span>
}
