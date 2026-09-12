import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ECDAT — Enterprise Cryptographic Discovery & Analysis Tool",
  description:
    "Cryptographic inventory, CBOM, and quantum-readiness risk assessment for enterprise software assets.",
};

// Runs before React hydrates. Reads localStorage and applies the class
// to <html> so there is no flash of the wrong theme.
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('ecdat-theme');
    var theme = (stored === 'light' || stored === 'dark') ? stored : 'dark';
    var root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    root.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}