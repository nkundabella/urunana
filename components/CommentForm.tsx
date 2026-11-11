"use client";

import React, { useState } from "react";
import { createCommentAction } from "@/app/actions/publications";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";

interface CommentFormProps {
  publicationId: string;
  parentId?: string;
  onPosted?: () => void;
  compact?: boolean;
}

export default function CommentForm({
  publicationId,
  parentId,
  onPosted,
  compact = false,
}: CommentFormProps) {
  const [body, setBody] = useState("");
  const [isAltVersion, setIsAltVersion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const minLen = 2;
  const maxLen = 3000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < minLen) {
      setError("Igitabo gikeneye nibura inyuguti 2.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("publicationId", publicationId);
    formData.set("body", body.trim());
    formData.set("isAlternativeVersion", isAltVersion ? "true" : "false");
    if (parentId) formData.set("parentId", parentId);

    try {
      const res = await createCommentAction(formData);
      if (res && "error" in res && res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        // Reset form
        setBody("");
        setIsAltVersion(false);
        setLoading(false);
        if (onPosted) onPosted();
      }
    } catch {
      setError("Habaye ikosa. Ongera ugerageze.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Textarea */}
      <div className="relative">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={compact ? 2 : 3}
          maxLength={maxLen}
          placeholder={
            parentId
              ? "Andika igisubizo cyawe..."
              : "Sangira ibitekerezo byawe ku nkuru..."
          }
          className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 bg-[#fcfcfb] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none transition leading-relaxed"
          disabled={loading}
        />
        <div className="absolute bottom-2 right-3 text-[10px] text-stone-400">
          {body.length}/{maxLen}
        </div>
      </div>

      {/* Alternative version checkbox */}
      {!compact && (
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={isAltVersion}
            onChange={(e) => setIsAltVersion(e.target.checked)}
            className="mt-0.5 rounded border-stone-300 text-emerald-700 focus:ring-emerald-700"
            disabled={loading}
          />
          <span className="text-xs text-stone-600 group-hover:text-stone-900 transition leading-snug">
            Ndimo gusangiza{" "}
            <span className="font-semibold text-emerald-800">
              indi nyito cyangwa uburambe bwanjye
            </span>{" "}
            bw&apos;iyi nkuru (alternative version or personal experience)
          </span>
        </label>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-rose-700 font-medium">{error}</p>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || body.trim().length < minLen}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          {parentId ? "Subiza" : "Ohereza Igitabo"}
        </button>
      </div>
    </form>
  );
}
