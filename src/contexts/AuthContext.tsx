import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { userService } from "@/services/userService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize default users if needed
    const initializeAuth = async () => {
      try {
        await userService.initializeDefaultUsers();
        
        // Check for saved session
        const savedUser = localStorage.getItem("josm_current_user");
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          // Verify user still exists in database
          const dbUser = await userService.getUserById(userData.id);
          if (dbUser) {
            setUser(dbUser);
          } else {
            localStorage.removeItem("josm_current_user");
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const authenticatedUser = await userService.authenticateUser(email, password);
      
      if (authenticatedUser) {
        setUser(authenticatedUser);
        localStorage.setItem("josm_current_user", JSON.stringify(authenticatedUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("josm_current_user");
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

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