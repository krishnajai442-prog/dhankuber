"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PartyPopper, Gamepad2, Megaphone, Ticket, Code2, MessageCircle,
  CheckCircle2, User, Mail, Phone, Clock,
} from "lucide-react";
import { clsx } from "clsx";
import { LANGUAGES, T, LangCode, OptionKey } from "@/lib/contact-i18n";

type Step = "lang" | "options" | "form" | "done";
type OptionType = "tips" | "agent" | "advertise" | "listing" | "build" | "suggest";

const OPTIONS: Array<{ type: OptionType; key: OptionKey; icon: typeof User; color: string }> = [
  { type: "tips", key: "tips", icon: PartyPopper, color: "text-yellow-500" },
  { type: "agent", key: "agent", icon: Gamepad2, color: "text-sky-500" },
  { type: "advertise", key: "adv", icon: Megaphone, color: "text-amber-500" },
  { type: "listing", key: "list", icon: Ticket, color: "text-red-500" },
  { type: "build", key: "build", icon: Code2, color: "text-purple-600" },
  { type: "suggest", key: "sug", icon: MessageCircle, color: "text-green-600" },
];

const inputCls = (err?: string) =>
  clsx(
    "w-full rounded-md border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400",
    "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
    err ? "border-red-400" : "border-gray-300"
  );

function LabelRow({ icon: Icon, label, required }: { icon: typeof User; label: string; required?: boolean }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Icon className="h-4 w-4 text-blue-600" aria-hidden="true" />
      <span className="text-sm font-semibold text-gray-800">{label}</span>
      {required && <span className="text-sm text-[#f0435f]">*</span>}
    </div>
  );
}

export default function ContactFormPage() {
  const [step, setStep] = useState<Step>("lang");
  const [lang, setLang] = useState<LangCode>("en");
  const [type, setType] = useState<OptionType | null>(null);
  const [picked, setPicked] = useState<OptionType | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", gameName: "", resultTime: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const t = T[lang];
  const rtl = lang === "ur";
  const isListing = type === "listing";

  const chooseOption = (ot: OptionType) => {
    if (picked) return;
    setPicked(ot);
    setTimeout(() => {
      setType(ot);
      setPicked(null);
      setStep("form");
    }, 350);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "required";
    if (!form.phone.trim()) errs.phone = "required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "invalid";
    if (isListing) {
      if (!form.gameName.trim()) errs.gameName = "required";
      if (!form.resultTime) errs.resultTime = "required";
    } else if (!form.message.trim()) errs.message = "required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    try {
      await fetch("/api/help-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, lang, ...form }),
      });
      setStep("done");
    } catch {
      setStep("done");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef0f2] px-4 py-10" dir={rtl ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-[640px] rounded-xl bg-[#f8f9fa] p-6 shadow-sm sm:p-10">

        {/* STEP 1 — SELECT LANGUAGE */}
        {step === "lang" && (
          <>
            <h1 className="mb-8 text-center text-3xl font-bold text-gray-900 sm:text-4xl">Select Language</h1>
            <div className="grid grid-cols-2 gap-4">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => { setLang(l.code); setStep("options"); }}
                  className="rounded-md border border-blue-500 bg-white px-4 py-4 text-center font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP 2 — HELP OPTIONS */}
        {step === "options" && (
          <>
            <h1 className="mb-8 text-center text-3xl font-bold text-gray-900 sm:text-4xl">{t.helpTitle}</h1>
            <div className="space-y-5">
              {OPTIONS.map((o) => {
                const Icon = o.icon;
                const isPicked = picked === o.type;
                return (
                  <button
                    key={o.type}
                    type="button"
                    onClick={() => chooseOption(o.type)}
                    className={clsx(
                      "w-full rounded-lg border bg-white p-5 text-left transition-colors",
                      isPicked ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500" : "border-gray-300 hover:border-blue-400"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Icon className={clsx("h-6 w-6 flex-shrink-0", o.color)} aria-hidden="true" />
                        <span className="font-bold text-gray-900">{t.options[o.key].title}</span>
                      </div>
                      {isPicked ? (
                        <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-blue-600" fill="currentColor" stroke="white" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-gray-300" aria-hidden="true" />
                      )}
                    </div>
                    <div className="mt-3 border-t border-gray-200 pt-3 text-sm leading-relaxed text-gray-500">
                      {t.options[o.key].desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* STEP 3 — FORM */}
        {step === "form" && type && (
          <>
            <h1 className="mb-8 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
              {isListing ? t.listingTitle : t.contactTitle}
            </h1>
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div>
                <LabelRow icon={User} label={t.lblName} required />
                <input className={inputCls(errors.name)} placeholder={t.phName} value={form.name} onChange={set("name")} />
              </div>
              <div>
                <LabelRow icon={Mail} label={t.lblEmail} />
                <input type="email" className={inputCls(errors.email)} placeholder={t.phEmail} value={form.email} onChange={set("email")} />
              </div>
              <div>
                <LabelRow icon={Phone} label={t.lblPhone} required />
                <input className={inputCls(errors.phone)} placeholder={t.phPhone} value={form.phone} onChange={set("phone")} />
              </div>
              {isListing && (
                <>
                  <div>
                    <LabelRow icon={Gamepad2} label={t.lblGame} required />
                    <input className={inputCls(errors.gameName)} placeholder={t.phGame} value={form.gameName} onChange={set("gameName")} />
                  </div>
                  <div>
                    <LabelRow icon={Clock} label={t.lblTime} required />
                    <input type="time" className={inputCls(errors.resultTime)} value={form.resultTime} onChange={set("resultTime")} />
                  </div>
                </>
              )}
              <div>
                <LabelRow icon={MessageCircle} label={t.lblMessage} required={!isListing} />
                <textarea rows={5} maxLength={280} className={clsx(inputCls(errors.message), "resize-y")} placeholder={t.phMessage} value={form.message} onChange={set("message")} />
                <p className="mt-1 text-end text-xs text-gray-500">{form.message.length} / 280</p>
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-md bg-[#1d74e8] py-3.5 font-bold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {sending ? "..." : isListing ? t.btnSubmit : t.btnSend}
              </button>
            </form>
          </>
        )}

        {/* STEP 4 — SUCCESS */}
        {step === "done" && (
          <div className="py-10 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-600" aria-hidden="true" />
            <p className="text-lg font-semibold text-gray-900">{t.success}</p>
            <Link href="/" className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline">
              ← onlinekhiwal.com
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}