"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    onIdeaTurnstileSuccess?: (token: string) => void;
    onIdeaTurnstileExpired?: () => void;
  }
}

export function TurnstileWidget({
  siteKey,
  onToken
}: {
  siteKey: string;
  onToken: (token: string) => void;
}) {
  useEffect(() => {
    window.onIdeaTurnstileSuccess = (token: string) => {
      onToken(token);
    };
    window.onIdeaTurnstileExpired = () => {
      onToken("");
    };

    return () => {
      delete window.onIdeaTurnstileSuccess;
      delete window.onIdeaTurnstileExpired;
    };
  }, [onToken]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-callback="onIdeaTurnstileSuccess"
        data-expired-callback="onIdeaTurnstileExpired"
      />
    </>
  );
}

