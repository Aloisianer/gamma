"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

let PageContext = createContext();

export function usePageContext() {
    let context = useContext(PageContext);
    if (context === undefined) {
        throw new Error(
            "usePageContext must be used within a PageProvider",
        );
    }
    return context;
};

export function PageProvider({ children }) {
    let [page, setPage] = useState({ name: "home", data: "weewoo" });

    useEffect(() => {
        console.log(page);
    }, [page])

    return (
        <PageContext.Provider value={{ page, setPage }}>
            {children}
        </PageContext.Provider>
    );
};