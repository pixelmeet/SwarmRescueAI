"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Radio, Shield, Users, BarChart3, LogOut, ShieldAlert } from "lucide-react";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";
import { Button } from "@/components/ui/Button";
import { socketClient, ConnectionStatus as SocketStatus } from "@/lib/socket";
import {
  getAdminToken,
  removeAdminToken,
  getFieldResourceId,
  removeFieldCredentials,
} from "@/lib/api";

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [wsStatus, setWsStatus] = useState<SocketStatus>("disconnected");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Check login states
  const [hasAdminToken, setHasAdminToken] = useState<boolean>(false);
  const [hasFieldCreds, setHasFieldCreds] = useState<boolean>(false);

  useEffect(() => {
    // Check credentials on mount & route change
    setHasAdminToken(!!getAdminToken());
    setHasFieldCreds(!!getFieldResourceId());

    // Connect socket status subscription
    socketClient.connect();
    const unsubStatus = socketClient.onStatusChange((status) => {
      setWsStatus(status);
      if (status === "connected") {
        setLastUpdated(new Date().toLocaleTimeString());
      }
    });

    return () => {
      unsubStatus();
    };
  }, [pathname]);

  const navItems = [
    {
      name: "Command Center",
      href: "/admin",
      icon: Radio,
    },
    {
      name: "Responder Portal",
      href: "/team",
      icon: Users,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
    },
  ];

  const handleLogout = () => {
    if (pathname.startsWith("/team") && hasFieldCreds) {
      removeFieldCredentials();
      setHasFieldCreds(false);
      window.location.reload();
    } else if (hasAdminToken) {
      removeAdminToken();
      setHasAdminToken(false);
      window.location.reload();
    } else {
      removeAdminToken();
      removeFieldCredentials();
      window.location.reload();
    }
  };

  const showLogout =
    (pathname.startsWith("/admin") && hasAdminToken) ||
    (pathname.startsWith("/team") && hasFieldCreds) ||
    hasAdminToken ||
    hasFieldCreds;

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-[var(--border-primary)] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        {/* Brand logo & title */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-red-950/90 border border-red-800 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-sm text-slate-100 tracking-tight leading-none block">
                SwarmRescue<span className="text-primary">AI</span>
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">
                Command Network
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-button text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                    isActive
                      ? "bg-primary text-white shadow-sm shadow-blue-900/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile Navigation Links */}
        <div className="flex md:hidden items-center gap-1 w-full order-3 pt-2 border-t border-slate-800/80">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 py-1.5 px-2 rounded-button text-[11px] font-bold flex items-center justify-center gap-1.5 text-center transition ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>

        {/* Right side items: Connection status & Logout */}
        <div className="flex items-center gap-3">
          <ConnectionStatus status={wsStatus} lastUpdated={lastUpdated} />

          {showLogout && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              icon={<LogOut className="w-3.5 h-3.5 text-red-400" />}
              className="text-xs"
            >
              <span className="hidden sm:inline">Logout</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
