import React, { createContext, useState, useContext } from "react";

const RefreshContext = createContext();

export const RefreshProvider = ({ children }) => {
  const [refreshFlag, setRefreshFlag] = useState(false);

  const triggerRefresh = () => setRefreshFlag(prev => !prev); // toggle

  return (
    <RefreshContext.Provider value={{ refreshFlag, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => useContext(RefreshContext);
