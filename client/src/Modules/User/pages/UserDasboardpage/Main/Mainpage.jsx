import React from 'react'
import UserDashboardHeader from '@/Modules/User/components/UserDashboardHeader/Navbar'
import UserHome from '@/Modules/User/pages/UserDasboardpage/UserHome';
import Footer from '@/Modules/User/components/footer/Footer';

const Mainpage = () => {
  return (
    <div>
        <UserDashboardHeader/>
        <UserHome/>
        <Footer/>
      
    </div>
  )
}

export default Mainpage;
