export default function BuildInfo() {
  // Using typeof avoids ReferenceError when the symbol is undefined
  const commit =
    (typeof __BUILD_COMMIT__ !== 'undefined' && __BUILD_COMMIT__) || '';
  const timeISO =
    (typeof __BUILD_TIME__ !== 'undefined' && __BUILD_TIME__) || '';

  const hash =
    commit ? commit.slice(0, 7) : (import.meta.env.DEV ? 'dev' : '');
  const time = timeISO ? new Date(timeISO).toLocaleString() : '';

  if (!hash && !time) return null;

  return (
    <small style={{ opacity: 0.6 }}>
      build {hash}
      {time ? ` · ${time}` : ''}
    </small>
  );
}
