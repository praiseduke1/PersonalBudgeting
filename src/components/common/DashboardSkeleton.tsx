export default function DashboardSkeleton() {
  return (
    <>
      {/* Budget Skeleton */}
      <section className="card card-premium" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <div className="skeleton" style={{ width: '200px', height: '14px', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ width: '160px', height: '28px' }} />
          </div>
          <div>
            <div className="skeleton" style={{ width: '60px', height: '14px', marginBottom: '0.5rem', marginLeft: 'auto' }} />
            <div className="skeleton" style={{ width: '120px', height: '24px', marginLeft: 'auto' }} />
          </div>
        </div>
        <div className="skeleton" style={{ width: '100%', height: '8px', borderRadius: '9999px' }} />
        <div className="skeleton" style={{ width: '180px', height: '14px', marginTop: '0.5rem' }} />
      </section>

      {/* Summary Cards Skeleton */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div className="skeleton" style={{ width: '140px', height: '16px' }} />
              <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            </div>
            <div className="skeleton" style={{ width: '180px', height: '28px', marginBottom: '0.25rem' }} />
            <div className="skeleton" style={{ width: '100px', height: '14px' }} />
          </div>
        ))}
      </section>

      {/* Charts Skeleton */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[1, 2].map(i => (
          <div key={i} className="card">
            <div className="skeleton" style={{ width: '180px', height: '18px', marginBottom: '1rem' }} />
            <div className="skeleton" style={{ width: '100%', height: '250px', borderRadius: 'var(--radius-md)' }} />
          </div>
        ))}
      </section>

      {/* Table Skeleton */}
      <section className="card">
        <div className="skeleton" style={{ width: '200px', height: '18px', marginBottom: '1rem' }} />
        <div className="table-container">
          <div style={{ padding: '1rem' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.75rem 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                <div className="skeleton" style={{ width: '15%', height: '16px' }} />
                <div className="skeleton" style={{ width: '15%', height: '16px' }} />
                <div className="skeleton" style={{ width: '30%', height: '16px' }} />
                <div className="skeleton" style={{ width: '10%', height: '16px' }} />
                <div className="skeleton" style={{ width: '15%', height: '16px', marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
