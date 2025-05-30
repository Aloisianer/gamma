import "@/app/globals.css";
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { cookies } from "next/headers"
import { Toaster } from "@/components/ui/sonner"

export let metadata = {
  title: "Website Name",
  description: "Site Description",
  openGraph: {
    title: "Embed Title",
    description: "Site Description",
    url: "https://sound.hackrland.dev",
    images: ["https://embed.com/embedimage.png"],
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