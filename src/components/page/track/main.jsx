"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { placeholderImage } from "@/lib/utils";
import { Card, CardHeader, CardAction, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Track, Comment } from "@/components/track";
import { socket } from "@/socket";
import * as Icon from "lucide-react";

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

export function Main({ data }) {
    let [imageSrc, setImageSrc] = useState(placeholderImage);
    let [page, setPage] = useState(1);
    let [artwork, setArtwork] = useState(placeholderImage);
    let [title, setTitle] = useState("Loading...");
    let [description, setDescription] = useState("");
    let [creator, setCreator] = useState({ id: "", username: "", avatar_url: "" });
    let [comments, setComments] = useState([]);
    let [tags, setTags] = useState([]);
    let [selectedImage, setSelectedImage] = useState(null);
    let [loading, setLoading] = useState(true);

    useEffect(() => {
        const isDataUrl = (url) => typeof url === 'string' && url.startsWith('data:');
        const art = artwork && artwork !== "404 Not Found" && artwork !== placeholderImage && !isDataUrl(artwork) ? artwork : null;
        const avatar = creator && creator.avatar_url && creator.avatar_url !== "404 Not Found" && creator.avatar_url !== placeholderImage && !isDataUrl(creator.avatar_url) ? creator.avatar_url : null;

        let ac = new AbortController();
        let cancelled = false;

        const tryUrl = async (url) => {
            if (!url) return false;
            try {
                const res = await fetch(url, { signal: ac.signal });
                if (ac.signal.aborted || cancelled) return true;
                if (res.ok) {
                    setImageSrc(url.replaceAll('large', 't1080x1080'));
                    return true;
                }
            } catch {
                if (ac.signal.aborted || cancelled) return true;
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

        fetch(`/api/track-info?id=${data}&page=${page}&amount=20`, { signal: ac.signal })
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
    }, [data, page])

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
        <div className="p-5">
            <Card className="w-full p-6">
                <CardHeader className="p-0">
                    <div className="p-0 flex gap-5">
                        <Dialog>
                            <DialogTrigger asChild>
                                <img
                                    src={imageSrc}
                                    alt={title}
                                    className="w-75 h-75 object-cover rounded-xl cursor-pointer"
                                    onClick={() => setSelectedImage(imageSrc)}
                                    onError={handleMainImageError}
                                />
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>{title}</DialogTitle>
                                {selectedImage && (
                                    <img src={selectedImage} alt={title} className="w-full h-auto rounded-md" onError={handleMainImageError} />
                                )}
                            </DialogContent>
                            <DialogDescription hidden>
                                {title}
                            </DialogDescription>
                        </Dialog>
                        <Button
                            onClick={() => socket.emit("play", data, title)}
                            className="w-9 h-9"
                        >
                            <Icon.PlayIcon />
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
        </div>
    );
};