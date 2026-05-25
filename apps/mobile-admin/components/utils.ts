export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diff = (now.getTime() - then.getTime()) / 1000;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return then.toLocaleDateString('en-GH', { day: 'numeric', month: 'short' });
}

export function formatCurrency(amount: number, currency = 'GHS'): string {
  return `${currency} ${amount.toFixed(2)}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });
}

export const ORDER_STATUSES = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  placed: { bg: '#dbeafe', text: '#1d4ed8' },
  confirmed: { bg: '#ede9fe', text: '#6d28d9' },
  processing: { bg: '#fef9c3', text: '#a16207' },
  shipped: { bg: '#f1f5f9', text: '#475569' },
  delivered: { bg: '#dcfce7', text: '#15803d' },
  cancelled: { bg: '#fee2e2', text: '#dc2626' },
};
