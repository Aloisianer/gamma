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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"

import Link from "next/link";
import * as Icon from "react-feather";
import { usePageContext } from "./context/page";

export function AppSidebar() {
    let { setPage } = usePageContext();

    return (
        <Sidebar>
            <SidebarHeader className="m-1 rounded-xl">
                <Command>
                    <CommandInput placeholder="Search ..." />
                </Command>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>

                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                
            </SidebarFooter>
        </Sidebar>
    );
}