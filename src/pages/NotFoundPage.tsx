import { Home, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

const NotFoundPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <>
      <style>{`
        .notfound-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #000000 0%, #0a0a0a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          position: relative;
          overflow: hidden;
        }

        .notfound-background {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.4;
        }

        .notfound-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        .notfound-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 800px;
          animation: fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .notfound-svg-container {
          margin: 0 auto 48px;
          position: relative;
          width: 400px;
          height: 400px;
          animation: float 6s ease-in-out infinite;
          transition: transform 0.1s ease-out;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .notfound-svg-container img {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 20px 60px rgba(255, 255, 255, 0.1));
        }

        .notfound-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
          pointer-events: none;
          animation: pulse 4s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        .notfound-title {
          font-size: 72px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 16px 0;
          letter-spacing: -2px;
          line-height: 1;
          animation: slideInDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .notfound-subtitle {
          font-size: 24px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px 0;
          letter-spacing: -0.5px;
          animation: slideInDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
        }

        .notfound-description {
          font-size: 16px;
          color: #888888;
          margin: 0 0 48px 0;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
          animation: fadeIn 0.8s ease-out 0.4s both;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .notfound-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          animation: slideInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .notfound-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          position: relative;
          overflow: hidden;
        }

        .notfound-btn::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .notfound-btn:hover::before {
          width: 300px;
          height: 300px;
        }

        .notfound-btn span {
          position: relative;
          z-index: 1;
        }

        .notfound-btn svg {
          position: relative;
          z-index: 1;
        }

        .notfound-btn-primary {
          background: #ffffff;
          color: #000000;
        }

        .notfound-btn-primary:hover {
          background: #e5e5e5;
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(255, 255, 255, 0.2);
        }

        .notfound-btn-secondary {
          background: transparent;
          color: #ffffff;
          border: 1px solid #333333;
        }

        .notfound-btn-secondary:hover {
          border-color: #555555;
          background: #1a1a1a;
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(255, 255, 255, 0.1);
        }

        .notfound-suggestions {
          margin-top: 64px;
          padding-top: 48px;
          border-top: 1px solid #222222;
          animation: fadeIn 1s ease-out 0.6s both;
        }

        .notfound-suggestions-title {
          font-size: 14px;
          color: #666666;
          margin: 0 0 24px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
        }

        .notfound-links {
          display: flex;
          gap: 24px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .notfound-link {
          color: #888888;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          position: relative;
          padding-bottom: 4px;
          cursor: pointer;
        }

        .notfound-link::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: #ffffff;
          transition: width 0.3s ease;
        }

        .notfound-link:hover {
          color: #ffffff;
        }

        .notfound-link:hover::after {
          width: 100%;
        }

        @media (max-width: 768px) {
          .notfound-container {
            padding: 24px;
          }

          .notfound-svg-container {
            width: 280px;
            height: 280px;
            margin-bottom: 32px;
          }

          .notfound-title {
            font-size: 48px;
          }

          .notfound-subtitle {
            font-size: 20px;
          }

          .notfound-description {
            font-size: 14px;
            margin-bottom: 32px;
          }

          .notfound-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .notfound-btn {
            width: 100%;
            justify-content: center;
          }

          .notfound-suggestions {
            margin-top: 48px;
            padding-top: 32px;
          }

          .notfound-links {
            flex-direction: column;
            gap: 16px;
          }
        }

        @media (max-width: 480px) {
          .notfound-svg-container {
            width: 220px;
            height: 220px;
            margin-bottom: 24px;
          }

          .notfound-title {
            font-size: 36px;
          }

          .notfound-subtitle {
            font-size: 18px;
          }

          .notfound-btn {
            padding: 14px 24px;
            font-size: 14px;
          }
        }
      `}</style>

      <div className="notfound-container">
        <div className="notfound-background">
          <div className="notfound-grid"></div>
          <div className="notfound-glow"></div>
        </div>

        <div className="notfound-content">
          <div 
            className="notfound-svg-container"
            style={{
              transform: `perspective(1000px) rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg)`
            }}
          >
            <img src="/404.svg" alt="404 Error" />
          </div>

          <div className="notfound-actions">
            <button 
              className="notfound-btn notfound-btn-primary"
              onClick={handleGoHome}
            >
              <Home size={20} strokeWidth={2} />
              <span>Go Home</span>
            </button>
            <button 
              className="notfound-btn notfound-btn-secondary"
              onClick={handleGoBack}
            >
              <ArrowLeft size={20} strokeWidth={2} />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;