import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Snowflake, ArrowLeftRight, Gem, BarChart3, Globe2, Lock, UserCheck, UploadCloud, Coins, Repeat, Flame, TrendingUp } from 'lucide-react';
import SEO from '@/components/SEO';

const LandingPage = () => {

  const navigate = useNavigate();

  const handleLaunch = () => {
    navigate('/marketplace'); // 👈 navigates to Marketplace
  };

  const bgDotsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create animated background dots
    const bgDots = bgDotsRef.current;
    if (!bgDots) return;

    const numDots = 50;

    for (let i = 0; i < numDots; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.style.left = Math.random() * 100 + '%';
      dot.style.top = Math.random() * 100 + '%';
      dot.style.animationDelay = Math.random() * 20 + 's';
      dot.style.animationDuration = 15 + Math.random() * 10 + 's';
      bgDots.appendChild(dot);
    }

    return () => {
      if (bgDots) {
        bgDots.innerHTML = '';
      }
    };
  }, []);

  const features = [
    {
      icon: <Snowflake strokeWidth={1.5} />,
      title: 'Fully Decentralized',
      description: 'Built on blockchain technology, ensuring transparency, security, and true ownership of your data assets.'
    },
    {
      icon: <ArrowLeftRight strokeWidth={1.5} />,
      title: 'Instant Liquidity',
      description: 'Convert your datasets into fungible tokens that can be traded instantly on our marketplace.'
    },
    {
      icon: <Gem strokeWidth={1.5} />,
      title: 'Deflationary Token Model',
      description: 'The burn to download mechanism reduces supply with every dataset access, increasing scarcity and potential long term value.'
    },
    {
      icon: <BarChart3 strokeWidth={1.5} />,
      title: 'Market Driven Valuation',
      description: 'Our valuation system determines fair dataset prices based on real time demand and supply, ensuring transparent pricing.'
    },
    {
      icon: <Globe2 strokeWidth={1.5} />,
      title: 'Global Access',
      description: 'Access and trade datasets from anywhere in the world, breaking down geographical barriers.'
    },
    {
      icon: <Lock strokeWidth={1.5} />,
      title: 'Privacy Protected',
      description: 'Advanced encryption ensures your sensitive data remains secure while maintaining tradability.'
    }
  ];

  const steps = [
    {
      icon: <UserCheck strokeWidth={2} />,
      number: '01',
      title: 'User Verification',
      description: 'Authenticate users securely through our decentralized verification system.'
    },
    {
      icon: <UploadCloud strokeWidth={2} />,
      number: '02',
      title: 'Dataset Upload',
      description: 'Store your datasets safely using decentralized storage solutions for maximum reliability and privacy.'
    },
    {
      icon: <Coins strokeWidth={2} />,
      number: '03',
      title: 'DataCoin Launch',
      description: 'Generate fungible DataCoins representing exclusive dataset access rights on the blockchain.'
    },
    {
      icon: <Repeat strokeWidth={2} />,
      number: '04',
      title: 'Token Swap',
      description: 'Buyers acquire DataCoins through secure on-chain swaps with instant settlement.'
    },
    {
      icon: <Flame strokeWidth={2} />,
      number: '05',
      title: 'Burn to Download',
      description: 'DataCoins are permanently burned in exchange for dataset downloads, creating scarcity.'
    },
    {
      icon: <TrendingUp strokeWidth={2} />,
      number: '06',
      title: 'Revenue Payout',
      description: 'Creators sell their tokens and earn sustainable profits as demand increases value.'
    }
  ];


  return (
    <>
      <SEO
        title="MYrAD - Decentralized Data Marketplace"
        description="Tokenize and trade datasets on the blockchain. MYrAD enables data creators to mint ERC20 tokens representing their datasets, trade them using automated market makers, and grant dataset access through a burn-to-download mechanism on Base blockchain."
        keywords="data marketplace, blockchain, dataset tokenization, ERC20 tokens, Base blockchain, decentralized data, data trading, IPFS, Web3, AMM, automated market maker, data monetization"
        canonicalUrl="https://myradhq.xyz/"
      />
      <style>{`
  * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif;
          background: #000000;
          color: #ffffff;
          overflow-x: hidden;
          position: relative;
        }

        a {
          text-decoration: none;
          color: #ffffff;
        }

        .bg-dots {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }

        .dot {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #333333;
          border-radius: 50%;
          animation: float 20s infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }

        nav {
          position: fixed;
          top: 0;
          width: 100%;
          padding: 24px 80px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(20px);
          background: rgba(0, 0, 0, 0.9);
          border-bottom: 1px solid #222;
        }

        .logo {
          font-size: 29px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #ffffff;
        }

        .nav-links {
          display: flex;
          gap: 48px;
          align-items: center;
        }

        .nav-links a {
          color: #cccccc;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
        }

        .nav-links a:hover {
          color: #ffffff;
        }

        .nav-cta {
          padding: 10px 24px;
          background: #ffffff;
          border: none;
          border-radius: 6px;
          color: #000000;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .nav-cta:hover {
          background: #e5e5e5;
          transform: translateY(-1px);
        }

        .mobile-menu {
          display: none;
          cursor: pointer;
          flex-direction: column;
          gap: 5px;
        }

        .mobile-menu span {
          width: 24px;
          height: 2px;
          background: #ffffff;
          transition: all 0.3s;
        }

        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 140px 80px 80px;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .hero-badge {
          display: inline-block;
          padding: 6px 16px;
          background: linear-gradient(90deg, #111 0%, #222 50%, #111 100%);
          border: 1px solid #333;
          border-radius: 20px;
          font-size: 13px;
          color: #fff;
          margin-bottom: 32px;
          letter-spacing: -0.2px;
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }

        .hero-badge::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
          transform: skewX(-25deg);
          animation: shine 2.5s infinite;
        }

        @keyframes shine {
          0% { left: -100%; }
          100% { left: 150%; }
        }

        .hero h1 {
          font-size: 80px;
          font-weight: 700;
          margin-bottom: 28px;
          line-height: 1.1;
          color: #ffffff;
        }

        .hero h1 .italic {
          font-style: italic;
        }

        .hero p {
          font-size: 20px;
          color: #aaaaaa;
          max-width: 650px;
          margin: 0 auto 48px;
          line-height: 1.6;
        }

        .hero-buttons {
          display: flex;
          gap: 16px;
          margin-bottom: 40px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .primary-btn {
          padding: 16px 32px;
          background: #ffffff;
          border: none;
          border-radius: 6px;
          color: #000000;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .primary-btn:hover {
          background: #e5e5e5;
          transform: translateY(-2px);
        }

        .secondary-btn {
          padding: 16px 32px;
          background: transparent;
          border: 1px solid #555;
          border-radius: 6px;
          color: #ffffff;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .secondary-btn:hover {
          border-color: #ffffff;
          transform: translateY(-2px);
        }

        .features {
          padding: 100px 0;
          max-width: 100%;
          margin: 0 auto;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .section-header {
          text-align: center;
          margin-bottom: 80px;
          padding: 0 80px;
        }

        .section-title {
          font-size: 52px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 16px;
        }

        .section-subtitle {
          font-size: 18px;
          color: #888;
          font-weight: 400;
          margin-top: 16px;
        }

        .carousel-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
          padding: 40px 0;
        }

        .carousel-wrapper::before,
        .carousel-wrapper::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          width: 150px;
          z-index: 2;
          pointer-events: none;
        }

        .carousel-wrapper::before {
          left: 0;
          background: linear-gradient(to right, #000000 0%, transparent 100%);
        }

        .carousel-wrapper::after {
          right: 0;
          background: linear-gradient(to left, #000000 0%, transparent 100%);
        }

        .carousel-track {
          display: flex;
          gap: 32px;
          animation: scroll 30s linear infinite;
          width: fit-content;
        }

        .carousel-track:hover {
          animation-play-state: paused;
        }

        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-420px * 6 - 32px * 6)); }
        }

        .feature-card-modern {
          min-width: 420px;
          height: 320px;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          border: 1px solid #2a2a2a;
          border-radius: 24px;
          padding: 48px;
          display: flex;
          flex-direction: column;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .feature-card-modern::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.08) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.5s ease;
        }

        .feature-card-modern:hover {
          transform: translateY(-12px) scale(1.02);
          border-color: #444;
          box-shadow: 0 30px 80px rgba(255, 255, 255, 0.1);
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
        }

        .feature-card-modern:hover::before {
          opacity: 1;
        }

        .feature-icon-modern {
          width: 64px;
          height: 64px;
          margin-bottom: 24px;
          position: relative;
          transition: all 0.4s ease;
        }

        .feature-icon-modern svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.1));
        }

        .feature-card-modern:hover .feature-icon-modern {
          transform: scale(1.1) rotate(5deg);
        }

        .feature-card-modern h3 {
          font-size: 26px;
          margin-bottom: 16px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }

        .feature-card-modern p {
          color: #b0b0b0;
          line-height: 1.7;
          font-size: 15px;
          flex-grow: 1;
        }

        .how-it-works {
          padding: 120px 80px;
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .timeline-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 40px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 0;
        }

        .timeline-step {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          border: 1px solid #2a2a2a;
          border-radius: 20px;
          padding: 40px;
          display: flex;
          gap: 24px;
          align-items: flex-start;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .timeline-step::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.05) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .timeline-step:hover {
          transform: translateY(-8px);
          border-color: #444;
          box-shadow: 0 20px 60px rgba(255, 255, 255, 0.1);
        }

        .timeline-step:hover::before {
          opacity: 1;
        }

        .step-icon-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .step-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
          border: 2px solid #333;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .step-icon::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .timeline-step:hover .step-icon {
          transform: scale(1.1) rotate(-5deg);
          border-color: #555;
          box-shadow: 0 10px 30px rgba(255, 255, 255, 0.15);
        }

        .timeline-step:hover .step-icon::before {
          opacity: 1;
        }

        .step-icon svg {
          width: 40px;
          height: 40px;
          color: #ffffff;
          z-index: 1;
        }

        .step-number-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 32px;
          height: 32px;
          background: #ffffff;
          color: #000000;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
          z-index: 2;
        }

        .step-info {
          flex: 1;
          z-index: 1;
        }

        .step-info h3 {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
        }

        .step-info p {
          color: #aaaaaa;
          line-height: 1.7;
          font-size: 15px;
        }

        .cta-section {
          padding: 120px 80px;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .cta-box {
          max-width: 900px;
          margin: 0 auto;
          padding: 100px 80px;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          border: 1px solid #2a2a2a;
          border-radius: 32px;
          position: relative;
          overflow: hidden;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .cta-box::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.5s ease;
        }

        .cta-box:hover {
          transform: translateY(-8px);
          border-color: #444;
          box-shadow: 0 30px 80px rgba(255, 255, 255, 0.15);
        }

        .cta-box:hover::before {
          opacity: 1;
        }

        .cta-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
          pointer-events: none;
          animation: pulse 3s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        .cta-box h2 {
          font-size: 48px;
          margin-bottom: 24px;
          font-weight: 700;
          color: #ffffff;
          position: relative;
          z-index: 1;
          letter-spacing: -0.5px;
        }

        .cta-box p {
          font-size: 18px;
          color: #b0b0b0;
          margin-bottom: 40px;
          position: relative;
          z-index: 1;
          line-height: 1.6;
        }

        .cta-btn {
          position: relative;
          z-index: 1;
          padding: 18px 48px;
          font-size: 16px;
          box-shadow: 0 8px 24px rgba(255, 255, 255, 0.15);
        }

        .cta-btn:hover {
          box-shadow: 0 12px 32px rgba(255, 255, 255, 0.25);
        }

        footer {
          padding: 60px 20px 30px;
          border-top: 1px solid #222;
          background-color: #000;
          color: #fff;
          position: relative;
          z-index: 1;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 40px;
          margin-bottom: 40px;
        }

        .footer-brand h3 {
          font-size: 20px;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .footer-brand p {
          color: #ccc;
          font-size: 14px;
          line-height: 1.6;
        }

        .footer-column h4 {
          font-size: 14px;
          margin-bottom: 16px;
          font-weight: 600;
          color: #fff;
        }

        .footer-column a {
          display: block;
          color: #aaa;
          font-size: 14px;
          margin-bottom: 10px;
          transition: color 0.3s ease;
        }

        .footer-column a:hover {
          color: #fff;
        }

        .footer-bottom {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #222;
          color: #999;
          font-size: 13px;
        }

        .logo img {
          height: 40px;
          width: auto;
          display: block;
        }

        .inline-logo {
          height: 70px;
          width: auto;
          vertical-align: middle;
          margin: 0 5px;
        }

        @media (max-width: 1024px) {
          nav { padding: 20px 40px; }
          .hero, .how-it-works, .cta-section { padding-left: 40px; padding-right: 40px; }
          .section-header { padding: 0 40px; }
          .hero h1 { font-size: 56px; }
          .footer-content { grid-template-columns: repeat(2, 1fr); padding: 0 40px; }
          .feature-card-modern { min-width: 380px; height: 300px; }
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-380px * 6 - 32px * 6)); }
          }
          .timeline-container { grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 30px; }
          .timeline-step { padding: 32px; }
          .cta-box { padding: 80px 60px; }
          .cta-glow { width: 300px; height: 300px; }
        }

        @media (max-width: 768px) {
          nav { padding: 20px 24px; }
          .nav-links { display: none; }
          .mobile-menu { display: flex; }
          .hero { padding: 120px 24px 60px; }
          .hero h1 { font-size: 42px; }
          .section-header { padding: 0 24px; margin-bottom: 60px; }
          .section-title { font-size: 36px; }
          .how-it-works, .cta-section { padding: 80px 24px; }
          footer { padding: 60px 24px 32px; }
          .footer-content { grid-template-columns: 1fr; gap: 40px; }
          .feature-card-modern { min-width: 340px; height: 320px; padding: 36px; }
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-340px * 6 - 32px * 6)); }
          }
          .carousel-wrapper::before, .carousel-wrapper::after { width: 60px; }
          .timeline-container { grid-template-columns: 1fr; gap: 24px; }
          .timeline-step { padding: 28px; gap: 20px; }
          .step-icon { width: 70px; height: 70px; }
          .step-icon svg { width: 35px; height: 35px; }
          .step-info h3 { font-size: 20px; }
          .step-info p { font-size: 14px; }
          .cta-box { padding: 60px 32px; }
          .cta-box h2 { font-size: 36px; }
          .cta-glow { width: 250px; height: 250px; }
        }

        @media (max-width: 480px) {
          .hero h1 { font-size: 36px; }
          .section-title { font-size: 32px; }
          .feature-card-modern { min-width: 300px; }
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-300px * 6 - 32px * 6)); }
          }
          .timeline-step { padding: 24px; gap: 16px; }
          .step-icon { width: 60px; height: 60px; }
          .step-icon svg { width: 30px; height: 30px; }
          .step-number-badge { width: 28px; height: 28px; font-size: 11px; }
          .cta-box { padding: 60px 24px; }
          .cta-box h2 { font-size: 32px; }
          .cta-box p { font-size: 16px; }
          .cta-btn { padding: 16px 36px; font-size: 15px; }
        }

        section-header {
  display: flex;
  flex-direction: column; /* stack title + subtitle */
  align-items: center; /* horizontal centering */
  justify-content: center; /* vertical centering if needed */
  text-align: center;
  margin-bottom: 80px;
  padding: 0;
}

.section-title {
  font-size: 52px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px; /* space between text and logo */
  text-align: center;
}

.section-subtitle {
  font-size: 18px;
  color: #888;
  font-weight: 400;
  margin-top: 16px;
  max-width: 600px; /* keeps it neat */
  text-align: center;
}`}
      </style>
      <div className="myrad-app">
        <div className="bg-dots" ref={bgDotsRef}></div>
        <nav>
          <div className="logo">
            <img src="/favicon.svg" alt="MYRAD Logo" />
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <a
              href="https://calendly.com/carghya10/30min"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="nav-cta">Let's talk</button>
            </a>
          </div>
          <div className="mobile-menu">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-badge">Decentralized Data Marketplace</div>
          <h1>
            <span className="italic">Monetize</span> your datasets today<br />
          </h1>
          <p></p>
          <div className="hero-buttons">
            <button className="primary-btn" onClick={handleLaunch}>Launch App</button>
            <a href="https://docs.myradhq.xyz/" target='_blank'>
              <button className="secondary-btn">Learn More</button>
            </a>
          </div>
        </section>

        <section className="features" id="features">
          <div className="section-header">
            <h2 className="section-title">
              Why Choose
              <img src="favicon.svg" alt="MYRAD Logo" className="inline-logo" />?
            </h2>
          </div>

          <div className="carousel-wrapper">
            <div className="carousel-track">
              {[...features, ...features].map((feature, index) => (
                <div className="feature-card-modern" key={index}>
                  <div className="feature-icon-modern">
                    {feature.icon}
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="how-it-works" id="how">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
            </p>
          </div>

          <div className="timeline-container">
            {steps.map((step, index) => (
              <div className="timeline-step" key={index}>
                <div className="step-icon-wrapper">
                  <div className="step-icon">
                    {step.icon}
                  </div>
                  <div className="step-number-badge">{step.number}</div>
                </div>
                <div className="step-info">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-box">
            <div className="cta-glow"></div>
            <h2>Ready to Tokenize Your Data?</h2>
            <p>
              Join thousands of data owners who are monetizing their datasets on MYRAD
            </p>
            <a
              href="https://calendly.com/carghya10/30min"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="primary-btn cta-btn" onClick={handleLaunch}>Start Today</button>
            </a>
          </div>
        </section>

        <footer id="about">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>
                <img src="/favicon.svg" alt="MYRAD Logo" className="inline-logo" />
              </h3>
              <p>
                Empowering decentralized data exchange with transparency and trust.
              </p>
            </div>
            <div className="footer-column">
              <h4>Explore</h4>
              <a href="#how">How its work</a>
              <a href="#features">Features</a>
              <a href="https://docs.myradhq.xyz/" target='_blank'>Docs</a>
            </div>
            <div className="footer-column">
              <h4>Community</h4>
              <a href="https://x.com/MYrAD_HQ" target='_blank'>Twitter</a>
              <a href="https://t.me/+KOAn6WDf7AdmNTI1">Telegram</a>
              <a href="https://docs.myradhq.xyz/" target='_blank'>Blog</a>
            </div>
            <div className="footer-column">
              <h4>Contact</h4>
              <a
                href="https://calendly.com/carghya10/30min"
                target="_blank"
                rel="noopener noreferrer"
              >Email</a>
              <a
                href="https://calendly.com/carghya10/30min"
                target="_blank"
                rel="noopener noreferrer"
              >Support</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 MYRAD. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;