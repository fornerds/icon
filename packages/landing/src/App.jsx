import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import IconDetail from './pages/IconDetail';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/icons/:slug" element={<IconDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

