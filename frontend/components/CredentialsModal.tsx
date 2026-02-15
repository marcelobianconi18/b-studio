"use client";

import { useState, useEffect } from "react";
import { KeyIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { apiUrl } from "@/lib/api";

interface CredentialsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CredentialsModal({ isOpen, onClose }: CredentialsModalProps) {
    const [formData, setFormData] = useState({
        meta_access_token: "",
        meta_ad_account_id: "",
        meta_app_id: "",
        meta_app_secret: "",
        openai_api_key: ""
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetch(apiUrl("/api/system/credentials"))
                .then(res => res.json())
                .then(data => setFormData({
                    meta_access_token: data.meta_access_token || "",
                    meta_ad_account_id: data.meta_ad_account_id || "",
                    meta_app_id: data.meta_app_id || "",
                    meta_app_secret: data.meta_app_secret || "",
                    openai_api_key: data.openai_api_key || ""
                }))
                .catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const persistCredentials = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(apiUrl("/api/system/credentials"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.detail || data?.message || "Falha ao salvar credenciais.");
            }

            return true;
        } catch (error) {
            console.error(error);
            setError(error instanceof Error ? error.message : "Falha ao salvar credenciais.");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await persistCredentials();
        if (!ok) return;

        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
            onClose();
            window.location.reload();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <KeyIcon className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Configurar Chaves de API</h2>
                        <p className="text-xs text-zinc-500">Seus dados são salvos localmente no banco de dados.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 mb-6">
                        <h3 className="text-blue-400 text-sm font-bold mb-2">Conexão Automática (Recomendado)</h3>
                        <p className="text-xs text-blue-200/70 mb-4">Insira os dados do App Meta para gerar o token automaticamente.</p>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 mb-1">App ID</label>
                                <input
                                    type="text"
                                    className="w-full bg-black border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white"
                                    value={formData.meta_app_id}
                                    onChange={(e) => setFormData({ ...formData, meta_app_id: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 mb-1">App Secret</label>
                                <input
                                    type="password"
                                    className="w-full bg-black border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white"
                                    value={formData.meta_app_secret}
                                    onChange={(e) => setFormData({ ...formData, meta_app_secret: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={async () => {
                                const ok = await persistCredentials();
                                if (!ok) return;
                                window.location.href = apiUrl("/api/auth/facebook/login");
                            }}
                            disabled={!formData.meta_app_id || !formData.meta_app_secret}
                            className="w-full py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            Conectar com Facebook
                        </button>
                    </div>

                    <div className="border-t border-zinc-800 my-4 pt-4">
                        <p className="text-[10px] font-bold text-zinc-500 mb-4 uppercase tracking-wider">Configuração Manual (Avançado)</p>

                        {/* Meta Token */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-zinc-400 mb-1">Meta Access Token (Opcional se usar Login)</label>
                            <input
                                type="password"
                                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-zinc-700"
                                placeholder="EAAG..."
                                value={formData.meta_access_token}
                                onChange={(e) => setFormData({ ...formData, meta_access_token: e.target.value })}
                            />
                        </div>

                        {/* Meta Ad Account */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-zinc-400 mb-1">Meta Ad Account ID</label>
                            <input
                                type="text"
                                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-zinc-700"
                                placeholder="act_..."
                                value={formData.meta_ad_account_id}
                                onChange={(e) => setFormData({ ...formData, meta_ad_account_id: e.target.value })}
                            />
                        </div>

                        {/* OpenAI Key */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1">OpenAI / Groq API Key</label>
                            <input
                                type="password"
                                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-zinc-700"
                                placeholder="sk-..."
                                value={formData.openai_api_key}
                                onChange={(e) => setFormData({ ...formData, openai_api_key: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || success}
                            className={`flex-1 py-2.5 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2
                                ${success ? "bg-emerald-500 text-white" : "bg-white text-black hover:bg-zinc-200"}
                            `}
                        >
                            {loading ? "Salvando..." : success ? (
                                <>
                                    <CheckCircleIcon className="w-5 h-5" /> Salvo!
                                </>
                            ) : "Salvar Configurações"}
                        </button>
                    </div>
                    {error && (
                        <p className="text-xs text-red-400 pt-1">{error}</p>
                    )}
                </form>
            </div>
        </div>
    );
}
