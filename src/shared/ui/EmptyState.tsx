type EmptyStateProps = {
  title: string;
  description: string;
  variant?: 'clients' | 'services' | 'calendar' | 'finance' | 'messages' | 'users';
};

export function EmptyState({ title, description, variant = 'clients' }: EmptyStateProps) {
  return (
    <article className="empty-state">
      <EmptyIllustration title={title} variant={variant} />
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}

function EmptyIllustration({ title, variant }: { title: string; variant: NonNullable<EmptyStateProps['variant']> }) {
  const common = (
    <defs>
      <linearGradient id={`emptyGradient-${variant}`} x1="40" x2="200" y1="25" y2="135" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fb923c" />
        <stop offset="1" stopColor="#ea580c" />
      </linearGradient>
    </defs>
  );
  const gradient = `url(#emptyGradient-${variant})`;

  return (
    <svg viewBox="0 0 240 160" role="img" aria-label={title}>
      {common}
      <path d="M43 126c9-43 34-73 74-83 35-9 69 5 84 34 16 30 4 67-27 77-34 11-69-9-94-13-20-3-32 1-37-15Z" fill={gradient} opacity=".16" />
      {variant === 'clients' && <ClientsSvg gradient={gradient} />}
      {variant === 'services' && <ServicesSvg gradient={gradient} />}
      {variant === 'calendar' && <CalendarSvg gradient={gradient} />}
      {variant === 'finance' && <FinanceSvg gradient={gradient} />}
      {variant === 'messages' && <MessagesSvg gradient={gradient} />}
      {variant === 'users' && <UsersSvg gradient={gradient} />}
    </svg>
  );
}

function ClientsSvg({ gradient }: { gradient: string }) {
  return (
    <>
      <rect x="58" y="46" width="124" height="78" rx="18" fill="var(--surface-solid)" stroke="var(--line)" strokeWidth="3" />
      <circle cx="91" cy="78" r="15" fill={gradient} />
      <path d="M78 108c8-14 28-14 36 0" stroke={gradient} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M128 72h36M128 94h28" stroke={gradient} strokeWidth="8" strokeLinecap="round" />
    </>
  );
}

function ServicesSvg({ gradient }: { gradient: string }) {
  return (
    <>
      <rect x="62" y="44" width="116" height="80" rx="18" fill="var(--surface-solid)" stroke="var(--line)" strokeWidth="3" />
      <path d="M89 87l22 22 43-48" stroke={gradient} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M82 46v-14h76v14" stroke={gradient} strokeWidth="8" strokeLinecap="round" fill="none" />
    </>
  );
}

function CalendarSvg({ gradient }: { gradient: string }) {
  return (
    <>
      <rect x="58" y="40" width="124" height="92" rx="18" fill="var(--surface-solid)" stroke="var(--line)" strokeWidth="3" />
      <path d="M58 68h124M86 32v22M154 32v22" stroke={gradient} strokeWidth="8" strokeLinecap="round" />
      <rect x="82" y="86" width="76" height="14" rx="7" fill={gradient} />
      <rect x="96" y="110" width="48" height="14" rx="7" fill={gradient} opacity=".55" />
    </>
  );
}

function FinanceSvg({ gradient }: { gradient: string }) {
  return (
    <>
      <rect x="58" y="46" width="124" height="78" rx="18" fill="var(--surface-solid)" stroke="var(--line)" strokeWidth="3" />
      <path d="M86 106V82M120 106V62M154 106V74" stroke={gradient} strokeWidth="14" strokeLinecap="round" />
      <path d="M78 112h92" stroke="var(--line)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="174" cy="45" r="17" fill={gradient} />
      <text x="174" y="53" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="800">$</text>
    </>
  );
}

function MessagesSvg({ gradient }: { gradient: string }) {
  return (
    <>
      <path d="M62 58a18 18 0 0118-18h78a18 18 0 0118 18v34a18 18 0 01-18 18h-34l-28 22v-22H80a18 18 0 01-18-18V58Z" fill="var(--surface-solid)" stroke="var(--line)" strokeWidth="3" />
      <path d="M88 68h62M88 88h42" stroke={gradient} strokeWidth="8" strokeLinecap="round" />
      <circle cx="172" cy="42" r="16" fill={gradient} />
    </>
  );
}

function UsersSvg({ gradient }: { gradient: string }) {
  return (
    <>
      <circle cx="120" cy="64" r="24" fill={gradient} />
      <path d="M78 120c14-36 70-36 84 0" stroke={gradient} strokeWidth="14" strokeLinecap="round" fill="none" />
      <circle cx="75" cy="78" r="15" fill={gradient} opacity=".55" />
      <circle cx="165" cy="78" r="15" fill={gradient} opacity=".55" />
      <path d="M50 122c8-20 36-24 50-8M140 114c14-16 42-12 50 8" stroke={gradient} strokeWidth="10" strokeLinecap="round" fill="none" opacity=".55" />
    </>
  );
}
