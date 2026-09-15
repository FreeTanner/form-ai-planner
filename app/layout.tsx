import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Form — A healthier week, your way",
  description: "Training, meals, and groceries. One thoughtful plan built around your real life.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f7f8f5" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
