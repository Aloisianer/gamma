import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter
} from "@/components/ui/sidebar";

import Link from "next/link";
import * as Icon from "react-feather";

let items = [
    { title: "Home", url: "#", icon: Icon.Home },
    { title: "Inbox", url: "#", icon: Icon.Inbox },
    { title: "Calendar", url: "#", icon: Icon.Calendar },
    { title: "Search", url: "#", icon: Icon.Search },
    { title: "Settings", url: "#", icon: Icon.Settings }
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" className="hidden xl:block">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>HackrPlayer</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="ml-[0.49]">
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}