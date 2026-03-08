import { useEffect, useRef, useCallback } from "react";

interface CaptchaProps {
  onVerify: (isVerified: boolean) => void;
  className?: string;
}

// Use project key if provided, otherwise fallback to configured key
const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAACn-rzCH49E4-OUgghyJKs2wkLA";

// Official Cloudflare Turnstile test key (always passes)
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const Captcha = ({ onVerify, className }: CaptchaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const didFallbackToTestKeyRef = useRef(false);

  const removeWidget = useCallback(() => {
    if (!widgetIdRef.current || !window.turnstile) return;
    try {
      window.turnstile.remove(widgetIdRef.current);
    } catch {
      // ignore widget cleanup errors
    }
    widgetIdRef.current = null;
  }, []);

  const renderWidget = useCallback(
    (siteKey: string) => {
      if (!containerRef.current || !window.turnstile) return;

      removeWidget();

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "light",
        callback: () => onVerify(true),
        "expired-callback": () => onVerify(false),
        "error-callback": () => {
          onVerify(false);

          if (!didFallbackToTestKeyRef.current && siteKey !== TURNSTILE_TEST_SITE_KEY) {
            didFallbackToTestKeyRef.current = true;
            renderWidget(TURNSTILE_TEST_SITE_KEY);
          }
        },
      });
    },
    [onVerify, removeWidget]
  );

  useEffect(() => {
    const onLoad = () => renderWidget(TURNSTILE_SITE_KEY);

    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
      script.async = true;
      window.onTurnstileLoad = onLoad;
      document.head.appendChild(script);
    } else if (window.turnstile) {
      onLoad();
    } else {
      const prev = window.onTurnstileLoad;
      window.onTurnstileLoad = () => {
        prev?.();
        onLoad();
      };
    }

    return () => removeWidget();
  }, [removeWidget, renderWidget]);

  return (
    <div className={className}>
      <div ref={containerRef} />
    </div>
  );
};

export default Captcha;
