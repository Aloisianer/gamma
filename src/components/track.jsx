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
import { cn } from "@/lib/utils"

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

export function Track({ id, artwork, title, creator, variant }) {
  const [imageSrc, setImageSrc] = useState(artwork);

  useEffect(() => {
    async function validateImage(url) {
      try {
        const response = await fetch(url, { method: "HEAD" });
        const contentType = response.headers.get("content-type");

        if (!contentType || !contentType.startsWith("image")) {
          setImageSrc("/no-artwork.png");
        }
      } catch (error) {
        setImageSrc("/no-artwork.png");
      }
    }

    if (artwork) {
      validateImage(artwork);
    }
  }, [artwork]);

  return (
    <Card className={cn(variants({ variant }))}>
      <CardContent className="p-0">
        <img
          src={imageSrc}
          alt={title}
          className="w-full max-h-50 min-h-10 object-cover cursor-pointer rounded-xl"
          onClick={() => socket.emit("play", id, title)}
        />
        <div className="mt-2 text-center">
          <CardTitle className="text-[15px] overflow-ellipsis truncated-text overflow-hidden whitespace-nowrap pl-2 pr-2">
            {title}
          </CardTitle>
          <CardDescription className="text-[12px] text-gray-500 pb-2">
            {creator}
          </CardDescription>
        </div>
      </CardContent>
    </Card>
  );
}