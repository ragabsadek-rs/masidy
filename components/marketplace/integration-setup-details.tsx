"use client";

import { useEffect, useState } from "react";

interface IntegrationSetupDetailsProps {
  apiBaseUrl?: string;
  docsUrl?: string;
  callbackPath?: string;
  notes?: string;
}

export function IntegrationSetupDetails({ apiBaseUrl, docsUrl, callbackPath, notes }: IntegrationSetupDetailsProps) {
  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <section className="rounded-3xl border border-foreground/10 bg-background p-6 shadow-sm shadow-black/5">
      <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Integration configuration
      </div>
      <div className="mt-6 space-y-5 text-sm leading-7 text-foreground/90">
        {notes ? <p>{notes}</p> : null}
        {apiBaseUrl ? (
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Provider API base URL</p>
            <pre className="mt-2 overflow-x-auto rounded-2xl bg-slate-950/5 px-3 py-2 text-xs text-foreground/90">{apiBaseUrl}</pre>
          </div>
        ) : null}
        {callbackPath ? (
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Masidy callback URL</p>
            <pre className="mt-2 overflow-x-auto rounded-2xl bg-slate-950/5 px-3 py-2 text-xs text-foreground/90">
              {origin ? `${origin}${callbackPath}` : callbackPath}
            </pre>
            <p className="mt-2 text-xs text-muted-foreground">
              Use this URL to configure provider webhooks, OAuth redirects, or event delivery inside the provider settings.
            </p>
          </div>
        ) : null}
        {docsUrl ? (
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Provider documentation</p>
            <a href={docsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-semibold text-primary hover:text-primary/80">
              {docsUrl}
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
