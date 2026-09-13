import "./globals.css";

export const metadata = {
  title: "Cost Calculator",
  description: "Cost Calculator",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
        </ThemeProvider> */}
        {children}
      </body>
    </html>
  );
}
