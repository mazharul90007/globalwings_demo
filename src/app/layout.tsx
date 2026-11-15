import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { Toasts } from "@/components/ui/Toasts";
import { StoreProvider } from "@/lib/store";
import "remixicon/fonts/remixicon.css";
import "./globals.css";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Schedule Management · SVP prototype",
  description: "Clickable prototype of the SVP Schedule Management feature, with dummy data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${hanken.variable} h-full antialiased`}>
      {/* Browser extensions (e.g. ColorZilla) add attributes to body; ignore those mismatches. */}
      <body className="min-h-full font-sans text-[13.5px]" suppressHydrationWarning>
        <StoreProvider>
          {children}
          <Toasts />
        </StoreProvider>
      </body>
    </html>
  );
}
