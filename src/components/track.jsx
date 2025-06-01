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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"
import { PlayIcon } from "lucide-react";
import { useRouter } from 'next/navigation';

let placeholderImage = "data:image/png;base64,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"

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

const ImageInspector = ({ src, alt }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <img
            src={src}
            alt={alt}
            className="w-75 h-75 object-cover rounded-xl cursor-pointer"
            onClick={() => setSelectedImage(src)}
          />
        </DialogTrigger>
        <DialogContent>
          {selectedImage && (
            <img src={selectedImage} alt={alt} className="w-full h-auto" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export function Track({ id, artwork, title, creator, variant }) {
  const [imageSrc, setImageSrc] = useState(placeholderImage);

  useEffect(() => {
    if (artwork && artwork !== "404 Not Found") {
      fetch(artwork)
        .then((response) => {
          if (response.ok) {
            setImageSrc(artwork);
          } else {
            setImageSrc(placeholderImage);
          }
        })
        .catch(() => setImageSrc(placeholderImage));
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
          onError={() => setImageSrc(placeholderImage)}
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

export function BigTrack({ id, artwork, title, creator }) {
  const [imageSrc, setImageSrc] = useState(placeholderImage);

  useEffect(() => {
    if (artwork && artwork !== "404 Not Found") {
      fetch(artwork)
        .then((response) => {
          if (response.ok) {
            setImageSrc(artwork);
          } else {
            setImageSrc(placeholderImage);
          }
        })
        .catch(() => setImageSrc(placeholderImage));
    }
  }, [artwork]);

  return (
    <Card className="w-full m-5 p-5">
        <div className="mt-2 text-center">
          <CardTitle className="text-[15px] overflow-ellipsis truncated-text overflow-hidden whitespace-nowrap pl-2 pr-2">
            {title}
          </CardTitle>
          <CardDescription className="text-[12px] text-gray-500 pb-2">
            {creator}
          </CardDescription>
        </div>

        <Button
          onClick={() => socket.emit("play", id, title)}
          className="w-15 h-15"
        >
          <PlayIcon />
        </Button>

      <CardContent className="p-0">
          <div className="flex justify-between w-full">
            <ImageInspector
              src={imageSrc}
              alt={title}
              onError={() => setImageSrc(placeholderImage)}
            />
          </div>
      </CardContent>
    </Card>
  );
}

export function SmallTrack({ id, artwork, title }) {
  let router = useRouter();
  const [imageSrc, setImageSrc] = useState(placeholderImage);

  useEffect(() => {
    if (artwork && artwork !== "404 Not Found") {
      fetch(artwork)
        .then((response) => {
          if (response.ok) {
            setImageSrc(artwork);
          } else {
            setImageSrc(placeholderImage);
          }
        })
        .catch(() => setImageSrc(placeholderImage));
    }
  }, [artwork]);

  return (
    <Button
      variant="outline"
      className="p-0.5"
      onClick={() => router.push(`/track?id=${id}`)}
    >
      <p
        className="text-[13px] overflow-ellipsis truncated-text overflow-hidden whitespace-nowrap pl-2 pr-2 min-w-15 max-w-40"
      >{title}</p>
      <img
        className="rounded-lg border-1"
        src={imageSrc}
        width={30}
        height={30}
        alt={id}
        onError={() => setImageSrc(placeholderImage)}
      />
    </Button>
  );
}