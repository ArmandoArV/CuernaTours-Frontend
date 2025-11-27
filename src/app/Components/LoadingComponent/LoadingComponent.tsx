"use client";
import { 
  Spinner, 
  Text, 
  Card, 
  CardHeader,
  makeStyles,
  tokens,
  shorthands 
} from "@fluentui/react-components";

const useLoadingStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    ...shorthands.padding(tokens.spacingHorizontalXL),
    position: 'relative',
    ...shorthands.overflow('hidden'),
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '-50%',
      left: '-50%',
      width: '200%',
      height: '200%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
      opacity: 0.5,
      animationName: {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' }
      },
      animationDuration: '30s',
      animationIterationCount: 'infinite',
      animationTimingFunction: 'linear',
    },
  },
  card: {
    ...shorthands.padding(tokens.spacingVerticalXXXL, tokens.spacingHorizontalXXL),
    minWidth: '350px',
    maxWidth: '450px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    position: 'relative',
    zIndex: 1,
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.2)'),
    animationName: {
      from: { 
        opacity: 0,
        transform: 'translateY(20px) scale(0.95)'
      },
      to: { 
        opacity: 1,
        transform: 'translateY(0) scale(1)'
      }
    },
    animationDuration: '0.5s',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'both',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingVerticalXL),
  },
  logoContainer: {
    width: '80px',
    height: '80px',
    ...shorthands.borderRadius('50%'),
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
    marginBottom: tokens.spacingVerticalM,
    animationName: {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.05)' },
      '100%': { transform: 'scale(1)' }
    },
    animationDuration: '2s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
  },
  logoText: {
    color: '#ffffff',
    fontSize: '32px',
    fontWeight: tokens.fontWeightBold,
  },
  title: {
    color: '#1a1a1a',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '24px',
    lineHeight: tokens.lineHeightBase300,
  },
  subtitle: {
    color: '#666666',
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
  },
  spinnerContainer: {
    marginBottom: tokens.spacingVerticalL,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    width: '100%',
    height: '4px',
    backgroundColor: '#e0e0e0',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.overflow('hidden'),
    marginTop: tokens.spacingVerticalL,
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: '40%',
      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
      ...shorthands.borderRadius(tokens.borderRadiusLarge),
      animationName: {
        '0%': { left: '-40%' },
        '100%': { left: '100%' }
      },
      animationDuration: '1.5s',
      animationIterationCount: 'infinite',
      animationTimingFunction: 'ease-in-out',
    },
  },
  dots: {
    display: 'flex',
    ...shorthands.gap('8px'),
    marginTop: tokens.spacingVerticalM,
    justifyContent: 'center',
  },
  dot: {
    width: '8px',
    height: '8px',
    ...shorthands.borderRadius('50%'),
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    animationName: {
      '0%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
      '50%': { opacity: 1, transform: 'scale(1.2)' }
    },
    animationDuration: '1.4s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
    '&:nth-child(1)': {
      animationDelay: '0s',
    },
    '&:nth-child(2)': {
      animationDelay: '0.2s',
    },
    '&:nth-child(3)': {
      animationDelay: '0.4s',
    },
  },
});

type LoadingComponentProps = {
  message?: string;
};

export default function LoadingComponent({ 
  message = "Cargando, por favor espera..." 
}: LoadingComponentProps) {
  const styles = useLoadingStyles();

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader>
          <div className={styles.content}>
            <div className={styles.logoContainer}>
              <span className={styles.logoText}>CT</span>
            </div>
            
            <div className={styles.spinnerContainer}>
              <Spinner size="extra-large" />
            </div>
            
            <Text className={styles.title}>
              CuernaTours
            </Text>
            
            <Text className={styles.subtitle}>
              {message}
            </Text>
            
            <div className={styles.progressBar} />
            
            <div className={styles.dots}>
              <div className={styles.dot} />
              <div className={styles.dot} />
              <div className={styles.dot} />
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
