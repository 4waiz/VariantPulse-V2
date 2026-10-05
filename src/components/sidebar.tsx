"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ClipboardList,
  Dna,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  Gauge,
  Globe,
  Home,
  Server,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/", label: "Home", icon: Home },
      { href: "/review", label: "Clinical Review", icon: ClipboardList },
      { href: "/patients", label: "Patients", icon: Users },
      { href: "/variants", label: "Variants", icon: Dna },
      { href: "/evidence", label: "Evidence", icon: FileText },
      { href: "/regional", label: "Regional Insights", icon: Globe },
    ],
  },
  {
    label: "Pilot",
    items: [
      { href: "/pilot", label: "Silent Pilot", icon: FlaskConical },
      { href: "/onboarding", label: "Data Onboarding", icon: FileSpreadsheet },
      { href: "/oversight", label: "Oversight", icon: Gauge },
    ],
  },
  {
    label: "Assurance",
    items: [
      { href: "/activity", label: "Audit Trail", icon: Activity },
      { href: "/governance", label: "Trust & Governance", icon: ShieldCheck },
      { href: "/sources", label: "Data Sources", icon: Server },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-11 items-center gap-3.5 rounded-[14px] px-3.5 text-[14px] font-medium transition-colors short:h-10",
        active ? "vp-nav-active text-accent" : "text-ink-2 hover:bg-surface hover:text-ink",
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          active ? "text-accent" : "text-muted group-hover:text-ink-2",
        )}
        strokeWidth={1.75}
      />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[256px] shrink-0 flex-col border-r border-line/70 bg-surface/70">
      <Link href="/" className="flex items-center gap-3 pb-5 pl-5 pr-4 pt-6 short:pb-4 short:pt-5">
        <Image
          src="/logo.png"
          alt=""
          width={44}
          height={44}
          priority
          className="h-11 w-11 object-contain"
        />
        <span className="min-w-0">
          <span className="block text-[20px] font-bold leading-none tracking-[-0.025em] text-ink">
            VariantPulse
          </span>
          <span className="mt-1.5 block whitespace-nowrap text-[12px] font-medium leading-none text-muted">
            Genomic Change Intelligence
          </span>
        </span>
      </Link>

      <nav className="vp-scroll flex-1 overflow-y-auto px-3.5 pb-4 pt-1" aria-label="Main">
        {GROUPS.map((group, index) => (
          <div key={group.label ?? "workspace"} className={cn(index > 0 && "mt-3 border-t border-line/80 pt-4 short:mt-2 short:pt-3")}>
            {group.label ? (
              <p className="px-3.5 pb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-faint">
                {group.label}
              </p>
            ) : null}
            <ul>
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} active={isActive(pathname, item.href)} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-line/70 px-5 py-3.5 short:py-2.5">
        <Image
          src="/logo.png"
          alt=""
          width={22}
          height={22}
          className="h-[22px] w-[22px] object-contain opacity-80"
        />
        <span className="leading-tight">
          <span className="block text-[12px] text-faint">Built by</span>
          <span className="block text-[12.5px] font-semibold text-ink-2">Team Kanban</span>
        </span>
      </div>
    </aside>
  );
}
