import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from '@/Modules/Treasury_subcom/components/header/Navbar';
import Footer from '@/Modules/User/components/footer/Footer';
import Home from '@/Modules/Treasury_subcom/Pages/Home';
import RegisterCustomer from './Modules/Treasury_subcom/Pages/RegisterCustomer';

const App = () => {
  return (
    <Router>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register-customer" element={<RegisterCustomer />} />
      </Routes>


      <Footer />
    </Router>
  );
}

export default App;
