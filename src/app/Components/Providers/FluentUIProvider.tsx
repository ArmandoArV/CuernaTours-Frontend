"use client";

import { FluentProvider, webLightTheme, Theme } from '@fluentui/react-components';
import { ReactNode } from 'react';

interface FluentUIProviderProps {
  children: ReactNode;
}

// Create a custom theme with Raleway font
const ralewayTheme: Theme = {
  ...webLightTheme,
  fontFamilyBase: "var(--font-raleway), Raleway, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  fontFamilyMonospace: "var(--font-raleway), Raleway, 'Consolas', 'Monaco', monospace",
  fontFamilyNumeric: "var(--font-raleway), Raleway, 'Bahnschrift', 'Segoe UI', system-ui, sans-serif",
};

export default function FluentUIProvider({ children }: FluentUIProviderProps) {
  return (
    <FluentProvider theme={ralewayTheme}>
      {children}
    </FluentProvider>
  );
}