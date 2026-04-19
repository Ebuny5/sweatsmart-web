import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const SweatSmartLanding = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/home', { replace: true });
    }
  }, [user, loading, navigate]);
  const [animatedBars, setAnimatedBars] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimatedBars(true); },
      { threshold: 0.3 }
    );
    if (chartRef.current) observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  const triggers = [
    { label: "Hot Temperature", value: 17, max: 20, color: "#a78bfa" },
    { label: "Crowded Spaces", value: 12, max: 20, color: "#818cf8" },
    { label: "Bright Lights", value: 9, max: 20, color: "#c084fc" },
    { label: "Anger", value: 7, max: 20, color: "#e879f9" },
    { label: "Nervousness", value: 7, max: 20, color: "#f0abfc" },
  ];

  const monthlyData = [3, 5, 4, 8, 6, 9, 7, 4, 3, 5, 2, 1];
  const months = ["J","F","M","A","M","J","J","A","S","O","N","D"];
  const severityLine = [2.1, 2.4, 2.2, 3.1, 2.8, 3.3, 2.9, 2.5, 2.1, 2.7, 1.8, 1.5];

  const features = [
    {
      icon: "🌡",
      title: "Track Episodes",
      desc: "The core of your journey is the multi-layered Episode Logger. Record your experience by selecting complex environmental, emotional, gustatory, or pharmacological triggers alongside HDSS severity and body-area mapping. Immediately after logging, our cutting-edge technology performs a granular clinical analysis to provide personalized relief strategies specifically for your body",
      accent: "#a78bfa",
    },
    {
      icon: "📊",
      title: "Longitudinal Dashboard & Analytics",
      desc: "Your dashboard features interactive Trend Overview charts that visualize your history over weeks, months, and years. Track frequency fluctuations and severity trends to see how you are successfully navigating your journey toward bodily dignity.",
      accent: "#818cf8",
    },
    {
      icon: "🤖",
      title: "HidroAlly",
      desc: "Your 24/7 companion reads your history and answers questions with personalized insight.",
      accent: "#c084fc",
    },
    {
      icon: "🌤",
      title: "Climate Alerts",
      desc: "Real-time weather monitoring flags high-risk conditions before they trigger an episode.",
      accent: "#e879f9",
    },
    {
      icon: "🎯",
      title: "Geo Specialist Radar",
      desc: "Use our expansion algorithm to find dermatologists in your city, state, or globally.",
      accent: "#f0abfc",
    },
    {
      icon: "🫴",
      title: "AIoT Biometric Simulation",
      desc: "Bridge the gap between smartphone accessibility and medical diagnostics. Our world-first camera-integrated Scanner utilizes computer vision and moisture detection to simulate Xiaomi IoT sensor data. By quantifying your Electrodermal Activity (EDA) and heart rate across Resting, Active, and Trigger phases, the app confirms your physiological state to provide objective evidence for a condition that is otherwise invisible.",
      accent: "#a78bfa",
    },
  ];

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      background: #0a0614;
      color: #e2d9f3;
      overflow-x: hidden;
    }

    :root {
      --violet: #7c3aed;
      --violet-light: #a78bfa;
      --violet-bright: #8b5cf6;
      --indigo: #4f46e5;
      --magenta: #d946ef;
      --pink-soft: #f0abfc;
      --dark-bg: #0a0614;
      --card-bg: rgba(255,255,255,0.04);
      --card-border: rgba(167,139,250,0.18);
      --text-muted: #9ca3af;
    }

    .noise-overlay {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      opacity: 0.025;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      background-size: 200px;
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }

    nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      padding: 0 5%;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.3s ease;
    }
    nav.scrolled {
      background: rgba(10,6,20,0.85);
      backdrop-filter: blur(20px);
      border-bottom: 0.5px solid rgba(167,139,250,0.15);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }
    .logo-mark {
      width: 40px; height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #7c3aed, #d946ef);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 24px rgba(124,58,237,0.4);
      animation: pulse-logo 3s ease-in-out infinite;
    }
    @keyframes pulse-logo {
      0%, 100% { box-shadow: 0 0 24px rgba(124,58,237,0.4); }
      50% { box-shadow: 0 0 40px rgba(124,58,237,0.7), 0 0 60px rgba(217,70,239,0.3); }
    }
    .logo-dots {
      display: flex; gap: 3px; align-items: center;
    }
    .logo-dot {
      width: 6px; height: 6px;
      background: white;
      border-radius: 50%;
      opacity: 0.9;
    }
    .logo-text {
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 18px;
      color: #f5f3ff;
      letter-spacing: -0.3px;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-ghost {
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #c4b5fd;
      background: transparent;
      border: none;
      cursor: pointer;
      text-decoration: none;
      transition: color 0.2s, background 0.2s;
    }
    .btn-ghost:hover { background: rgba(167,139,250,0.1); color: #f5f3ff; }

    .btn-primary {
      padding: 9px 22px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: white;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      border: none;
      cursor: pointer;
      text-decoration: none;
      box-shadow: 0 0 20px rgba(124,58,237,0.4);
      transition: all 0.2s;
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 0 30px rgba(124,58,237,0.6);
    }
    .btn-primary-lg {
      padding: 15px 36px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 500;
      color: white;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      border: none;
      cursor: pointer;
      text-decoration: none;
      box-shadow: 0 0 40px rgba(124,58,237,0.5);
      display: inline-block;
      transition: all 0.25s;
    }
    .btn-primary-lg:hover { transform: translateY(-2px); box-shadow: 0 8px 50px rgba(124,58,237,0.6); }

    .btn-outline-lg {
      padding: 14px 36px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 400;
      color: #c4b5fd;
      background: rgba(255,255,255,0.04);
      border: 0.5px solid rgba(167,139,250,0.3);
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: all 0.25s;
    }
    .btn-outline-lg:hover { background: rgba(167,139,250,0.08); color: #f5f3ff; border-color: rgba(167,139,250,0.5); }

    /* HERO */
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
      padding: 0 5%;
      padding-top: 72px;
    }

    .hero-content {
      flex: 1;
      max-width: 540px;
      position: relative;
      z-index: 2;
      animation: fadeUp 0.9s ease both;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 100px;
      background: rgba(124,58,237,0.15);
      border: 0.5px solid rgba(167,139,250,0.3);
      font-size: 12px;
      color: #c4b5fd;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 28px;
    }
    .hero-badge-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #a78bfa;
      animation: blink 2s ease-in-out infinite;
    }
    @keyframes blink {
      0%,100%{opacity:1;} 50%{opacity:0.3;}
    }

    .hero-title {
      font-family: 'Syne', sans-serif;
      font-size: clamp(42px, 5vw, 68px);
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -1.5px;
      color: #f5f3ff;
      margin-bottom: 24px;
    }
    .hero-title .gradient-text {
      background: linear-gradient(135deg, #a78bfa 0%, #e879f9 50%, #f0abfc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 18px;
      font-weight: 300;
      color: #9ca3af;
      line-height: 1.65;
      margin-bottom: 40px;
      max-width: 460px;
    }

    .hero-ctas {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      margin-bottom: 48px;
    }

    .hero-social-proof {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .avatars {
      display: flex;
    }
    .avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      border: 2px solid #0a0614;
      margin-left: -8px;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .avatar:first-child { margin-left: 0; }
    .proof-text { font-size: 13px; color: #9ca3af; }
    .proof-text strong { color: #c4b5fd; font-weight: 500; }

    /* MOCK DASHBOARD FLOAT */
    .hero-visual {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      z-index: 2;
      animation: float 6s ease-in-out infinite;
    }
    @keyframes float {
      0%,100%{ transform: translateY(0px); }
      50%{ transform: translateY(-14px); }
    }

    .mock-phone {
      width: 300px;
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(30px);
      border: 0.5px solid rgba(167,139,250,0.2);
      border-radius: 24px;
      overflow: hidden;
      box-shadow:
        0 0 0 1px rgba(167,139,250,0.08),
        0 30px 80px rgba(0,0,0,0.5),
        0 0 120px rgba(124,58,237,0.15);
    }
    .mock-header {
      background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%);
      padding: 20px 18px 18px;
    }
    .mock-greeting { font-size: 10px; color: #c4b5fd; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; }
    .mock-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: white; margin-bottom: 12px; }
    .mock-stats {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }
    .mock-stat {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 8px;
      text-align: center;
    }
    .mock-stat-val { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: white; }
    .mock-stat-label { font-size: 9px; color: rgba(255,255,255,0.6); margin-top: 2px; }

    .mock-body { padding: 14px 18px 18px; }
    .mock-section-title { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }

    .mock-chart-bars {
      display: flex;
      align-items: flex-end;
      gap: 5px;
      height: 60px;
      margin-bottom: 14px;
    }
    .mock-bar {
      flex: 1;
      border-radius: 3px 3px 0 0;
      background: linear-gradient(180deg, #a78bfa, #7c3aed);
      transition: height 1s cubic-bezier(0.4,0,0.2,1);
      min-height: 3px;
    }

    .mock-triggers { display: flex; flex-direction: column; gap: 6px; }
    .mock-trigger-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mock-trigger-label { font-size: 9px; color: #9ca3af; width: 70px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mock-trigger-bar-wrap { flex: 1; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
    .mock-trigger-bar-fill {
      height: 100%;
      border-radius: 3px;
      background: linear-gradient(90deg, #7c3aed, #d946ef);
      transition: width 1.2s cubic-bezier(0.4,0,0.2,1);
    }
    .mock-trigger-count { font-size: 9px; color: #c4b5fd; font-weight: 600; width: 16px; text-align: right; }

    .mock-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 100px;
      background: rgba(124,58,237,0.2);
      border: 0.5px solid rgba(167,139,250,0.3);
      font-size: 9px;
      color: #c4b5fd;
      margin-top: 10px;
      margin-right: 6px;
    }

    /* FEATURES */
    .section-features {
      padding: 120px 5%;
      position: relative;
      z-index: 2;
    }
    .section-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #a78bfa;
      margin-bottom: 16px;
    }
    .section-title {
      font-family: 'Syne', sans-serif;
      font-size: clamp(32px, 4vw, 52px);
      font-weight: 700;
      color: #f5f3ff;
      letter-spacing: -1px;
      line-height: 1.1;
      margin-bottom: 16px;
    }
    .section-subtitle {
      font-size: 17px;
      color: #9ca3af;
      font-weight: 300;
      max-width: 520px;
      line-height: 1.6;
      margin-bottom: 64px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }
    .feature-card {
      background: rgba(255,255,255,0.03);
      border: 0.5px solid rgba(167,139,250,0.12);
      border-radius: 20px;
      padding: 32px 28px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: default;
    }
    .feature-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(167,139,250,0.3), transparent);
    }
    .feature-card:hover {
      background: rgba(255,255,255,0.05);
      border-color: rgba(167,139,250,0.25);
      transform: translateY(-4px);
    }
    .feature-icon {
      font-size: 28px;
      margin-bottom: 20px;
      display: block;
    }
    .feature-title {
      font-family: 'Syne', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: #f5f3ff;
      margin-bottom: 10px;
    }
    .feature-desc {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.65;
    }
    .feature-glow {
      position: absolute;
      bottom: -40px; right: -40px;
      width: 100px; height: 100px;
      border-radius: 50%;
      opacity: 0.08;
      filter: blur(30px);
    }

    /* ANALYTICS SECTION */
    .section-analytics {
      padding: 80px 5% 120px;
      position: relative;
      z-index: 2;
    }
    .analytics-inner {
      background: rgba(255,255,255,0.025);
      border: 0.5px solid rgba(167,139,250,0.15);
      border-radius: 28px;
      padding: 60px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
      position: relative;
      overflow: hidden;
    }
    .analytics-inner::before {
      content: '';
      position: absolute;
      top: -100px; right: -100px;
      width: 300px; height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%);
    }

    .chart-visual { position: relative; z-index: 1; }
    .chart-title { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .chart-container {
      background: rgba(255,255,255,0.03);
      border: 0.5px solid rgba(167,139,250,0.1);
      border-radius: 16px;
      padding: 24px;
    }
    .chart-bars-full {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      height: 120px;
      margin-bottom: 8px;
    }
    .chart-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .chart-bar-full {
      width: 100%;
      border-radius: 4px 4px 0 0;
      background: linear-gradient(180deg, #a78bfa 0%, #6d28d9 100%);
      transition: height 1.4s cubic-bezier(0.4,0,0.2,1);
      min-height: 4px;
    }
    .chart-month { font-size: 9px; color: #6b7280; }
    .chart-legend {
      display: flex;
      gap: 16px;
      margin-top: 14px;
      flex-wrap: wrap;
    }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #9ca3af; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

    .analytics-text { position: relative; z-index: 1; }
    .big-stat {
      font-family: 'Syne', sans-serif;
      font-size: 72px;
      font-weight: 800;
      line-height: 1;
      background: linear-gradient(135deg, #a78bfa, #e879f9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }
    .big-stat-label { font-size: 14px; color: #9ca3af; margin-bottom: 32px; }

    .stat-row {
      display: flex;
      gap: 32px;
      margin-bottom: 32px;
    }
    .stat-item { }
    .stat-val {
      font-family: 'Syne', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: #f5f3ff;
    }
    .stat-key { font-size: 12px; color: #6b7280; margin-top: 2px; }

    /* CTA */
    .section-cta {
      padding: 80px 5% 140px;
      text-align: center;
      position: relative;
      z-index: 2;
    }
    .cta-card {
      max-width: 700px;
      margin: 0 auto;
      background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(217,70,239,0.1));
      border: 0.5px solid rgba(167,139,250,0.25);
      border-radius: 28px;
      padding: 80px 60px;
      position: relative;
      overflow: hidden;
    }
    .cta-card::before {
      content: '';
      position: absolute;
      top: -80px; left: 50%;
      transform: translateX(-50%);
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%);
    }
    .cta-title {
      font-family: 'Syne', sans-serif;
      font-size: clamp(28px, 4vw, 44px);
      font-weight: 800;
      color: #f5f3ff;
      letter-spacing: -1px;
      line-height: 1.1;
      margin-bottom: 18px;
      position: relative;
      z-index: 1;
    }
    .cta-sub {
      font-size: 16px;
      color: #9ca3af;
      line-height: 1.6;
      margin-bottom: 40px;
      position: relative;
      z-index: 1;
    }
    .cta-buttons { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }

    /* FOOTER */
    footer {
      border-top: 0.5px solid rgba(167,139,250,0.1);
      padding: 40px 5%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: gap;
      position: relative;
      z-index: 2;
    }
    .footer-copy { font-size: 13px; color: #4b5563; }
    .footer-links { display: flex; gap: 28px; }
    .footer-link { font-size: 13px; color: #6b7280; text-decoration: none; transition: color 0.2s; }
    .footer-link:hover { color: #c4b5fd; }

    @media (max-width: 768px) {
      .hero { flex-direction: column; padding-top: 100px; padding-bottom: 60px; }
      .hero-content { max-width: 100%; text-align: center; }
      .hero-ctas { justify-content: center; }
      .hero-social-proof { justify-content: center; }
      .hero-visual { width: 100%; margin-top: 40px; }
      .mock-phone { width: 260px; }
      .analytics-inner { grid-template-columns: 1fr; padding: 36px 28px; gap: 36px; }
      footer { flex-direction: column; gap: 20px; text-align: center; }
    }
  `;

  const maxEpisodes = Math.max(...monthlyData);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="noise-overlay" />

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div className="orb" style={{ width: 600, height: 600, top: -200, left: -200, background: 'rgba(124,58,237,0.15)' }} />
        <div className="orb" style={{ width: 400, height: 400, top: '30%', right: -100, background: 'rgba(217,70,239,0.1)' }} />
        <div className="orb" style={{ width: 500, height: 500, bottom: -100, left: '30%', background: 'rgba(79,70,229,0.12)' }} />
      </div>

      {/* NAV */}
      <nav className={scrolled ? 'scrolled' : ''}>
        <a href="/" className="logo">
          <div className="logo-mark">
            <div className="logo-dots">
              <div className="logo-dot" />
              <div className="logo-dot" style={{ opacity: 0.6 }} />
            </div>
          </div>
          <span className="logo-text">SweatSmart</span>
        </a>
        <div className="nav-links">
          <a href="/login" className="btn-ghost">Login</a>
          <a href="/register" className="btn-primary">Get Started</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            Trusted by 12,000+ people
          </div>
          <h1 className="hero-title">
            Take control<br />
            of your{' '}
            <span className="gradient-text">hyperhidrosis</span>
          </h1>
          <p className="hero-subtitle">
            Track episodes, uncover triggers, and get AI-powered insights — all in one clinical-grade app designed for real life.
          </p>
          <div className="hero-ctas">
            <a href="/register" className="btn-primary-lg">Start for free</a>
            <a href="/login" className="btn-outline-lg">Sign in</a>
          </div>
          <div className="hero-social-proof">
            <div className="avatars">
              {['#7c3aed','#a855f7','#6d28d9','#9333ea'].map((c, i) => (
                <div key={i} className="avatar" style={{ background: c }}>
                  {['T','M','R','K'][i]}
                </div>
              ))}
            </div>
            <p className="proof-text">
              <strong>365 million people</strong> live with hyperhidrosis worldwide
            </p>
          </div>
        </div>

        {/* MOCK DASHBOARD */}
        <div className="hero-visual">
          <div className="mock-phone">
            <div className="mock-header">
              <div className="mock-greeting">SWEATSMART · GOOD EVENING</div>
              <div className="mock-title">Timi's Dashboard 💧</div>
              <div className="mock-stats">
                <div className="mock-stat">
                  <div className="mock-stat-val">32</div>
                  <div className="mock-stat-label">Episodes</div>
                </div>
                <div className="mock-stat">
                  <div className="mock-stat-val">3.1</div>
                  <div className="mock-stat-label">Avg HDSS</div>
                </div>
                <div className="mock-stat" style={{ background: 'rgba(217,70,239,0.2)' }}>
                  <div className="mock-stat-val" style={{ fontSize: 11, paddingTop: 2 }}>🔥 Hot</div>
                  <div className="mock-stat-label">Top trigger</div>
                </div>
              </div>
            </div>
            <div className="mock-body">
              <div className="mock-section-title">Monthly trend</div>
              <div className="mock-chart-bars">
                {monthlyData.map((v, i) => (
                  <div
                    key={i}
                    className="mock-bar"
                    style={{ height: animatedBars ? `${(v / maxEpisodes) * 56 + 4}px` : '4px' }}
                  />
                ))}
              </div>

              <div className="mock-section-title">Your top triggers</div>
              <div className="mock-triggers" ref={chartRef}>
                {triggers.slice(0, 3).map((t, i) => (
                  <div key={i} className="mock-trigger-row">
                    <div className="mock-trigger-label">{t.label}</div>
                    <div className="mock-trigger-bar-wrap">
                      <div
                        className="mock-trigger-bar-fill"
                        style={{ width: animatedBars ? `${(t.value / t.max) * 100}%` : '0%' }}
                      />
                    </div>
                    <div className="mock-trigger-count">{t.value}</div>
                  </div>
                ))}
              </div>

              <div>
                <span className="mock-pill">🌡 Hot Temperature (17)</span>
                <span className="mock-pill">👥 Crowded (12)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section-features">
        <div className="section-label">Core features</div>
        <h2 className="section-title">
          Everything you need<br />
          to understand your body
        </h2>
        <p className="section-subtitle">
          Professional-grade tracking tools built specifically for hyperhidrosis — designed with clinical rigor, and human sensitivity.
        </p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
              <div className="feature-glow" style={{ background: f.accent }} />
            </div>
          ))}
        </div>
      </section>

      {/* ANALYTICS SHOWCASE */}
      <section className="section-analytics">
        <div className="analytics-inner">
          <div className="chart-visual">
            <div className="chart-title">Trend overview — 12 months</div>
            <div className="chart-container">
              <div className="chart-bars-full">
                {monthlyData.map((v, i) => (
                  <div key={i} className="chart-bar-wrap">
                    <div
                      className="chart-bar-full"
                      style={{ height: animatedBars ? `${(v / maxEpisodes) * 108 + 4}px` : '4px' }}
                    />
                    <div className="chart-month">{months[i]}</div>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#a78bfa' }} />
                  Episode count
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#e879f9', borderRadius: 0, width: 14, height: 2, marginTop: 3 }} />
                  HDSS severity (1–4)
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              {triggers.map((t, i) => (
                <div key={i} className="mock-trigger-row" style={{ marginBottom: 8 }}>
                  <div style={{ width: 120, fontSize: 12, color: '#9ca3af' }}>{t.label}</div>
                  <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      borderRadius: 4,
                      background: `linear-gradient(90deg, #7c3aed, ${t.color})`,
                      width: animatedBars ? `${(t.value / 20) * 100}%` : '0%',
                      transition: `width ${1 + i * 0.15}s cubic-bezier(0.4,0,0.2,1)`,
                    }} />
                  </div>
                  <div style={{ width: 24, textAlign: 'right', fontSize: 12, color: '#c4b5fd', fontWeight: 600 }}>{t.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-text">
            <div className="big-stat">32</div>
            <div className="big-stat-label">episodes tracked this year</div>
            <div className="stat-row">
              <div className="stat-item">
                <div className="stat-val">20</div>
                <div className="stat-key">Unique triggers<br />identified</div>
              </div>
              <div className="stat-item">
                <div className="stat-val">↓ 4</div>
                <div className="stat-key">Fewer episodes<br />this month</div>
              </div>
            </div>
            <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.65, marginBottom: 28 }}>
              Your data builds a personal picture over time. Patterns that were invisible become clear — giving you and your doctor the full story.
            </p>
            <a href="/register" className="btn-primary-lg" style={{ fontSize: 14, padding: '12px 28px' }}>
              Start tracking
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-cta">
        <div className="cta-card">
          <div className="cta-title">
            Ready to understand<br />what your body is telling you?
          </div>
          <p className="cta-sub">
            Join thousands of people who use SweatSmart to track smarter, live better, and finally feel understood.
          </p>
          <div className="cta-buttons">
            <a href="/register" className="btn-primary-lg">Start your journey free</a>
            <a href="/login" className="btn-outline-lg">Sign in</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <a href="/" className="logo" style={{ textDecoration: 'none' }}>
          <div className="logo-mark" style={{ width: 32, height: 32, borderRadius: 9 }}>
            <div className="logo-dots">
              <div className="logo-dot" style={{ width: 5, height: 5 }} />
              <div className="logo-dot" style={{ width: 5, height: 5, opacity: 0.6 }} />
            </div>
          </div>
          <span className="logo-text" style={{ fontSize: 15 }}>SweatSmart</span>
        </a>
        <p className="footer-copy">© {new Date().getFullYear()} SweatSmart by Giftovate Therapeutics Ltd. All rights reserved.</p>
        <div className="footer-links">
          <a href="/privacy" className="footer-link">Privacy</a>
          <a href="/terms" className="footer-link">Terms</a>
          <a href="/contact" className="footer-link">Contact</a>
        </div>
      </footer>
    </>
  );
};

export default SweatSmartLanding;
