
"use client";

import { useState } from "react";
import Image from "next/image";
import {
    HeartIcon,
    ChatBubbleOvalLeftIcon,
    PaperAirplaneIcon,
    BookmarkIcon
} from "@heroicons/react/24/outline";

interface InstagramPreviewProps {
    image: string | null;
    caption: string;
    username?: string;
}

export default function InstagramPreview({ image, caption, username = "b_studio_official" }: InstagramPreviewProps) {
    return (
        <div className="w-[375px] bg-white text-black rounded-[30px] overflow-hidden shadow-2xl border border-zinc-200 mx-auto font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                        <div className="w-full h-full bg-white rounded-full p-[2px]">
                            <img
                                src={`https://ui-avatars.com/api/?name=${username}&background=random`}
                                alt="profile"
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                    </div>
                    <span className="text-xs font-bold lowercase">{username}</span>
                </div>
                <button className="text-black font-bold">...</button>
            </div>

            {/* Content */}
            <div className="aspect-square bg-zinc-100 relative">
                {image ? (
                    <img src={image} alt="Post preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full text-zinc-400 text-xs">
                        No Image Selected
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-4 py-3">
                <div className="flex justify-between mb-3">
                    <div className="flex gap-4">
                        <HeartIcon className="w-6 h-6 hover:text-zinc-500 cursor-pointer" />
                        <ChatBubbleOvalLeftIcon className="w-6 h-6 hover:text-zinc-500 cursor-pointer" />
                        <PaperAirplaneIcon className="w-6 h-6 hover:text-zinc-500 cursor-pointer -rotate-45" />
                    </div>
                    <BookmarkIcon className="w-6 h-6 hover:text-zinc-500 cursor-pointer" />
                </div>

                <div className="space-y-1">
                    <p className="text-xs font-bold">1,234 likes</p>
                    <p className="text-xs leading-snug">
                        <span className="font-bold mr-2 lowercase">{username}</span>
                        {caption || <span className="text-zinc-400 italic">Write a caption...</span>}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase mt-2">2 hours ago</p>
                </div>
            </div>
        </div>
    );
}
