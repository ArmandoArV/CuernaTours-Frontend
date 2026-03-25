"use client";

import { FluentProvider, webLightTheme, Theme } from '@fluentui/react-components';
import { initializeIcons } from '@fluentui/react';
import { ReactNode } from 'react';

// Initialize icons for Fluent UI v8 components (Dropdown, ComboBox, DatePicker)
initializeIcons();

interface FluentUIProviderProps {
  children: ReactNode;
}

// Custom CuernaTours theme: gold brand (#96781a) + Inter font
const cuernaToursTheme: Theme = {
  ...webLightTheme,
  fontFamilyBase: "var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  fontFamilyMonospace: "'Consolas', 'Monaco', monospace",
  fontFamilyNumeric: "var(--font-inter), Inter, 'Bahnschrift', 'Segoe UI', system-ui, sans-serif",
  // Brand colors — gold palette from Figma design system
  colorBrandBackground: '#96781a',
  colorBrandBackgroundHover: '#7d6316',
  colorBrandBackgroundPressed: '#655013',
  colorBrandBackgroundSelected: '#7d6316',
  colorBrandForeground1: '#96781a',
  colorBrandForeground2: '#7d6316',
  colorBrandForegroundLink: '#96781a',
  colorBrandForegroundLinkHover: '#7d6316',
  colorBrandForegroundLinkPressed: '#655013',
  colorBrandStroke1: '#96781a',
  colorBrandStroke2: '#7d6316',
  colorCompoundBrandBackground: '#96781a',
  colorCompoundBrandBackgroundHover: '#7d6316',
  colorCompoundBrandBackgroundPressed: '#655013',
  colorCompoundBrandForeground1: '#96781a',
  colorCompoundBrandForeground1Hover: '#7d6316',
  colorCompoundBrandForeground1Pressed: '#655013',
  colorCompoundBrandStroke: '#96781a',
  colorCompoundBrandStrokeHover: '#7d6316',
  colorCompoundBrandStrokePressed: '#655013',
};

export default function FluentUIProvider({ children }: FluentUIProviderProps) {
  return (
    <FluentProvider theme={cuernaToursTheme}>
      {children}
    </FluentProvider>
  );
}