export function Loading() {
  return <p className="muted" style={{ padding: '24px 0' }}>Loading…</p>
}

export function ErrorNote({ message, onRetry }) {
  return (
    <div className="alert">
      <strong>Something went wrong.</strong>
      {message}
      {onRetry && (
        <>
          {' '}
          <a style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={onRetry}>Try again</a>
        </>
      )}
    </div>
  )
}
