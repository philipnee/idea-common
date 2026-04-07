export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-12 text-ink">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Idea Commons
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Build in progress.
            </h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted">
            The lean browse, post, and fire flow is being wired up from the
            active spec.
          </p>
        </header>
      </div>
    </main>
  );
}

