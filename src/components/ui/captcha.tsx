import { useEffect, useRef, useCallback } from "react";

interface CaptchaProps {
  onVerify: (isVerified: boolean) => void;
  className?: string;
}

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

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

  const removeWidget = useCallback(() => {
    if (!widgetIdRef.current || !window.turnstile) return;
    try {
      window.turnstile.remove(widgetIdRef.current);
    } catch {
      // ignore widget cleanup errors
    }
    widgetIdRef.current = null;
  }, []);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;

    if (!TURNSTILE_SITE_KEY) {
      console.error("Turnstile site key missing: set VITE_TURNSTILE_SITE_KEY");
      onVerify(false);
      return;
    }

    removeWidget();

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: "light",
      callback: () => onVerify(true),
      "expired-callback": () => onVerify(false),
      "error-callback": () => {
        console.error("Turnstile render/verification failed for current domain or key.");
        onVerify(false);
      },
    });
  }, [onVerify, removeWidget]);

  useEffect(() => {
    const onLoad = () => renderWidget();

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

