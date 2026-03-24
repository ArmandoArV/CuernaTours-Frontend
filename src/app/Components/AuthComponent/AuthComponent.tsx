"use client";
import { useAuth } from "@/app/Contexts/AuthContext/AuthContext";
import LoadingComponent from "../LoadingComponent/LoadingComponent";

type AuthRouteProps = {
  children: React.ReactNode;
};

/**
 * Thin auth guard — reads from AuthContext (no API call).
 * AuthProvider in root layout handles the actual token validation.
 */
export default function AuthComponent({ children }: AuthRouteProps) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingComponent message="Validando sesión..." />;
  }

  if (!isAuthenticated) {
    // AuthProvider already handles redirect to "/", just render nothing
    return null;
  }

  return <>{children}</>;
}
