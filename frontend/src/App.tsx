import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignupFlow } from './components/SignupFlow';
import { SuccessPage } from './components/SuccessPage';
import { LicenseValidator } from './components/LicenseValidator';
import { AdminDashboard } from './components/AdminDashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<SignupFlow />} />
          <Route path="/signup" element={<SignupFlow />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/validate" element={<LicenseValidator />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
