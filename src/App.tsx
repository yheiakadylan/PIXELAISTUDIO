import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Resize from './pages/Resize';
import Convert from './pages/Convert';
import RemBg from './pages/Rembg';
import Upscaler from './pages/Upscale';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/resize" element={<Resize />} />
        <Route path="/convert" element={<Convert />} />
        <Route path="/rembg" element={<RemBg />} />
        <Route path="/upscale" element={<Upscaler />} />
      </Routes>
    </Router>
  );
}

export default App;
