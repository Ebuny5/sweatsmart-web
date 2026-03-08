import { useEffect, useRef, useCallback } from "react";

interface CaptchaProps {
  onVerify: (isVerified: boolean) => void;
  className?: string;
}

// Cloudflare Turnstile test site key (always passes)
// Replace with your real site key from https://dash.cloudflare.com/turnstile
const TURNSTILE_SITE_KEY = "1x00000000000000000000AA";

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
  const scriptLoadedRef = useRef(false);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;
    
    // Remove existing widget
    if (widgetIdRef.current) {
      try { window.turnstile.remove(widgetIdRef.current); } catch {}
      widgetIdRef.current = null;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: "light",
      callback: () => onVerify(true),
      "error-callback": () => onVerify(false),
      "expired-callback": () => onVerify(false),
    });
  }, [onVerify]);

  useEffect(() => {
    // Load Turnstile script if not already loaded
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
      script.async = true;
      window.onTurnstileLoad = () => {
        scriptLoadedRef.current = true;
        renderWidget();
      };
      document.head.appendChild(script);
    } else if (window.turnstile) {
      scriptLoadedRef.current = true;
      renderWidget();
    } else {
      // Script exists but not loaded yet
      const prev = window.onTurnstileLoad;
      window.onTurnstileLoad = () => {
        prev?.();
        scriptLoadedRef.current = true;
        renderWidget();
      };
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  return (
    <div className={className}>
      <div ref={containerRef} />
    </div>
  );
};

export default Captcha;
