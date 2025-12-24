"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "@/app/Utils/CookieUtil";
import { authService } from "@/services/api";

export default function HomeAuthCheck() {
  const router = useRouter();

  useEffect(() => {
    const checkExistingAuth = async () => {
      // Small delay to avoid race condition with logout cookie clearing
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const accessToken = getCookie("accessToken");
      
      if (!accessToken) {
        return; // No token, user stays on home page
      }

      try {
        // Use the centralized auth service for validation
        const validationResult = await authService.validate();

        if (validationResult.tokenValid) {
          // Double-check token still exists before redirecting (race condition safety)
          const tokenStillExists = getCookie("accessToken");
          if (tokenStillExists) {
            // Token is valid, user data is automatically updated by the service
            // Auto redirect to dashboard
            router.push("/dashboard");
          }
        }
        // If token is invalid, user stays on home page (login form)
      } catch (error) {
        console.error("Token validation error:", error);
        // On error, user stays on home page
        // The auth service automatically clears invalid tokens
      }
    };

    checkExistingAuth();
  }, [router]);

  return null; // This component doesn't render anything
}