import "@/app/globals.css";
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { cookies } from "next/headers"
import { Toaster } from "@/components/ui/sonner"

export let metadata = {
  title: "Sound",
  description: "Open Source, SoundCloud API powered Music Player",
  openGraph: {
    title: "Sound",
    description: "Open Source, SoundCloud API powered Music Player",
    url: "https://sound.hackrland.dev",
    images: ["https://sound.hackrland.dev/embed.png"],
  }
};

export default async function RootLayout({ children }) {
  let cookieStore = await cookies()
  let defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <html lang="en">
      <body className={'antialiased dark'}>
        <SidebarProvider defaultOpen={defaultOpen}
          style={{
            "--sidebar-width": "13rem",
            "--sidebar-width-mobile": "20rem",
          }}
        >
          <AppSidebar />
          <main className="w-full h-full">{children}</main>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}