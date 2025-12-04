"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Spinner, 
  Text, 
  Card, 
  CardHeader,
  makeStyles,
  tokens 
} from "@fluentui/react-components";
import { authService, ApiError } from "@/services/api";

const useLoadingStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingHorizontalXL,
  },
  card: {
    padding: tokens.spacingVerticalXXL,
    minWidth: '300px',
    textAlign: 'center',
    boxShadow: tokens.shadow16,
    borderRadius: tokens.borderRadiusLarge,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalL,
  },
  title: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
  },
  spinnerContainer: {
    marginBottom: tokens.spacingVerticalM,
  },
});

type AuthRouteProps = {
  children: React.ReactNode;
};

export default function AuthComponent({ children }: AuthRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const styles = useLoadingStyles();
  
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
          // Token is invalid
          authService.clearSession();
          setIsAuthenticated(false);
          router.push("/");
        }
      } catch (error) {
        console.error("Token validation error (token expired or invalid):", error);
        
        // If response fails, token is expired or invalid - clear session and redirect to login
        authService.clearSession();
        setIsAuthenticated(false);
        router.push("/");
      }
    };

    validateToken();
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <CardHeader>
            <div className={styles.content}>
              <div className={styles.spinnerContainer}>
                <Spinner size="extra-large" />
              </div>
              <Text size={500} className={styles.title}>
                CuernaTours
              </Text>
              <Text size={300} className={styles.subtitle}>
                Validando sesión, por favor espera...
              </Text>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
