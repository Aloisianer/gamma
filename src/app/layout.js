import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cookies } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { Search } from "@/components/search";
import AudioPlayer from "@/components/player";
import Navbar from "@/components/navbar"

export let metadata = {
  title: "I need a name for this",
  description: "An alternative SoundCloud FrontEnd (powered by SoundCloud)",
  openGraph: {
    title: "I need a name for this",
    description: "An alternative SoundCloud FrontEnd (powered by SoundCloud)",
    url: "https://sound.hackrland.dev",
    images: ["https://embed.com/embedimage.png"],
  }
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={'antialiased dark w-full h-full'}>
        <SidebarProvider>
          <AppSidebar />
          <main className="w-full h-full">
            <AudioPlayer />
            {children}
          </main>
        </SidebarProvider>
        <Toaster />
        <Search />
      </body>
    </html>
  );
}