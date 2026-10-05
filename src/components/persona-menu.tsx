"use client";

/**
 * Who is signed in, and, for this demonstration, who else to sign in as. Each
 * identity carries one role, so the review workflow's separation of duties
 * can be shown end to end. A pilot replaces this with the facility's identity
 * provider and MFA; nothing else in the workflow changes.
 */

import * as React from "react";
import Link from "next/link";
import { Check, ChevronDown, ShieldCheck } from "lucide-react";

import { PERSONAS } from "@/data/workspace";
import { ROLES } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/state/workspace";

export function PersonaMenu() {
  const { persona, switchPersona } = useWorkspace();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={menuId}
        title={`${persona.name} · ${ROLES[persona.role].label}`}
        className="flex h-11 items-center gap-2.5 rounded-2xl py-1 pl-1 pr-1 transition-colors hover:bg-surface/70 sm:pr-2"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-oxblood text-[13px] font-semibold text-white shadow-[0_4px_12px_-6px_rgba(72,26,39,0.6)]">
          {persona.initials}
        </span>
        <span className="hidden min-w-0 text-left leading-tight sm:block">
          <span className="block max-w-[150px] truncate text-[13.5px] font-semibold text-ink">{persona.name}</span>
          <span className="mt-0.5 block max-w-[150px] truncate text-[12px] text-muted">{ROLES[persona.role].label}</span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn("hidden h-4 w-4 shrink-0 text-muted transition-transform sm:block", open && "rotate-180")}
        />
        <span className="sr-only">, switch identity</span>
      </button>

      {open ? (
        <div
          id={menuId}
          className="vp-rise absolute right-0 top-12 z-40 w-[330px] overflow-hidden rounded-2xl border border-line-2 bg-surface shadow-[0_22px_60px_-24px_rgba(var(--vp-shadow-rgb),0.36)]"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="text-[13px] font-semibold text-ink">Signed in as</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
              Demonstration identities, one role each. In a pilot, sign-in and MFA come from the
              facility&rsquo;s identity provider.
            </p>
          </div>
          <ul className="py-1">
            {PERSONAS.map((option) => {
              const active = option.id === persona.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => {
                      switchPersona(option.id);
                      setOpen(false);
                    }}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors",
                      active ? "bg-selected-bg" : "hover:bg-surface-2",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold",
                        active ? "bg-oxblood text-white" : "bg-surface-3 text-ink-2",
                      )}
                    >
                      {option.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                        {option.name}
                        {active ? <Check className="h-3.5 w-3.5 text-garnet" aria-hidden /> : null}
                      </span>
                      <span className="block text-[12px] font-medium text-garnet">{ROLES[option.role].label}</span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                        {ROLES[option.role].description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Link
            href="/governance"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-[12.5px] font-medium text-accent hover:bg-surface-2"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            How access is controlled
          </Link>
        </div>
      ) : null}
    </div>
  );
}
