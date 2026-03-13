import { ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  enableSystem?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  enableSystem = true,
}: ThemeProviderProps) {
  return (
    <div className={`${defaultTheme} ${enableSystem ? "dark" : ""}`}>
      {children}
    </div>
  );
}
