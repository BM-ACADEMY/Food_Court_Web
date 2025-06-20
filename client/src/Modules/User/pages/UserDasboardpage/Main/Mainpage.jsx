import React from 'react'
import UserDashboardHeader from '@/Modules/User/components/UserDashboardHeader/Navbar'
import UserHome from '@/Modules/User/pages/UserDasboardpage/UserHome';

const Mainpage = () => {
  return (
    <div>
        <UserDashboardHeader/>
        <UserHome/>
      
    </div>
  )
}

export default Mainpage;
