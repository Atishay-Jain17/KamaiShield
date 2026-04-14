/**
 * KamaiShield logo — "Kamai" green, "Shield" blue.
 * Uses a single line with no gradient clipping issues.
 */
export default function Logo({ height = 32, className = '' }) {
  return (
    <span
      className={`inline-block whitespace-nowrap select-none leading-none ${className}`}
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
        fontSize: `${height}px`,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      <span style={{ color: '#2e7d32' }}>Kamai</span>
      <span style={{ color: '#1565c0' }}>Shield</span>
    </span>
  );
}
