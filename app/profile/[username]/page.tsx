import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PublicationStatus } from "@/generated/prisma/client";
import PublicationCard from "@/components/PublicationCard";
import FollowButton from "@/components/FollowButton";
import {
  Award,
  Calendar,
  Settings,
  BookOpen,
  Feather,
  Sparkles,
  Users,
} from "lucide-react";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  const [targetUser, currentUser] = await Promise.all([
    prisma.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
        publications: {
          where: { status: PublicationStatus.PUBLISHED },
          include: {
            author: {
              select: {
                username: true,
                displayName: true,
                isFoundingContributor: true,
              },
            },
            categories: {
              include: {
                category: {
                  select: {
                    id: true,
                    nameRw: true,
                    nameEn: true,
                    isHealthOrMedicine: true,
                  },
                },
              },
            },
            _count: {
              select: {
                comments: true,
              },
            },
          },
          orderBy: { publishedAt: "desc" },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!targetUser) notFound();

  const isSelf = currentUser?.id === targetUser.id;

  // Check if current user is following target user
  let isFollowing = false;
  if (currentUser && !isSelf) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUser.id,
        },
      },
    });
    isFollowing = Boolean(follow);
  }

  // Count drafts for self view
  let draftCount = 0;
  if (isSelf) {
    draftCount = await prisma.publication.count({
      where: {
        authorId: currentUser.id,
        status: PublicationStatus.DRAFT,
      },
    });
  }

  // Fetch readable category names for areas of interest
  const interestCategories =
    targetUser.areasOfInterest.length > 0
      ? await prisma.topicCategory.findMany({
          where: {
            id: { in: targetUser.areasOfInterest },
          },
          select: { id: true, nameRw: true, slug: true },
        })
      : [];

  const initial = targetUser.displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Profile Header Card */}
      <section className="p-6 sm:p-8 bg-white border border-stone-200/90 rounded-3xl shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          {/* Avatar + Identity */}
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-800 text-white font-serif text-2xl sm:text-3xl font-bold flex items-center justify-center shrink-0 shadow-xs border-2 border-emerald-900/20">
              {initial}
            </div>

            <div className="space-y-1">
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                  {targetUser.displayName}
                </h1>
                {targetUser.isFoundingContributor && (
                  <span
                    className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] uppercase tracking-wider"
                    title="Umunyamuryango w'Intangiriro (Founding Contributor)"
                  >
                    <Award className="w-3 h-3 text-amber-700" />
                    <span>Intangiriro</span>
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-stone-500 font-mono">
                @{targetUser.username}
              </p>

              {/* Quiet follower stats */}
              <div className="flex items-center space-x-4 text-xs text-stone-600 pt-1">
                <span>
                  <strong className="font-semibold text-stone-900">
                    {targetUser._count.following}
                  </strong>{" "}
                  abo akurikira
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1 text-stone-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Yinjiye muri{" "}
                    {new Date(targetUser.createdAt).toLocaleDateString("rw-RW", {
                      year: "numeric",
                      month: "long",
                    })}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Action (Edit Profile vs Follow Button) */}
          <div className="shrink-0 flex items-center space-x-3">
            {isSelf ? (
              <Link
                href="/settings"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Hindura Umwirondoro</span>
              </Link>
            ) : (
              <FollowButton
                targetUserId={targetUser.id}
                initialFollowing={isFollowing}
                initialFollowerCount={targetUser._count.followers}
              />
            )}
          </div>
        </div>

        {/* Bio */}
        {targetUser.bio && (
          <p className="font-serif text-sm sm:text-base text-stone-700 leading-relaxed max-w-2xl border-t border-stone-100 pt-4">
            {targetUser.bio}
          </p>
        )}

        {/* Areas of Interest Chips */}
        {interestCategories.length > 0 && (
          <div className="pt-2 border-t border-stone-100 space-y-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
              Ibimushishikaza (Areas of Interest)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {interestCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/discover?category=${cat.slug}`}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 text-stone-700 text-xs font-medium transition"
                >
                  #{cat.nameRw}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Publications Section Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-emerald-800" />
          <h2 className="font-serif text-xl font-bold text-stone-900">
            Inkuru Z&apos;Umwanditsi ({targetUser.publications.length})
          </h2>
        </div>

        {isSelf && draftCount > 0 && (
          <Link
            href="/publish"
            className="text-xs text-amber-800 hover:underline font-medium"
          >
            Ufite ibitabo {draftCount} byiteganyijwe (Drafts) →
          </Link>
        )}
      </div>

      {/* Publications List */}
      {targetUser.publications.length > 0 ? (
        <div className="space-y-4">
          {targetUser.publications.map((pub) => (
            <PublicationCard key={pub.id} publication={pub} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-stone-200/80 rounded-2xl space-y-3">
          <Feather className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-sm font-serif text-stone-600 italic">
            Uyu mwanditsi ntaratangaza inkuru mu ruhame.
          </p>
        </div>
      )}
    </div>
  );
}

