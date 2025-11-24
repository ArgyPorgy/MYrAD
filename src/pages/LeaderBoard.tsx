import { useEffect, useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import SEO from '@/components/SEO';
import './CommunityPage.css';


const CommunityPage = () => {
  const { userAddress, connected, connectWallet, disconnectWallet } = useWeb3();
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


  return (
    <div className="app-layout">
      <SEO
        title="Leaderboard"
        description="View top performers on MYrAD marketplace. See leading data creators, traders, and most active users in the decentralized data marketplace."
        keywords="leaderboard, top traders, top creators, rankings, marketplace leaders"
        canonicalUrl="https://myradhq.xyz/leaderboard"
      />
      <Sidebar />


      <main className="main-content">
        <Header
          userAddress={userAddress}
          connected={connected}
          onConnect={(provider) => connectWallet(provider)}
          onDisconnect={disconnectWallet}
        />


        <div className="page-container">
          <div className="community-content">
            <div className="community-inner-wrapper">

              <div 
                className="community-svg-container"
                style={{
                  transform: `perspective(1000px) rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg)`
                }}
              >
                <img src="/construction.svg" alt="Under Construction" />
              </div>


              <h1 className="community-title">Coming Soon...</h1>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};


export default CommunityPage;
