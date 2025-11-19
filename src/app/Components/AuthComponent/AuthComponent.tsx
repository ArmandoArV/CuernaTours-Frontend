"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCookie, setCookie } from "@/app/Utils/CookieUtil";

type AuthRouteProps = {
  children: React.ReactNode;
};

export default function AuthComponent({ children }: AuthRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const validateToken = async () => {
      const accessToken = getCookie("accessToken");
      
      if (!accessToken) {
        setIsAuthenticated(false);
        router.push("/");
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
        
        if (!baseUrl) {
          console.error("NEXT_PUBLIC_API_URL not configured");
          setIsAuthenticated(false);
          router.push("/");
          return;
        }

        const response = await fetch(`${baseUrl}/auth/validate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
          }
        });

        const data = await response.json();

        if (response.ok && data.success && data.data.tokenValid) {
          // Token is valid, update user data if needed
          if (data.data.user) {
            setCookie("user", JSON.stringify(data.data.user), {
              expires: 7,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/'
            });
          }
          
          setIsAuthenticated(true);
          
          // Auto redirect to dashboard if we're on the home page
          if (window.location.pathname === '/') {
            router.push("/dashboard");
          }
        } else {
          // Token is invalid, clear cookies and redirect to login
          setIsAuthenticated(false);
          router.push("/");
        }
      } catch (error) {
        console.error("Token validation error:", error);
        // On network error, assume token is invalid for security
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
