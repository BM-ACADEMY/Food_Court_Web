import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import RestaurantHeader from '@/Modules/Restaurant/components/Header/Navbar';
import RestaurantDashboard from '@/Modules/Restaurant/pages/RestaurantHome';
import Footer from '@/Modules/Restaurant/components/Footer/Footer';

const RestaurantMain = () => {
  const location = useLocation();

  const isDashboardRoute = location.pathname === "/restaurant";

  return (
    <div>
      <RestaurantHeader />
      
      {isDashboardRoute ? <RestaurantDashboard /> : <Outlet />}

      <Footer />
    </div>
  );
};

export default RestaurantMain;
