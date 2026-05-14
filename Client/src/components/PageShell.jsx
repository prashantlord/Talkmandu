export default function PageShell({children}) {
    return (
        <div className="min-h-screen bg-[var(--bg)] px-6 py-10">
            <div className="mx-auto flex max-w-6xl flex-col gap-10 fade-up">{children}</div>
        </div>
    );
}
