import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home';
import Resize from './pages/Resize';
import Convert from './pages/Convert';
import RemBg from './pages/Rembg';
import Upscaler from './pages/Upscale';
import MinecraftSword from './components/MinecraftSword';
import SwordTrail from './components/SwordTrail';
import ComboCounter from './components/ComboCounter';
import './index.css';

function App() {
  const [isShaking, setIsShaking] = useState(false);

  // Handle combo and screen shake
  const handleComboChange = (combo: number) => {
    if (combo >= 5 && combo % 5 === 0) {
      // Trigger screen shake on multiples of 5
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <Router>
      <div
        style={{
          animation: isShaking ? 'screen-shake 0.5s ease-in-out' : 'none'
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resize" element={<Resize />} />
          <Route path="/convert" element={<Convert />} />
          <Route path="/rembg" element={<RemBg />} />
          <Route path="/upscale" element={<Upscaler />} />
        </Routes>

        {/* Global Sword Cursor Effects */}
        <SwordTrail />
        <MinecraftSword />
        <ComboCounter onComboChange={handleComboChange} />
      </div>
    </Router>
  );
}

export default App;
