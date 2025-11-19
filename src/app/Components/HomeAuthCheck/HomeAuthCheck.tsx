"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie, setCookie } from "@/app/Utils/CookieUtil";

export default function HomeAuthCheck() {
  const router = useRouter();

  useEffect(() => {
    const checkExistingAuth = async () => {
      const accessToken = getCookie("accessToken");
      
      if (!accessToken) {
        return; // No token, user stays on home page
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
        
        if (!baseUrl) {
          console.error("NEXT_PUBLIC_API_URL not configured");
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
          // Token is valid, update user data and redirect
          if (data.data.user) {
            setCookie("user", JSON.stringify(data.data.user), {
              expires: 7,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/'
            });
          }
          
          // Auto redirect to dashboard
          router.push("/dashboard");
        }
        // If token is invalid, user stays on home page (login form)
      } catch (error) {
        console.error("Token validation error:", error);
        // On error, user stays on home page
      }
    };

    checkExistingAuth();
  }, [router]);

  return null; // This component doesn't render anything
}