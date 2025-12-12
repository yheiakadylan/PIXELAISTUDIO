import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Convert from './pages/Convert';
import Resize from './pages/Resize';
import Rembg from './pages/Rembg';
import Upscale from './pages/Upscale';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/convert" element={<Convert />} />
        <Route path="/resize" element={<Resize />} />
        <Route path="/rembg" element={<Rembg />} />
        <Route path="/upscale" element={<Upscale />} />
      </Routes>
    </Router>
  );
}

export default App;
