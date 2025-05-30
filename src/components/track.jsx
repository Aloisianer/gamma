import Image from 'next/image'
import {
  Button
} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { socket } from "@/socket";
import { useEffect, useState } from "react";

export function Track({ id, artwork, title, creator }) {
    return (
      <Card className="max-w-xs p-0 xl:w-50 w-38 border-1">
        <CardContent className="p-0">
          <img
            src={artwork}
            alt={title}
            className="w-full xl:h-50 h-38 object-cover cursor-pointer rounded-xl"
            onClick={() => socket.emit('play', id)}
          />
          <div className="mt-2 text-center">
            <CardTitle className="text-[15px] overflow-ellipsis truncated-text overflow-hidden whitespace-nowrap pl-2 pr-2">{title}</CardTitle>
            <CardDescription className="text-[12px] text-gray-500 pb-2">{creator}</CardDescription>
          </div>
        </CardContent>
      </Card>
    )
}