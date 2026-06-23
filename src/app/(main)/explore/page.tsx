"use client"
import { useState, useCallback } from "react"
import { useQueryState } from "nuqs"
import { useRouter } from "next/navigation"
import { PageContainer, SearchBar } from "@/components/common"
import { setModalThumbnail } from "@/components/PostModal/_lib/routing/modalThumbnailHandoff"
import { useExplorePageState } from "./_hooks/useExplorePageState"
import { ExploreGrid } from "./_components/ExploreGrid"

const CATEGORIES = ["전체", "경기", "강원", "충청", "전라", "경상", "제주", "서울"] as const
type Category = (typeof CATEGORIES)[number]

export default function ExplorePage() {
  const router = useRouter()
  const [search, setSearch] = useQueryState("search", { defaultValue: "" })
  const [inputValue, setInputValue] = useState(search)
  const [category, setCategory] = useState<Category>("전체")
  const [isComposing, setIsComposing] = useState(false)

  const { posts, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useExplorePageState(inputValue, category)

  const handleLoadMore = useCallback(() => { fetchNextPage() }, [fetchNextPage])

  return (
    <PageContainer className="flex flex-col gap-(--section-gap)">
      <h1 className="text-section-title font-bold text-text">탐색</h1>

      <SearchBar
        value={inputValue}
        variant="panel"
        placeholder="장소 또는 주소로 검색..."
        onChange={(e) => { if (!isComposing) setInputValue(e.target.value) }}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={(e) => { setIsComposing(false); setInputValue(e.currentTarget.value) }}
        onClear={() => { setInputValue(""); setSearch(null) }}
      />

      <div className="flex items-center gap-(--icon-gap) overflow-x-auto scrollbar-none md:flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            data-testid={`category-btn-${cat}`}
            onClick={() => setCategory(cat)}
            className={[
              "shrink-0 px-3 py-1.5 md:px-5 md:py-2.5 rounded-(--chip-radius) text-caption md:text-body-sm font-semibold transition-colors border",
              category === cat
                ? "bg-(--chip-bg-selected) text-(--chip-text-selected) border-transparent"
                : "bg-(--chip-bg) text-(--chip-text) border-(--chip-border) hover:bg-bg-subtle",
            ].join(" ")}
          >
            {cat}
          </button>
        ))}
      </div>

      <ExploreGrid
        posts={posts}
        isLoading={isLoading}
        hasNextPage={!!hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={handleLoadMore}
        onPostClick={(id) => {
          const post = posts.find((p) => p.post_id === id)
          if (post?.thumbnail) setModalThumbnail(id, post.thumbnail)
          router.push(`/posts/${id}`)
        }}
      />
    </PageContainer>
  )
}
