import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Search } from "@/components/search";
import { AudioPlayer } from "@/components/player";
import { PageProvider } from "@/components/context/page";

export let metadata = {
  title: "Gamma",
  description: "All-In-One Music App",
  openGraph: {
    title: "Gamma",
    description: "All-In-One Music App",
    url: "https://sound.hackrland.dev",
    images: ["https://embed.com/embedimage.png"],
  }
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={'antialiased dark w-full h-full'}>
        <PageProvider>
          <SidebarProvider>
            <AppSidebar />
            <main className="w-full h-full">
              <AudioPlayer />
              {children}
            </main>
          </SidebarProvider>
          <Toaster />
          <Search />
        </PageProvider>
      </body>
    </html>
  );
}