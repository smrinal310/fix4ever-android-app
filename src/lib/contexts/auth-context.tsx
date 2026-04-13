
import { createContext, useContext, useEffect, useState } from "react";

import { sendSignupOtp, sendLoginOtp, signup, login, logout, forgotPassword, resetPassword, User } from  '../../core/api/auth';
import { getStoredUser } from "../../core/storage";


// create the auth context

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoadingUser: boolean;
  sendSignupOtp: typeof sendSignupOtp;
  sendLoginOtp:  typeof sendLoginOtp;
  signup: typeof signup;
  login: typeof login;
  logout: typeof logout;
  forgotPassword: typeof forgotPassword;
  resetPassword: typeof resetPassword;
  
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // define context functions

  const [user, setUser] = useState<User | null>(null);

  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
        getStoredUser().then(stored => {
            console.log("stored",stored);
            if (stored) setUser(stored);
        });
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };


  return (
    <AuthContext.Provider
      value={{ user, setUser, isLoadingUser, sendLoginOtp, sendSignupOtp, signup, login, logout, forgotPassword, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// hook
// using this we can access auth context whenever we need.
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be inside AuthProvider");
  }
  return context;
}

/*
loading state: keeps track of whether we are loading the data/user session,
this helps in unnecessary route to auth page while the data is still loading

*/
