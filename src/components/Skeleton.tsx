import React from 'react';

// ── Base shimmer skeleton block ──
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-2xl ${className}`} />
  );
}

// ── Product Detail Page Skeleton ──
export function ProductDetailSkeleton() {
  return (
    <div className="min-h-dvh bg-white pb-40">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>

      {/* Product Image */}
      <Skeleton className="mx-4 mt-2 h-64 rounded-2xl" />

      <div className="px-4 mt-4 space-y-4">
        {/* Brand + Name + Price */}
        <div>
          <Skeleton className="h-3 w-20 rounded-lg" />
          <Skeleton className="h-6 w-48 mt-2 rounded-lg" />
          <Skeleton className="h-8 w-24 mt-2 rounded-lg" />
        </div>

        {/* Meta badges */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>

        {/* Store card */}
        <Skeleton className="h-16 rounded-2xl" />

        {/* Compare banner */}
        <Skeleton className="h-16 rounded-2xl" />

        {/* Description */}
        <div>
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="h-3 w-full mt-2 rounded-lg" />
          <Skeleton className="h-3 w-3/4 mt-1 rounded-lg" />
          <Skeleton className="h-3 w-5/6 mt-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Store Detail Page Skeleton ──
export function StoreDetailSkeleton() {
  return (
    <div className="min-h-dvh bg-white">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-50">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-4 w-36 rounded-lg" />
      </div>

      {/* Banner */}
      <Skeleton className="h-36 w-full rounded-none" />

      {/* Store Card */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-card p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton className="w-14 h-14 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-3 w-56 rounded-lg" />
              <div className="flex gap-3">
                <Skeleton className="h-3 w-16 rounded-lg" />
                <Skeleton className="h-3 w-16 rounded-lg" />
                <Skeleton className="h-3 w-16 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="flex-1 h-10 rounded-xl" />
            <Skeleton className="flex-1 h-10 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="px-4 mt-6 space-y-3">
        <Skeleton className="h-5 w-36 rounded-lg" />
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

// ── Orders List Skeleton ──
export function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20 rounded-lg" />
              <Skeleton className="h-4 w-32 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full rounded-lg" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16 rounded-lg" />
            <Skeleton className="h-3 w-28 rounded-lg" />
          </div>
          {/* Progress steps */}
          <div className="flex items-center gap-0">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="flex-1 h-0.5 rounded-full" />
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="flex-1 h-0.5 rounded-full" />
            <Skeleton className="w-5 h-5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Order Tracking Page Skeleton ──
export function OrderTrackingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="p-2">
        <div className="bg-white rounded-2xl flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-28 rounded-lg" />
              <Skeleton className="h-2 w-16 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <Skeleton className="w-16 h-9 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* Visual section */}
        <div className="bg-white rounded-3xl p-6 flex flex-col items-center space-y-6">
          <Skeleton className="w-40 h-40 rounded-full" />
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-3 w-56 rounded-lg" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-3 w-full rounded-full" />
        </div>

        {/* Timeline card */}
        <div className="bg-white rounded-3xl p-6 space-y-6">
          <Skeleton className="h-5 w-28 rounded-lg" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32 rounded-lg" />
                <Skeleton className="h-3 w-40 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Bill card */}
        <div className="bg-white rounded-3xl p-6 space-y-4">
          <Skeleton className="h-5 w-24 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <div className="border-t border-gray-100 pt-4">
            <Skeleton className="h-6 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Wishlist Skeleton ──
export function WishlistSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
  );
}

// ── Notifications Skeleton ──
export function NotificationsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="bg-white rounded-2xl p-4 flex gap-3">
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40 rounded-lg" />
            <Skeleton className="h-3 w-full rounded-lg" />
            <Skeleton className="h-3 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Compare Page Skeleton ──
export function CompareSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-3 w-16 rounded-lg" />
            </div>
          </div>
          {[1, 2].map(j => (
            <div key={j} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28 rounded-lg" />
                <div className="flex gap-3">
                  <Skeleton className="h-3 w-14 rounded-lg" />
                  <Skeleton className="h-3 w-14 rounded-lg" />
                </div>
              </div>
              <Skeleton className="h-6 w-12 rounded-lg" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Search Results Skeleton ──
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
  );
}

// ── Home Page Skeleton ──
export function HomePageSkeleton() {
  return (
    <div className="min-h-dvh bg-white pb-nav">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-br from-orange-400 to-orange-500 px-4 pt-5 pb-6 rounded-b-[1.5rem] relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20 bg-white/30" />
            <Skeleton className="h-5 w-32 bg-white/40" />
          </div>
          <Skeleton className="w-9 h-9 rounded-xl bg-white/30" />
        </div>
        <Skeleton className="h-3 w-40 mb-3 bg-white/30" />
        <Skeleton className="h-12 w-full bg-white rounded-2xl" />
      </div>

      <div className="px-4 mt-5 space-y-6">
        {/* Categories Skeleton */}
        <div>
          <Skeleton className="h-5 w-36 mb-3" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                <Skeleton className="w-16 h-16 rounded-2xl" />
                <Skeleton className="h-2 w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* AI Suggestion Box Skeleton */}
        <div className="bg-orange-50 rounded-2xl p-4 space-y-3">
          <Skeleton className="h-5 w-48" />
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-8 w-32 rounded-xl" />
            <Skeleton className="h-8 w-24 rounded-xl" />
            <Skeleton className="h-8 w-36 rounded-xl" />
          </div>
        </div>

        {/* Product Sections Skeleton */}
        {[1, 2, 3].map(section => (
          <div key={section}>
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3].map(card => (
                <div key={card} className="w-[160px] h-56 rounded-2xl bg-gray-100 p-3 flex-shrink-0 flex flex-col">
                  <Skeleton className="w-full h-24 rounded-xl mb-2" />
                  <Skeleton className="h-2 w-16 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-5 w-16 mt-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
