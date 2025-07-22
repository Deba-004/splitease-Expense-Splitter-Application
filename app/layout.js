import { Inter } from "next/font/google";
import Header from "@/components/NavBar";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "splitease",
  description: "A smarter way to split expenses",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Logos/icon1.png" sizes="any" />
      </head>
      <body className={`${inter.className}`}>
        <ClerkProvider>
          <ConvexClientProvider>
            <Header />
            <main>
              {children}
              <Toaster />
            </main>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
