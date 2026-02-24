"use client";

import { useState } from "react";
import {
    UserCircleIcon,
    EnvelopeIcon,
    PhoneIcon,
    BuildingOfficeIcon,
    GlobeAltIcon,
    ShieldCheckIcon,
    TrashIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    LinkIcon,
    KeyIcon,
    CameraIcon,
} from "@heroicons/react/24/outline";

// ─── Types ───────────────────────────────────────────────────────────────
type ProfileTab = "general" | "social" | "security" | "deletion";

type SocialLink = {
    platform: string;
    icon: string;
    url: string;
    color: string;
};

// ─── Profile Page ────────────────────────────────────────────────────────
export default function ProfilePage() {
    const [activeSection, setActiveSection] = useState<ProfileTab>("general");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [saved, setSaved] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "Marcelo Bianconi",
        email: "marcelo@bianconimkt.com",
        phone: "+55 45 99901-0000",
        company: "Bianconi Estratégia & Marketing",
        role: "CEO & Estrategista Digital",
        website: "https://bianconimkt.com",
        bio: "Especialista em marketing digital, tráfego pago e estratégia de crescimento para negócios.",
        timezone: "America/Sao_Paulo",
    });

    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
        { platform: "Instagram", icon: "📸", url: "@bianconimkt", color: "from-[#F58529] via-[#DD2A7B] to-[#515BD4]" },
        { platform: "Facebook", icon: "📘", url: "bianconi.estrategia", color: "from-[#1877F2] to-[#0a5dc2]" },
        { platform: "LinkedIn", icon: "💼", url: "marcelobianconi", color: "from-[#0077B5] to-[#005582]" },
        { platform: "WhatsApp", icon: "💬", url: "+55 45 99901-0000", color: "from-[#25D366] to-[#128C7E]" },
    ]);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleDeleteAccount = () => {
        if (deleteConfirmText === "EXCLUIR MINHA CONTA") {
            alert("Solicitação de exclusão enviada. Seus dados serão removidos em até 30 dias.");
            setShowDeleteConfirm(false);
            setDeleteConfirmText("");
        }
    };

    const sections: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
        { key: "general", label: "Geral", icon: <UserCircleIcon className="w-4 h-4" /> },
        { key: "social", label: "Redes Sociais", icon: <GlobeAltIcon className="w-4 h-4" /> },
        { key: "security", label: "Segurança", icon: <ShieldCheckIcon className="w-4 h-4" /> },
        { key: "deletion", label: "Exclusão de Dados", icon: <TrashIcon className="w-4 h-4" /> },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 h-full overflow-y-auto hide-scrollbar">
            {/* ── Sidebar Navigation ── */}
            <div className="w-full lg:w-72 shrink-0">
                {/* Avatar Card */}
                <div className="bg-[var(--shell-surface)] backdrop-blur-xl border border-[var(--shell-border)] rounded-2xl p-6 mb-4 text-center relative group">
                    <div className="relative inline-block mb-4">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[var(--shell-border)] mx-auto shadow-xl">
                            <img
                                src="https://i.pravatar.cc/150?img=47"
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center border-2 border-[var(--shell-surface)] transition-colors shadow-lg">
                            <CameraIcon className="w-4 h-4 text-white" />
                        </button>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--foreground)]">{formData.name}</h3>
                    <p className="text-xs text-[var(--muted)] mt-1">{formData.role}</p>
                    <p className="text-[10px] text-[var(--muted)] mt-2 opacity-60">{formData.email}</p>
                </div>

                {/* Nav Tabs */}
                <div className="bg-[var(--shell-surface)] backdrop-blur-xl border border-[var(--shell-border)] rounded-2xl p-2 space-y-1">
                    {sections.map((section) => (
                        <button
                            key={section.key}
                            onClick={() => setActiveSection(section.key)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === section.key
                                    ? section.key === "deletion"
                                        ? "bg-red-500/15 text-red-400 border border-red-500/20"
                                        : "bg-white/10 text-[var(--foreground)] border border-white/10"
                                    : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)] border border-transparent"
                                }`}
                        >
                            {section.icon}
                            {section.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1 min-w-0">
                {/* ─── General Section ─── */}
                {activeSection === "general" && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <SectionCard title="Informações Pessoais" subtitle="Dados básicos da sua conta">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <InputField
                                    label="Nome Completo"
                                    icon={<UserCircleIcon className="w-4 h-4" />}
                                    value={formData.name}
                                    onChange={(v) => setFormData({ ...formData, name: v })}
                                />
                                <InputField
                                    label="E-mail"
                                    icon={<EnvelopeIcon className="w-4 h-4" />}
                                    value={formData.email}
                                    onChange={(v) => setFormData({ ...formData, email: v })}
                                    type="email"
                                />
                                <InputField
                                    label="Telefone"
                                    icon={<PhoneIcon className="w-4 h-4" />}
                                    value={formData.phone}
                                    onChange={(v) => setFormData({ ...formData, phone: v })}
                                />
                                <InputField
                                    label="Cargo"
                                    icon={<BuildingOfficeIcon className="w-4 h-4" />}
                                    value={formData.role}
                                    onChange={(v) => setFormData({ ...formData, role: v })}
                                />
                                <InputField
                                    label="Empresa"
                                    icon={<BuildingOfficeIcon className="w-4 h-4" />}
                                    value={formData.company}
                                    onChange={(v) => setFormData({ ...formData, company: v })}
                                />
                                <InputField
                                    label="Website"
                                    icon={<GlobeAltIcon className="w-4 h-4" />}
                                    value={formData.website}
                                    onChange={(v) => setFormData({ ...formData, website: v })}
                                />
                            </div>

                            <div className="mt-5">
                                <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 block">Bio</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    rows={3}
                                    className="w-full bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 resize-none transition-all placeholder:text-[var(--muted)]"
                                    placeholder="Conte um pouco sobre você..."
                                />
                            </div>
                        </SectionCard>

                        <SectionCard title="Fuso Horário" subtitle="Configuração de horário local">
                            <select
                                value={formData.timezone}
                                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                className="w-full md:w-80 bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                            >
                                <option value="America/Sao_Paulo">🇧🇷 Brasília (GMT-3)</option>
                                <option value="America/Manaus">🇧🇷 Manaus (GMT-4)</option>
                                <option value="America/New_York">🇺🇸 New York (GMT-5)</option>
                                <option value="Europe/Lisbon">🇵🇹 Lisboa (GMT+0)</option>
                            </select>
                        </SectionCard>

                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                            >
                                {saved ? (
                                    <>
                                        <CheckCircleIcon className="w-5 h-5" />
                                        Salvo!
                                    </>
                                ) : (
                                    "Salvar Alterações"
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Social Links Section ─── */}
                {activeSection === "social" && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <SectionCard title="Redes Sociais" subtitle="Links das suas redes e contatos profissionais">
                            <div className="space-y-3">
                                {socialLinks.map((link, i) => (
                                    <div
                                        key={link.platform}
                                        className="flex items-center gap-4 bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-xl px-4 py-3 group hover:border-white/20 transition-all"
                                    >
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center text-lg shadow-md shrink-0`}>
                                            {link.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">{link.platform}</p>
                                            <input
                                                value={link.url}
                                                onChange={(e) => {
                                                    const updated = [...socialLinks];
                                                    updated[i] = { ...link, url: e.target.value };
                                                    setSocialLinks(updated);
                                                }}
                                                className="w-full bg-transparent text-sm text-[var(--foreground)] focus:outline-none mt-0.5"
                                            />
                                        </div>
                                        <LinkIcon className="w-4 h-4 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </div>
                                ))}
                            </div>

                            <button className="mt-4 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-[var(--shell-border)] text-[var(--foreground)] text-xs font-semibold rounded-xl transition-all flex items-center gap-2">
                                <span className="text-lg">+</span>
                                Adicionar Rede Social
                            </button>
                        </SectionCard>

                        <SectionCard title="Contas Conectadas" subtitle="Contas de mídia vinculadas ao bia">
                            <div className="space-y-3">
                                <ConnectedAccount
                                    name="Meta Business Suite"
                                    detail="Marcelo Bianconi • 17 páginas"
                                    icon="📘"
                                    color="bg-[#1877F2]"
                                    connected
                                />
                                <ConnectedAccount
                                    name="Google Ads"
                                    detail="Não conectado"
                                    icon="🔍"
                                    color="bg-[#4285F4]"
                                    connected={false}
                                />
                                <ConnectedAccount
                                    name="TikTok Ads"
                                    detail="Não conectado"
                                    icon="🎵"
                                    color="bg-[#000000]"
                                    connected={false}
                                />
                            </div>
                        </SectionCard>

                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                            >
                                {saved ? (
                                    <>
                                        <CheckCircleIcon className="w-5 h-5" />
                                        Salvo!
                                    </>
                                ) : (
                                    "Salvar Alterações"
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Security Section ─── */}
                {activeSection === "security" && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <SectionCard title="Segurança da Conta" subtitle="Gerencie sua senha e autenticação">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <InputField
                                    label="Senha Atual"
                                    icon={<KeyIcon className="w-4 h-4" />}
                                    value=""
                                    onChange={() => { }}
                                    type="password"
                                    placeholder="••••••••"
                                />
                                <div /> {/* Spacer */}
                                <InputField
                                    label="Nova Senha"
                                    icon={<KeyIcon className="w-4 h-4" />}
                                    value=""
                                    onChange={() => { }}
                                    type="password"
                                    placeholder="Mínimo 8 caracteres"
                                />
                                <InputField
                                    label="Confirmar Nova Senha"
                                    icon={<KeyIcon className="w-4 h-4" />}
                                    value=""
                                    onChange={() => { }}
                                    type="password"
                                    placeholder="Repita a nova senha"
                                />
                            </div>
                        </SectionCard>

                        <SectionCard title="Sessões Ativas" subtitle="Dispositivos conectados à sua conta">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-xl px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                                            <span className="text-lg">💻</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--foreground)]">Mac Mini M4 — Edge</p>
                                            <p className="text-xs text-[var(--muted)]">Sessão atual • Foz do Iguaçu, PR</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full">Ativo</span>
                                </div>
                            </div>
                        </SectionCard>

                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                            >
                                Atualizar Senha
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Data Deletion Section ─── */}
                {activeSection === "deletion" && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-red-400">Zona de Perigo</h3>
                                    <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">
                                        As ações abaixo são <strong>irreversíveis</strong>. Após a exclusão, todos os seus dados,
                                        configurações, histórico de campanhas e tokens de acesso serão permanentemente removidos.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <SectionCard title="Exclusão de Dados do Usuário" subtitle="Solicite a remoção dos seus dados pessoais">
                            <div className="space-y-4">
                                <DeletionOption
                                    title="Exportar Meus Dados"
                                    description="Baixe uma cópia de todas as suas informações antes de excluir."
                                    buttonLabel="Exportar Dados"
                                    buttonColor="bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
                                    onClick={() => alert("Exportação de dados iniciada. Você receberá um email com o link para download.")}
                                />
                                <DeletionOption
                                    title="Desconectar Todas as Contas"
                                    description="Remove todos os tokens de acesso e desconecta Meta, Google e outras integrações."
                                    buttonLabel="Desconectar Tudo"
                                    buttonColor="bg-amber-600 hover:bg-amber-500 shadow-amber-500/20"
                                    onClick={() => alert("Todas as contas foram desconectadas.")}
                                />
                                <DeletionOption
                                    title="Excluir Histórico de Campanhas"
                                    description="Remove todos os relatórios, auditorias e histórico de performance de campanhas."
                                    buttonLabel="Excluir Histórico"
                                    buttonColor="bg-orange-600 hover:bg-orange-500 shadow-orange-500/20"
                                    onClick={() => alert("Histórico de campanhas excluído.")}
                                />
                            </div>
                        </SectionCard>

                        <SectionCard title="Excluir Conta Permanentemente" subtitle="Esta ação é irreversível">
                            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-5 space-y-4">
                                <p className="text-sm text-[var(--muted)] leading-relaxed">
                                    Ao excluir sua conta, <strong className="text-red-400">todos os dados serão removidos permanentemente</strong>, incluindo:
                                </p>
                                <ul className="text-sm text-[var(--muted)] space-y-2 ml-4">
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        Informações pessoais e de perfil
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        Tokens de acesso e integrações (Meta, Google, etc.)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        Histórico de campanhas e relatórios de IA
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        Configurações do sistema e preferências
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        Dados de concorrentes e análises SWOT
                                    </li>
                                </ul>

                                {!showDeleteConfirm ? (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 mt-4"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        Solicitar Exclusão de Conta
                                    </button>
                                ) : (
                                    <div className="mt-4 space-y-3 animate-in fade-in duration-200">
                                        <p className="text-sm text-red-400 font-semibold">
                                            Digite <span className="font-mono bg-red-500/10 px-2 py-0.5 rounded">EXCLUIR MINHA CONTA</span> para confirmar:
                                        </p>
                                        <input
                                            type="text"
                                            value={deleteConfirmText}
                                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                                            className="w-full md:w-96 bg-[var(--shell-side)] border border-red-500/30 rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all placeholder:text-[var(--muted)]"
                                            placeholder="EXCLUIR MINHA CONTA"
                                        />
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleDeleteAccount}
                                                disabled={deleteConfirmText !== "EXCLUIR MINHA CONTA"}
                                                className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-600/30 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                                Confirmar Exclusão
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowDeleteConfirm(false);
                                                    setDeleteConfirmText("");
                                                }}
                                                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-[var(--shell-border)] text-[var(--foreground)] text-sm font-semibold rounded-xl transition-all"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Sub-Components ──────────────────────────────────────────────────────

function SectionCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div className="bg-[var(--shell-surface)] backdrop-blur-xl border border-[var(--shell-border)] rounded-2xl p-6">
            <div className="mb-5">
                <h3 className="text-base font-bold text-[var(--foreground)]">{title}</h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>
            </div>
            {children}
        </div>
    );
}

function InputField({
    label,
    icon,
    value,
    onChange,
    type = "text",
    placeholder,
}: {
    label: string;
    icon: React.ReactNode;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
}) {
    return (
        <div>
            <label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                {icon}
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all placeholder:text-[var(--muted)]"
            />
        </div>
    );
}

function ConnectedAccount({
    name,
    detail,
    icon,
    color,
    connected,
    onClick,
}: {
    name: string;
    detail: string;
    icon: string;
    color: string;
    connected: boolean;
    onClick?: () => void;
}) {
    return (
        <div className="flex items-center justify-between bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-xl px-4 py-3 group hover:border-white/20 transition-all">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-lg shadow-md`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{name}</p>
                    <p className="text-xs text-[var(--muted)]">{detail}</p>
                </div>
            </div>
            {connected ? (
                <span className="text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full">Conectado</span>
            ) : (
                <button
                    onClick={onClick}
                    className="text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-full transition-colors"
                >
                    Conectar
                </button>
            )}
        </div>
    );
}

function DeletionOption({
    title,
    description,
    buttonLabel,
    buttonColor,
    onClick,
}: {
    title: string;
    description: string;
    buttonLabel: string;
    buttonColor: string;
    onClick: () => void;
}) {
    return (
        <div className="flex items-center justify-between bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-xl px-5 py-4 group hover:border-white/15 transition-all">
            <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>
            </div>
            <button
                onClick={onClick}
                className={`px-5 py-2.5 ${buttonColor} text-white text-xs font-bold rounded-xl transition-all shadow-lg shrink-0`}
            >
                {buttonLabel}
            </button>
        </div>
    );
}
