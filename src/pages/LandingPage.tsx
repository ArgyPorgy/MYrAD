import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

const LandingPage = () => {
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        { title: 'No reward systems', desc: 'People generate valuable data, but platforms profit while they get nothing.' },
        { title: 'No real data marketplace', desc: "There's no open way to price, tokenize, or trade datasets." },
        { title: 'No quality verification', desc: "Users can't easily know which datasets are clean, accurate, or trustworthy." },
        { title: 'No contribution incentives', desc: 'Communities have no reason to submit or improve data, which keeps quality low.' },
        { title: 'Built on Base and Filecoin', desc: 'Built on Base and Filecoin for scalable transactions, secure storage, and faster, low-fee onboarding.' },
        { title: 'Community Driven Coverage', desc: 'Anyone can contribute data and earn.' }
    ];

    // Accent color used throughout the page
    const accent = '#E5B94E'; // Sophisticated gold

    // NOTE: The uploaded/local file path (from your session) is used here.
    // If you have placed the image in public/ as /particles.png, you can replace this with '/particles.png'.
    // Per your instruction, this points to the uploaded path used in our conversation:
    const PARTICLE_BG = '/particles.png';

    return (
        <div style={{
            background: '#000000',
            minHeight: '100vh',
            color: '#fff',
            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            overflowX: 'hidden'
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`*
{ font-family: 'Inter', -apple-system, sans-serif; }
 h1, h2, h3, h4 { font-family: 'Space Grotesk', -apple-system, sans-serif; }
 .fade-in { opacity: 0; animation: fadeIn 0.8s ease forwards; }
 @keyframes fadeIn { to { opacity: 1; } }
 .card { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
 .card:hover { transform: translateY(-4px); background: rgba(255,255,255,0.04) !important; }
 .btn-main { transition: all 0.3s ease; }
 .btn-main:hover { transform: translateY(-2px); opacity: 0.9; }
 .btn-ghost { transition: all 0.3s ease; }
 .btn-ghost:hover { background: rgba(255,255,255,0.08) !important; }
 .link { transition: color 0.2s ease; }
 .link:hover { color: #fff !important; }
 .step-card { transition: all 0.3s ease; }
 .step-card:hover { background: rgba(255,255,255,0.03) !important; }
 .step-card:hover .step-num { background: ${accent} !important; color: #000 !important; }
 @keyframes float { 0% { transform: translateY(0px); opacity: 0.3; } 50% { transform: translateY(-20px); opacity: 0.8; } 100% { transform: translateY(0px); opacity: 0.3; } }

 /* --- Particles specific styles --- */
 .particles-bg {
   position: fixed;
   inset: 0;
   width: 100%;
   height: 100%;
   pointer-events: none;
   z-index: 0;
   overflow: hidden;
   display: block;
 }

 .particles-image {
   position: absolute;
   inset: 0;
   width: 100%;
   height: 100%;
   background-image: url("${PARTICLE_BG}");
   background-size: cover;
   background-position: center;
   opacity: 0.1; /* very subtle */
   filter: blur(0.3px) contrast(0.9);
   mix-blend-mode: screen;
 }

 .particle {
   position: absolute;
   border-radius: 50%;
   background: rgba(255,255,255,0.15);
   will-change: transform, opacity;
   box-shadow: 0 0 6px rgba(255,255,255,0.03);
   opacity: 0.6;
 }

 @keyframes particleFloat {
   0% { transform: translate3d(0,0,0) scale(1); opacity: 0.35; }
   50% { transform: translate3d(8px,-18px,0) scale(1.1); opacity: 0.95; }
   100% { transform: translate3d(-6px,0,0) scale(1); opacity: 0.35; }
 }
`}</style>

            {/* White noise texture overlay (keeps contrast subtle) */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
                opacity: 0.025,
                mixBlendMode: 'screen',
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' fill='%23ffffff'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat'
            }} />

            {/* Particles Layer (uses uploaded image + small drifting particles) */}
            <div className="particles-bg" aria-hidden>
                {/* background starfield / speckle image */}
                <div className="particles-image" />

                {/* tiny floating particles (randomized in JSX) */}
                {[...Array(14)].map((_, i) => {
                    // randomize basic properties for a natural look
                    const size = Math.random() * 3 + 1; // px
                    const left = Math.random() * 100;
                    const top = Math.random() * 100;
                    const duration = Math.random() * 18 + 14; // seconds
                    const delay = Math.random() * -duration; // so they are staggered
                    const opacity = 0.08 + Math.random() * 0.25;

                    return (
                        <span
                            key={`p-${i}`}
                            className="particle"
                            style={{
                                width: size,
                                height: size,
                                left: `${left}%`,
                                top: `${top}%`,
                                background: `rgba(255,255,255,${opacity})`,
                                animation: `particleFloat ${duration}s ease-in-out ${delay}s infinite`,
                                transformOrigin: 'center center',
                                zIndex: 0,
                            }}
                        />
                    );
                })}
            </div>

            {/* Nav */}
            <nav style={{
                position: 'fixed', top: 0, width: '100%', padding: '20px 48px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                zIndex: 1000, background: scrollY > 50 ? 'rgba(10,10,10,0.9)' : 'transparent',
                backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
                borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                transition: 'all 0.3s ease'
            }}>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src="/logo.png" alt="MYRAD" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                    MYRAD
                </div>
                <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
                    {['Features', 'How to Get Started', 'Docs'].map(item => (
                        <a
                            key={item}
                            href={item === 'Docs' ? 'https://docs.myradhq.xyz' : `#${item.toLowerCase().replace(/\s/g, '-')}`}
                            target={item === 'Docs' ? '_blank' : undefined}
                            rel={item === 'Docs' ? 'noopener noreferrer' : undefined}
                            className="link"
                            style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}
                        >
                            {item}
                        </a>
                    ))}
                    <button
                        className="btn-main"
                        onClick={() => navigate('/marketplace')}
                        style={{
                            padding: '10px 20px', background: '#fff', border: 'none', borderRadius: 8,
                            color: '#000', fontWeight: 600, fontSize: 14, cursor: 'pointer'
                        }}
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <section style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                alignItems: 'center', textAlign: 'center', padding: '120px 24px 80px', position: 'relative', zIndex: 1,
                overflow: 'hidden'
            }}>
                <AnimatedBackground />
                <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="fade-in" style={{ animationDelay: '0.1s' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 100, fontSize: 13, marginBottom: 32, color: 'rgba(255,255,255,0.7)', fontWeight: 500
                        }}>

                            Community Driven Data Marketplace
                        </div>
                    </div>
                    <h1 className="fade-in" style={{
                        fontSize: 'clamp(48px, 8vw, 86px)', fontWeight: 700, marginBottom: 24,
                        lineHeight: 1.05, letterSpacing: '-3px', animationDelay: '0.2s'
                    }}>
                        <span style={{ fontStyle: 'italic', color: accent }}>Monetize</span> your<br />data today
                    </h1>
                    <p className="fade-in" style={{
                        fontSize: 18, color: 'rgba(255,255,255,0.4)', maxWidth: 480, marginBottom: 48,
                        lineHeight: 1.7, fontWeight: 400, animationDelay: '0.3s'
                    }}>
                        Contribute, tokenize, and earn from your data
                    </p>
                    <div className="fade-in" style={{ display: 'flex', gap: 12, animationDelay: '0.4s', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            className="btn-main"
                            onClick={() => navigate('/marketplace')}
                            style={{
                                padding: '14px 28px', background: '#fff', border: 'none', borderRadius: 10,
                                color: '#000', fontWeight: 600, fontSize: 15, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 8
                            }}
                        >
                            Launch App <ArrowRight size={16} />
                        </button>
                        <button className="btn-ghost" style={{
                            padding: '14px 28px', background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff',
                            fontWeight: 500, fontSize: 15, cursor: 'pointer'
                        }}>
                            Learn More
                        </button>
                    </div>
                </div>
                <div style={{ position: 'absolute', bottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 2 }}>
                    <div style={{ width: 1, height: 60, background: `linear-gradient(180deg, ${accent} 0%, transparent 100%)`, opacity: 0.5 }} />
                </div>
            </section>

            {/* Features */}
            <section id="features" style={{ padding: '100px 48px', position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ marginBottom: 60 }}>
                    <p style={{ color: accent, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>The Problem</p>
                    <h2 style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-1.5px', color: '#fff' }}>Why MYRAD?</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    {features.map((f, i) => (
                        <div key={i} className="card" style={{
                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16, padding: 32, cursor: 'pointer'
                        }}>
                            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 14, letterSpacing: '-0.4px', color: '#fff' }}>{f.title}</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, fontSize: 15 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works - Minimal */}
            <section id="how-to-get-started" style={{ padding: '100px 48px', position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ marginBottom: 60 }}>
                    <p style={{ color: accent, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Process</p>
                    <h2 style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-1.5px', color: '#fff' }}>How to Get Started</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                    <div className="card" onClick={() => navigate('/community')} style={{
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 24, padding: 40, cursor: 'pointer', position: 'relative', overflow: 'hidden', minHeight: 280,
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                    }}>
                        <div>
                            <h3 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, letterSpacing: '-0.5px', color: '#fff' }}>Contribute to Community Data</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, fontSize: 16, maxWidth: '90%' }}>Submit data to community pools, earn rewards, and build reputation in a decentralized ecosystem.</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: accent, fontSize: 14, fontWeight: 600, marginTop: 32 }}>
                            Start Contributing <ArrowRight size={16} />
                        </div>
                    </div>
                    <div className="card" onClick={() => navigate('/create')} style={{
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 24, padding: 40, cursor: 'pointer', position: 'relative', overflow: 'hidden', minHeight: 280,
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                    }}>
                        <div>
                            <h3 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, letterSpacing: '-0.5px', color: '#fff' }}>Upload Your Own Dataset</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, fontSize: 16, maxWidth: '90%' }}>Upload to decentralized storage, mint DataCoins, and enable trading on the open marketplace.</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: accent, fontSize: 14, fontWeight: 600, marginTop: 32 }}>
                            Upload a Dataset <ArrowRight size={16} />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '100px 48px 140px', position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>
                <div style={{
                    padding: '64px 48px', textAlign: 'center', position: 'relative',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24
                }}>
                    <h2 style={{ fontSize: 38, fontWeight: 700, marginBottom: 16, letterSpacing: '-1px' }}>Ready to get started?</h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
                        Join thousands of data owners monetizing their data on MYRAD.
                    </p>
                    <button
                        className="btn-main"
                        onClick={() => navigate('/marketplace')}
                        style={{
                            padding: '14px 32px', background: '#fff', border: 'none', borderRadius: 10,
                            color: '#000', fontWeight: 600, fontSize: 15, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 8
                        }}
                    >
                        Start Today <ArrowRight size={16} />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '48px 48px 0', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 48, marginBottom: 80 }}>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img src="/logo.png" alt="MYRAD" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                            MYRAD
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, maxWidth: 250, lineHeight: 1.6 }}>
                            Empowering decentralized data exchange with transparency and trust.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 64, flexWrap: 'wrap' }}>
                        {[
                            { title: 'Product', links: [{ label: 'Features', url: '#features' }, { label: 'How to Get Started', url: '#how-to-get-started' }] },
                            { title: 'Company', links: [{ label: 'About', url: '#' }, { label: 'Team', url: '#' }] },
                            { title: 'Connect', links: [{ label: 'X', url: 'https://x.com/myrad_hq' }, { label: 'Telegram', url: 'https://t.me/+d0dhyHWulJU4NTc1' }] }
                        ].map((col, i) => (
                            <div key={i}>
                                <h4 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{col.title}</h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {col.links.map((link, idx) => (
                                        <li key={idx} style={{ marginBottom: 6 }}>
                                            <a
                                                href={link.url}
                                                target={link.url.startsWith('http') ? '_blank' : undefined}
                                                rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                                                className="link"
                                                style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none' }}
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Large Footer Branding */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingBottom: 0 }}>
                    <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0.8 }}>
                        <h2 style={{
                            fontSize: '22vw',
                            fontWeight: 800,
                            letterSpacing: '-0.04em',
                            color: '#ffffff',
                            margin: 0,
                            textTransform: 'uppercase',
                            userSelect: 'none'
                        }}>
                            MYRAD
                        </h2>

                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
