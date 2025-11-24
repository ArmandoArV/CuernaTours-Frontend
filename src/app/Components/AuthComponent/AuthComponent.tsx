"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, ApiError } from "@/services/api";

type AuthRouteProps = {
  children: React.ReactNode;
};

export default function AuthComponent({ children }: AuthRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const validateToken = async () => {
      try {
        const data = await authService.validate();

        if (data.tokenValid) {
          setIsAuthenticated(true);
          
          // Auto redirect to dashboard if we're on the home page
          if (window.location.pathname === '/') {
            router.push("/dashboard");
          }
        } else {
          authService.clearSession();
          setIsAuthenticated(false);
          router.push("/");
        }
      } catch (error) {
        console.error("Token validation error:", error);
        
        // Clear session and redirect to login on any error
        authService.clearSession();
        setIsAuthenticated(false);
        router.push("/");
      }
    };

    validateToken();
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Validando sesión...
      </div>
    );
  }

  return <>{children}</>;
}
