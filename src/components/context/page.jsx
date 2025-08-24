"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
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
    // Internal state holder, do not export directly to avoid bypassing history sync
    const [page, setPageState] = useState({ name: "home", data: "weewoo" });
    const isHandlingPop = useRef(false);
    const lastPushedRef = useRef(null);

    // Initialize history state on mount
    useEffect(() => {
        try {
            // Replace current history entry with our initial page state if missing
            if (!history.state || !history.state.__page) {
                history.replaceState({ __page: page }, document.title);
                lastPushedRef.current = page;
            } else if (history.state?.__page) {
                // If there is already a page in state (e.g., reload), sync it
                setPageState(history.state.__page);
                lastPushedRef.current = history.state.__page;
            }
        } catch { /* no-op in non-browser envs */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle browser back/forward (incl. mouse side buttons)
    useEffect(() => {
        const onPop = (ev) => {
            // Only react to entries we created
            const next = ev.state?.__page;
            if (!next) return;
            isHandlingPop.current = true;
            setPageState(next);
            lastPushedRef.current = next;
            // Small timeout to avoid immediate push from setPage side-effects
            setTimeout(() => { isHandlingPop.current = false; }, 0);
        };
        window.addEventListener("popstate", onPop);
        return () => window.removeEventListener("popstate", onPop);
    }, []);

    // Public navigation-aware setter
    const setPage = (next) => {
        // Support functional updates for convenience
        const value = typeof next === "function" ? next(page) : next;
        setPageState(value);

        if (isHandlingPop.current) return; // don't push during pop handling

        try {
            // Avoid pushing duplicates
            const prev = lastPushedRef.current;
            const same = prev && prev.name === value.name && JSON.stringify(prev.data) === JSON.stringify(value.data);
            if (!same) {
                history.pushState({ __page: value }, document.title);
                lastPushedRef.current = value;
            }
        } catch { /* ignore if history is unavailable */ }
    };

    const goBack = () => {
        try { history.back(); } catch { /* noop */ }
    };

    const goForward = () => {
        try { history.forward(); } catch { /* noop */ }
    };

    return (
        <PageContext.Provider value={{ page, setPage, goBack, goForward }}>
            {children}
        </PageContext.Provider>
    );
};