"use client";

import { useEffect, useState, Fragment, useCallback } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { socket } from "@/socket";
import { cva } from "class-variance-authority";
import { cn, formatFollowers } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "lucide-react";
import Link from 'next/link';
import { DialogTitle } from "@radix-ui/react-dialog";
import { Badge } from '@/components/ui/badge';
import { usePageContext } from "./context/page";

let placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEvmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI1LTA2LTAyPC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkV4dElkPjY2Mzk0NzUxLTJkNTgtNGYzNi1hMmFlLTIzYTRkNDc2NzZjMjwvQXR0cmliOkV4dElkPgogICAgIDxBdHRyaWI6RmJJZD41MjUyNjU5MTQxNzk1ODA8L0F0dHJpYjpGYklkPgogICAgIDxBdHRyaWI6VG91Y2hUeXBlPjI8L0F0dHJpYjpUb3VjaFR5cGU+CiAgICA8L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvQXR0cmliOkFkcz4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6ZGM9J2h0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvJz4KICA8ZGM6dGl0bGU+CiAgIDxyZGY6QWx0PgogICAgPHJkZjpsaSB4bWw6bGFuZz0neC1kZWZhdWx0Jz5VbnRpdGxlZCBkZXNpZ24gLSAxPC9yZGY6bGk+CiAgIDwvcmRmOkFsdD4KICA8L2RjOnRpdGxlPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlv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";

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

let ImageInspector = ({ src, alt, onError }) => {
  let [selectedImage, setSelectedImage] = useState(null);

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <img
            src={src}
            alt={alt}
            className="w-75 h-75 object-cover rounded-xl cursor-pointer"
            onClick={() => setSelectedImage(src)}
            onError={onError}
          />
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>{alt}</DialogTitle>
          {selectedImage && (
            <img src={selectedImage} alt={alt} className="w-full h-auto rounded-md" onError={onError} />
          )}
        </DialogContent>
        <DialogDescription hidden>
          {alt}
        </DialogDescription>
      </Dialog>
    </div>
  );
};

