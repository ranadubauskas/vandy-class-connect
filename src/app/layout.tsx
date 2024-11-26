"use client"
import { Poppins } from 'next/font/google';
import { useEffect, useState } from 'react';
import { FaArrowUp } from 'react-icons/fa';
import NavBar from './components/NavBar';
import "./globals.css";
import { AuthProvider } from "./lib/contexts";

const poppins = Poppins({
  subsets: ['latin'],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <AuthProvider>
          <div
            className="min-h-screen p-6"
            style={{
              background: `linear-gradient(
                0deg, 
                #C8D2F9 0%, 
                #7594A4 50%, 
                #84969F 79%, 
                #999999 100%)`,
            }}
          >
            <NavBar />
            {children}
            {showScrollToTop && (
              <button
                onClick={scrollToTop}
                className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition duration-300 z-50"
                aria-label="Scroll to Top"
              >
                <FaArrowUp size={20} />
              </button>
            )}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
