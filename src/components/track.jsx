"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { socket } from "@/socket";
import { cva } from "class-variance-authority";
import { cn, formatFollowers, placeholderImage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePageContext } from "./context/page";
import { Skeleton } from "./ui/skeleton";

let variants = cva(
  "p-0 max-w-50 min-w-10 border-1",
  {
    variants: {
      variant: {
        default:
          "",
        searchBox:
          "bg-secondary",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export function Track({ type, id, artwork, title, subtitle, variant, link }) {
  let [imageSrc, setImageSrc] = useState(placeholderImage);
  let { setPage } = usePageContext();

  useEffect(() => {
    if (!artwork || artwork === "404 Not Found") return;

    let ac = new AbortController();
    let cancelled = false;

    fetch(artwork, { signal: ac.signal })
      .then((response) => {
        if (ac.signal.aborted || cancelled) return;
        if (response.ok) {
          setImageSrc(artwork);
        } else {
          setImageSrc(placeholderImage);
        }
      })
      .catch(() => {
        if (ac.signal.aborted || cancelled) return;
        setImageSrc(placeholderImage);
      });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [artwork]);

  return (
    <Card className={cn(variants({ variant }))}>
      <CardContent className="p-0">
        {type === "track" ? (
          <img
            src={imageSrc}
            alt={title}
            className="w-full max-h-50 min-h-10 object-cover cursor-pointer rounded-xl"
            onClick={() => socket.emit("play", id, title)}
            onError={() => setImageSrc(placeholderImage)}
          />
        ) : null}
        {type === "user" ? (
          <div onClick={() => {
            setPage({ name: "user", data: id })
          }}>
            <img
              src={imageSrc}
              alt={title}
              className="w-full p-3 max-h-50 min-h-10 object-cover cursor-pointer rounded-full"
              onError={() => setImageSrc(placeholderImage)}
            />
          </div>
        ) : null}
        {type === "playlist" ? (
          <div onClick={() => {
            setPage({ name: "playlist", data: id })
          }}>
            <img
              src={imageSrc}
              alt={title}
              className="w-full max-h-50 min-h-10 object-cover cursor-pointer rounded-xl"
              onError={() => setImageSrc(placeholderImage)}
            />
          </div>
        ) : null}
        {type === "unknown" ? (
          <img
            src={imageSrc}
            alt={title}
            className="w-full max-h-50 min-h-10 object-cover cursor-pointer rounded-xl"
            onError={() => setImageSrc(placeholderImage)}
          />
        ) : null}
        <div className="mt-2 text-center">
          <CardTitle className="text-[15px] overflow-ellipsis truncated-text overflow-hidden whitespace-nowrap pl-2 pr-2">
            <div onClick={() => {
              setPage({ name: type, data: id })
            }}>{title}</div>
          </CardTitle>
          <CardDescription className="text-[12px] text-foreground/50 pb-2 overflow-ellipsis truncated-text overflow-hidden whitespace-nowrap pl-2 pr-2">
            {type === "user" && subtitle ? formatFollowers(subtitle) : subtitle}
          </CardDescription>
        </div>
      </CardContent>
    </Card>
  );
};

export function LoadingTrack() {
  return (
    <Card className={cn("bg-card border-border", "w-full")}>
      <CardContent className="p-0">
        <div className="relative w-full pb-[100%]">
          <Skeleton className="absolute inset-0 w-full h-full bg-skeleton rounded-xl" />
        </div>

        <div className="mt-2 px-2 pb-2 space-y-2">
          <Skeleton className="h-4 w-3/4 bg-skeleton rounded" />
          <Skeleton className="h-3 w-1/2 bg-skeleton rounded" />
        </div>
      </CardContent>
    </Card>
  );
};

export function Comment({ id, artwork, title, text }) {
  let [imageSrc, setImageSrc] = useState(placeholderImage);
  let { setPage } = usePageContext();

  useEffect(() => {
    if (!artwork || artwork === "404 Not Found") return;

    let ac = new AbortController();
    let cancelled = false;

    fetch(artwork, { signal: ac.signal })
      .then((response) => {
        if (ac.signal.aborted || cancelled) return;
        if (response.ok) {
          setImageSrc(artwork);
        } else {
          setImageSrc(placeholderImage);
        }
      })
      .catch(() => {
        if (ac.signal.aborted || cancelled) return;
        setImageSrc(placeholderImage);
      });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [artwork]);

  return (
    <Card className="bg-secondary p-0">
      <div className="flex items-center">
        <div onClick={() => {
          setPage({ name: "user", data: id })
        }}>
          <img
            src={imageSrc}
            alt={title}
            className="w-full p-3 max-h-18 min-h-10 object-cover cursor-pointer rounded-full"
            onError={() => setImageSrc(placeholderImage)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">{title}</p>
          <p className="text-sm">{text}</p>
        </div>
      </div>
    </Card>
  );
};

export function MediumTrack({ type, id, artwork, title, subtitle, link }) {
  let [imageSrc, setImageSrc] = useState(placeholderImage);

  useEffect(() => {
    if (!artwork || artwork === "404 Not Found") return;

    let ac = new AbortController();
    let cancelled = false;

    fetch(artwork, { signal: ac.signal })
      .then((response) => {
        if (ac.signal.aborted || cancelled) return;
        if (response.ok) {
          setImageSrc(artwork.replaceAll('large', 't500x500'));
        } else {
          setImageSrc(placeholderImage);
        }
      })
      .catch(() => {
        if (ac.signal.aborted || cancelled) return;
        setImageSrc(placeholderImage);
      });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [artwork]);

  return (
    <Button
      variant="outline"
      className="p-0.5 h-17 w-50"
      onClick={() => socket.emit("play", id, title)}
    >
      <p
        className="text-[13px] overflow-ellipsis truncated-text overflow-hidden whitespace-nowrap pl-2 pr-2 min-w-15 max-w-40"
      >{title}</p>
      <img
        className="rounded-lg border-1"
        src={imageSrc}
        width={60}
        height={60}
        alt={id}
        onError={() => setImageSrc(placeholderImage)}
      />
    </Button>
  );
};

export function SmallTrack({ id, artwork, title }) {
  let [imageSrc, setImageSrc] = useState(placeholderImage);
  let { setPage } = usePageContext();

  useEffect(() => {
    if (!artwork || artwork === "404 Not Found") return;

    fetch(artwork)
      .then((response) => {
        if (response.ok) {
          setImageSrc(artwork.replaceAll('large', 't50x50'));
        } else {
          setImageSrc(placeholderImage);
        }
      })
      .catch(() => {
        setImageSrc(placeholderImage);
      });
  }, [artwork]);

  return (
    <Button variant="outline" className="p-0.5" onClick={() => {
      setPage({ name: "track", data: id })
    }}>
      <p
        className="text-[13px] overflow-ellipsis truncated-text overflow-hidden whitespace-nowrap pl-2 pr-2 min-w-15 max-w-40"
      >{title}</p>
      <img
        className="rounded-lg border-1"
        src={imageSrc}
        alt="Artwork"
        width={30}
        height={30}
        onError={() => setImageSrc(placeholderImage)}
      />
    </Button>
  );
};