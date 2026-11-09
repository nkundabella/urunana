"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import {
  Feather,
  BookMarked,
  Compass,
  PenLine,
  User,
  LogOut,
  Shield,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

interface NavbarProps {
  currentUser?: {
    id: string;
    username: string;
    displayName: string;
    role: string;
    isModerator: boolean;
    isFoundingContributor: boolean;
    preferredLanguage: string;
  } | null;
}

export default function Navbar({ currentUser }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Ahabanza", icon: Feather },
    { href: "/discover", label: "Gushakisha", icon: Compass },
    { href: "/saved", label: "Ibyo Nabitse", icon: BookMarked },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-[#fbfbf9]/95 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center text-amber-300 shadow-xs group-hover:scale-105 transition">
                <Feather className="w-4 h-4" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 block leading-none">
                  Urunana
                </span>
                <span className="text-[10px] uppercase font-sans tracking-widest text-emerald-900 font-semibold block mt-0.5">
                  Umuco n&apos;Ururimi
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1 pl-4 border-l border-stone-200">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? "bg-stone-200/70 text-emerald-950 font-semibold"
                        : "text-stone-600 hover:text-stone-950 hover:bg-stone-100"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Action Section */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Write Story CTA */}
            <Link
              href="/publish"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 transition shadow-2xs"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Kwandika Inkuru</span>
            </Link>

            {/* Language Pill indicator */}
            <div className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
              🇷🇼 RW
            </div>

            {/* Auth Buttons / User Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-stone-100 transition border border-transparent hover:border-stone-200"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-serif font-bold text-xs flex items-center justify-center">
                    {currentUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-stone-800 max-w-[120px] truncate">
                    {currentUser.displayName}
                  </span>
                  {currentUser.isFoundingContributor && (
                    <span title="Founding Contributor" className="text-amber-500">
                      <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 text-xs text-stone-700 divide-y divide-stone-100">
                    <div className="px-3.5 py-2">
                      <div className="font-semibold text-stone-900 truncate">
                        {currentUser.displayName}
                      </div>
                      <div className="text-[11px] text-stone-500">@{currentUser.username}</div>
                    </div>

                    <div className="py-1">
                      <Link
                        href={`/profile/${currentUser.username}`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-3.5 py-1.5 hover:bg-stone-50"
                      >
                        <User className="w-3.5 h-3.5 text-stone-500" />
                        <span>Umwirondoro</span>
                      </Link>
                      <Link
                        href="/saved"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-3.5 py-1.5 hover:bg-stone-50"
                      >
                        <BookMarked className="w-3.5 h-3.5 text-stone-500" />
                        <span>Ibyo Nabitse</span>
                      </Link>
                      {(currentUser.role === "ADMIN" || currentUser.isModerator) && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center space-x-2 px-3.5 py-1.5 hover:bg-emerald-50 text-emerald-900 font-semibold"
                        >
                          <Shield className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Ubuyobozi (Admin)</span>
                        </Link>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={async () => {
                          setUserMenuOpen(false);
                          await logoutAction();
                        }}
                        className="w-full flex items-center space-x-2 px-3.5 py-1.5 text-red-700 hover:bg-red-50 text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Gusohoka</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:text-stone-950 transition"
                >
                  Kwinjira
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 shadow-2xs transition"
                >
                  Kwiyandikisha
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-600 hover:bg-stone-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-[#fbfbf9] px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? "bg-stone-200/70 text-emerald-950 font-semibold"
                      : "text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <Link
              href="/publish"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200"
            >
              <PenLine className="w-4 h-4" />
              <span>Kwandika Inkuru</span>
            </Link>
          </div>

          <div className="pt-3 border-t border-stone-200">
            {currentUser ? (
              <div className="space-y-2">
                <div className="px-3 text-xs text-stone-500">
                  Uheruka kwinjira nka <span className="font-semibold text-stone-900">{currentUser.displayName}</span>
                </div>
                {(currentUser.role === "ADMIN" || currentUser.isModerator) && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold text-emerald-900 bg-emerald-50"
                  >
                    <Shield className="w-4 h-4 text-emerald-700" />
                    <span>Ubuyobozi (Admin Dashboard)</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logoutAction();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-red-700 hover:bg-red-50 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Gusohoka</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg text-xs font-semibold text-stone-800 border border-stone-300 bg-white"
                >
                  Kwinjira
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg text-xs font-semibold text-white bg-emerald-800"
                >
                  Kwiyandikisha
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

