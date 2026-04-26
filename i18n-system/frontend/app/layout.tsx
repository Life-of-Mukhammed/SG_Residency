// Root layout — just renders children.
// Actual <html> tag is in app/[locale]/layout.tsx so the `lang` attribute is set.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
