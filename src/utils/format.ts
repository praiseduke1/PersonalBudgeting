export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID')
}

export function formatDateInput(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0]
}

export function getMonthBounds(selectedMonth: string) {
  const startDate = selectedMonth + '-01'
  const endDate = new Date(new Date(startDate).getTime() + 31 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10)
  return { startDate, endDate }
}

export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function getMonthName(date: Date): string {
  return MONTH_NAMES[date.getMonth()]
}

export function generateCSV(headers: string[], rows: string[][]): string {
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`
  return [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
}

export function downloadFile(content: string, filename: string, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
