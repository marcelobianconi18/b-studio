
"use client";

import { useState } from "react";
import InstagramPreview from "@/components/InstagramPreview";
import { PhotoIcon, CalendarIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { apiUrl } from "@/lib/api";

export default function SmartPublisher() {
    const [caption, setCaption] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [scheduledDate, setScheduledDate] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [resultMessage, setResultMessage] = useState("");

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSchedule = async () => {
        const trimmedCaption = caption.trim();
        if (!trimmedCaption && !image) {
            alert("Escreva uma legenda ou selecione uma imagem.");
            return;
        }

        const payload: Record<string, string> = {
            message: trimmedCaption || "Post agendado via bia",
        };
        if (scheduledDate) {
            payload.scheduled_time = new Date(scheduledDate).toISOString();
        }
        if (image && (image.startsWith("http://") || image.startsWith("https://"))) {
            payload.image_url = image;
        }

        setResultMessage("");
        setIsPosting(true);
        try {
            const res = await fetch(apiUrl("/api/posts/schedule"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "Falha ao agendar post.");
            }

            if (image && image.startsWith("data:")) {
                setResultMessage(`${data.message} (imagem local usada apenas para pré-visualização).`);
            } else {
                setResultMessage(data.message || "Post agendado com sucesso.");
            }
        } catch (error: any) {
            setResultMessage(error.message || "Falha ao agendar post.");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col lg:flex-row gap-12">

            {/* Editor Area */}
            <div className="flex-1 space-y-8">
                <header>
                    <h1 className="text-3xl font-black tracking-tighter mb-2">SMART PUBLISHER</h1>
                    <p className="text-[var(--muted)] text-sm">Create, Preview & Schedule</p>
                </header>

                <div className="space-y-6 bg-[var(--shell-surface)] p-8 rounded-3xl border border-[var(--shell-border)]">

                    {/* Image Uploader */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-2">Creative Asset</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[var(--shell-border)] border-dashed rounded-2xl cursor-pointer hover:bg-[var(--shell-side)] transition-all">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <PhotoIcon className="w-8 h-8 text-[var(--muted)] mb-2" />
                                    <p className="text-xs text-[var(--muted)]">Click to upload or drag and drop</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                    </div>

                    {/* Caption Editor */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-2">Caption</label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Write an engaging caption..."
                            className="w-full bg-black border border-[var(--shell-border)] rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 transition-all min-h-[120px]"
                        />
                        <div className="flex justify-between mt-2">
                            <span className="text-[10px] text-zinc-600 font-bold uppercase">AI Check: Good Tone</span>
                            <span className="text-[10px] text-zinc-600">{caption.length}/2200</span>
                        </div>
                    </div>

                    {/* Scheduler */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-2">Schedule Date</label>
                            <div className="relative">
                                <CalendarIcon className="w-5 h-5 absolute left-3 top-3 text-[var(--muted)]" />
                                <input
                                    type="datetime-local"
                                    className="w-full bg-black border border-[var(--shell-border)] rounded-xl py-3 pl-10 pr-4 text-sm text-[var(--muted)] focus:outline-none focus:border-blue-500"
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSchedule}
                        disabled={isPosting}
                        className="w-full py-4 bg-white text-black font-bold rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isPosting ? "Scheduling..." : (
                            <>
                                <CheckCircleIcon className="w-5 h-5" />
                                Schedule Post
                            </>
                        )}
                    </button>
                    {resultMessage && (
                        <p className="text-xs text-[var(--muted)]">{resultMessage}</p>
                    )}

                </div>
            </div>

            {/* Preview Area (Smartphone Mockup) */}
            <div className="lg:w-[400px] flex items-center justify-center bg-[var(--shell-surface)] rounded-[40px] border border-[var(--shell-border)] p-8">
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[35px] blur opacity-20" />
                    <InstagramPreview image={image} caption={caption} />
                </div>
            </div>

        </div>
    );
}
