function Logo({ size = 40 }) {
  return (
    <span className="pc-logo" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size * 0.58} height={size * 0.58} aria-hidden="true">
        <path d="M4 20C4 10.5 9.5 4.5 20.5 4c0 11-6 16.5-14 16.5-.9 0-1.7-.1-2.5-.5Z" fill="currentColor" />
      </svg>
    </span>
  );
}

export default Logo;
