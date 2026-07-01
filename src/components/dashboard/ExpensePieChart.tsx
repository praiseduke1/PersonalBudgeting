import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Transaction } from '../../types'

interface ExpensePieChartProps {
  transactions: Transaction[]
}

const COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16']

export default function ExpensePieChart({ transactions }: ExpensePieChartProps) {
  const expenses = transactions.filter(t => t.type === 'expense')
  if (expenses.length === 0) return null

  const grouped: Record<string, number> = {}
  expenses.forEach(t => {
    grouped[t.category] = (grouped[t.category] || 0) + t.amount
  })

  const data = Object.entries(grouped).map(([name, value]) => ({ name, value }))

  return (
    <section className="card">
      <h3 style={{ marginBottom: '1rem' }}>Pengeluaran per Kategori</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
            paddingAngle={3} dataKey="value">
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </section>
  )
}
