"use client";

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
    SidebarFooter,
    SidebarTrigger
} from "@/components/ui/sidebar";

import Link from "next/link";
import * as Icon from "react-feather";
import { usePageContext } from "./context/page";

let items = [
    { title: "Search", id: "search", icon: Icon.Search },
    { title: "Settings", url: "settings", icon: Icon.Settings }
];

export function AppSidebar() {
    let { setPage } = usePageContext();

    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>I need a name for this</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="ml-[0.49]">
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton tooltip={item.title} onClick={() => {
                                        setPage({ name: item.id, data: "" })
                                    }}>
                                        <item.icon />
                                        <p>{item.title}</p>
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