import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { getCurrentUser, login as authLogin, logout as authLogout, initializeDefaultUsers } from "@/lib/mockAuth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => User | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    initializeDefaultUsers();
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const login = (email: string, password: string) => {
    const loggedInUser = authLogin(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}