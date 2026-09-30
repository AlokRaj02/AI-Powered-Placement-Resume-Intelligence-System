import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import UploadForm from './components/UploadForm';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Docs from './components/Docs';
import Optimizer from './components/Optimizer';
import PlacementModule from './components/PlacementModule/PlacementModule';
import ChatWidget from './components/ChatWidget';
import './App.css';

function App() {
  return (
    <Router>
      <Navbar />
      <main className="container animate-fade-in">
        <Routes>
          <Route path="/" element={<UploadForm />} />
          <Route path="/placement" element={<PlacementModule />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/optimizer" element={<Optimizer />} />
        </Routes>
      </main>
      <ChatWidget />
    </Router>
  );
}

export default App;
