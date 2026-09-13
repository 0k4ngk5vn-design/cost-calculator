export default function RootLayout({ children }) {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
  );
}