function Description({ text, tags }) {
  let urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  let [expanded, setExpanded] = useState(false);
  let [isOverflowing, setIsOverflowing] = useState(false);
  let [containerId] = useState(() => `desc-${Math.random().toString(36).slice(2)}`);
  let [measuredHeight, setMeasuredHeight] = useState(0);
  let collapsedStyle = "12.7rem";

  useEffect(() => {
    if (!text) return;

    let container = document.getElementById(containerId);
    if (!container) return;
    let p = container.querySelector("p");
    if (!p) return;

    let check = () => {
      let scrollH = p.scrollHeight;
      setMeasuredHeight(scrollH);
      setIsOverflowing(scrollH > parseFloat(getComputedStyle(document.documentElement).fontSize || 16) * 5.5 + 1);
    };

    check();
    let ro = new ResizeObserver(check);
    ro.observe(p);

    return () => ro.disconnect();
  }, [text, containerId]);

  let renderDescriptionWithLinks = (text) => {
    if (!text) return null;

    let parts = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      let url = match[0];

      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      let href = url.startsWith("http") ? url : `http://${url}`;

      parts.push(
        <a
          key={`link-${match.index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          {url}
        </a>
      );

      lastIndex = urlRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.map((part, index) => <Fragment key={index}>{part}</Fragment>);
  };

  if (!text) return null;

  let maxHeightStyle = expanded ? `${measuredHeight}px` : collapsedStyle;

  return (
    <div>
      <div id={containerId} className="relative">
        <p
          className="text-sm whitespace-pre-wrap overflow-hidden"
          style={{
            maxHeight: maxHeightStyle,
            transition: "max-height 290ms ease, opacity 290ms ease",
            opacity: expanded ? 1 : 1,
          }}
        >
          {renderDescriptionWithLinks(text)}
        </p>

        {!expanded && isOverflowing && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card/100 to-transparent" />
        )}
      </div>

      <div className="flex gap-2 items-center mt-2 text-right justify-between">
        <div className="grid grid-cols-3 grid-rows-1 overflow-ellipsis gap-2">
          {tags.map((tag) => (
            <Badge key={tag} className="w-full justify-start"># {tag}</Badge>
          ))}
        </div>
        {(isOverflowing || expanded) && (
          <Button
            variant="link"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs whitespace-nowrap"
            aria-expanded={expanded}
          >
            {expanded ? "Show less" : "Show more"}
          </Button>
        )}
      </div>
    </div>
  );
};

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

export function BigTrack({ id }) {
  let [imageSrc, setImageSrc] = useState(placeholderImage);
  let [page, setPage] = useState(1);
  let [artwork, setArtwork] = useState(placeholderImage);
  let [title, setTitle] = useState("Loading...");
  let [description, setDescription] = useState("");
  let [creator, setCreator] = useState({ id: "", username: "", avatar_url: "" });
  let [comments, setComments] = useState([]);
  let [tags, setTags] = useState([]);
  let [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try artwork first, then creator avatar, finally placeholder.
    const isDataUrl = (url) => typeof url === 'string' && url.startsWith('data:');
    const art = artwork && artwork !== "404 Not Found" && artwork !== placeholderImage && !isDataUrl(artwork) ? artwork : null;
    const avatar = creator && creator.avatar_url && creator.avatar_url !== "404 Not Found" && creator.avatar_url !== placeholderImage && !isDataUrl(creator.avatar_url) ? creator.avatar_url : null;

    let ac = new AbortController();
    let cancelled = false;

    const tryUrl = async (url) => {
      if (!url) return false;
      try {
        const res = await fetch(url, { signal: ac.signal });
        if (ac.signal.aborted || cancelled) return true; // stop further state updates
        if (res.ok) {
          setImageSrc(url.replaceAll('large', 't1080x1080'));
          return true;
        }
      } catch {
        if (ac.signal.aborted || cancelled) return true; // stop further state updates
      }
      return false;
    };

    (async () => {
      if (await tryUrl(art)) return;
      if (await tryUrl(avatar)) return;
      if (!ac.signal.aborted && !cancelled) setImageSrc(placeholderImage);
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [artwork, creator?.avatar_url]);

  useEffect(() => {
    let ac = new AbortController();
    setLoading(true);

    fetch(`/api/track-info?id=${id}&page=${page}&amount=20`, { signal: ac.signal })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        if (ac.signal.aborted) return;
        let tagListArray = [];
        let tagListRegex = /"([^"]*)"/g;
        let match;

        setArtwork((data.artwork_url || "").replaceAll('large', 't1080x1080') || placeholderImage);
        setTitle(data.title || "Unknown Title");
        setDescription(data.description || "");
        setCreator(data.user || { id: "", username: "Unknown User", avatar_url: placeholderImage });
        setComments(data.comments || []);

        while ((match = tagListRegex.exec(data.tag_list || "")) !== null) {
          tagListArray.push(match[1]);
        }

        setTags(tagListArray);
        setLoading(false);
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      ac.abort();
    };
  }, [id, page])

  let handleMainImageError = useCallback(() => {
    if (creator?.avatar_url && imageSrc !== creator.avatar_url) {
      setImageSrc(creator.avatar_url.replaceAll('large', 't1080x1080'));
    } else {
      setImageSrc(placeholderImage);
    }
  }, [creator?.avatar_url, imageSrc]);

  let loadNextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  let loadPreviousPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  return (
    <Card className="w-full p-6">
      <CardHeader className="p-0">
        <div className="p-0 flex gap-5">
          <ImageInspector
            src={imageSrc}
            alt={title}
            onError={handleMainImageError}
          />
          <Button
            onClick={() => socket.emit("play", id, title)}
            className="w-9 h-9"
          >
            <PlayIcon />
          </Button>
          <div className="flex flex-col w-150 gap-3">
            <p className="text-xl font-bold">{title}</p>
            <Description text={description} tags={tags} />
          </div>
        </div>
        <CardAction>
          <div className="pl-5">
            <Track
              type="user"
              id={creator.id}
              artwork={creator.avatar_url}
              title={creator.username}
              subtitle={creator.followers_count}
              variant="searchBox"
              link={`/user?id=${creator.id}`}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Comments */}
        {comments.map((comment) => (
          <Comment
            key={comment.id}
            artwork={comment.user.avatar_url}
            title={comment.user.username}
            text={comment.body}
            link={`/user?id=${comment.user.id}`}
          />
        ))}
      </CardContent>
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