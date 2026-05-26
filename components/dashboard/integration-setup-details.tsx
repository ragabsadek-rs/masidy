"use client";

import { ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";

interface IntegrationSetupDetailsProps {
  apiBaseUrl?: string;
  docsUrl?: string;
  callbackPath?: string;
  notes?: string;
}

export function IntegrationSetupDetails({
  apiBaseUrl,
  docsUrl,
  callbackPath,
  notes,
}: IntegrationSetupDetailsProps) {
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const callbackUrl = callbackPath ? `${appUrl}${callbackPath}` : null;

  function copyCallback() {
    if (!callbackUrl) return;
    navigator.clipboard.writeText(callbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!apiBaseUrl && !docsUrl && !callbackPath && !notes) return null;

  return (
    <div className="mt-3 pt-3 border-t border-foreground/10 flex flex-col gap-2">
      {apiBaseUrl && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest w-20 shrink-0">API</span>
          <code className="text-[10px] font-mono text-muted-foreground truncate">{apiBaseUrl}</code>
        </div>
      )}
      {callbackUrl && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest w-20 shrink-0">Callback</span>
          <code className="text-[10px] font-mono text-muted-foreground truncate flex-1">{callbackUrl}</code>
          <button onClick={copyCallback} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors duration-150">
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      )}
      {notes && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">{notes}</p>
      )}
      {docsUrl && (
        <a href={docsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-mono text-blue-500 hover:underline w-fit">
          View docs <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}
    </div>
  );
}
