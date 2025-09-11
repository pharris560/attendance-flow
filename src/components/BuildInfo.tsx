export default function BuildInfo() {
  const hash = (__BUILD_COMMIT__ || '').slice(0, 7) || (import.meta.env.DEV ? 'dev' : '');
  const time = __BUILD_TIME__ ? new Date(__BUILD_TIME__).toLocaleString() : '';

  // Hide entirely if we don't have anything to show (e.g., local dev)
  if (!hash && !time) return null;

  return (
    <small style={{ opacity: 0.6 }}>
      build {hash}{time ? ` · ${time}` : ''}
    </small>
  );
}
