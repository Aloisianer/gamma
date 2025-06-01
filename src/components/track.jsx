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
  return (
    <Card className={cn(variants({ variant }))}>
      <CardContent className="p-0">
        <img
          src={artwork}
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

export function BigTrack({ id, artwork, title, creator }) {
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
              src={artwork}
              alt={title}
              onClick={() => socket.emit("play", id, title)}
            />
          </div>
      </CardContent>
    </Card>
  );
}