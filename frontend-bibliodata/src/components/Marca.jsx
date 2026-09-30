export function Marca({ clara = false, compacta = false }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <img src="/logo.svg" alt="" width="36" height="36" className="h-9 w-9 shrink-0" />
      {!compacta && (
        <div className="min-w-0 leading-tight">
          <p className="font-display text-base font-bold truncate" style={{ color: clara ? 'var(--primary-foreground)' : 'var(--foreground)' }}>
            BiblioData+
          </p>
          <p className="text-[11px] font-mono truncate" style={{ color: clara ? 'rgba(245,237,214,0.5)' : 'var(--muted-foreground)' }}>
            I.E. Santa María
          </p>
        </div>
      )}
    </div>
  );
}
