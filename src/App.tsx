import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Convert from './pages/Convert';
import Resize from './pages/Resize';
import Rembg from './pages/Rembg';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/convert" element={<Convert />} />
        <Route path="/resize" element={<Resize />} />
        <Route path="/rembg" element={<Rembg />} />
        {/* Additional routes will be added in future sprints */}
      </Routes>
    </Router>
  );
}

export default App;
