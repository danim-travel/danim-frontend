'use client'

import { useState, useRef, useEffect } from 'react'
import type { CreatePostSpotLocation } from '@/types'
import { SearchBar } from '@/components/common'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import { useKakaoMapSDK } from '../_hooks/useKakaoMapSDK'
import { LOCATION_SEARCH_DEBOUNCE_MS, MAX_LOCATION_SEARCH_RESULTS } from '../_constants'

interface Props {
  value: CreatePostSpotLocation[]
  onChange: (places: CreatePostSpotLocation[]) => void
  singleMode?: boolean
}

export default function LocationSearch({ value, onChange, singleMode = false }: Props) {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<kakao.maps.services.PlaceItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const placesRef = useRef<kakao.maps.services.Places | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const sdkReady = useKakaoMapSDK()
  const debouncedInput = useDebouncedValue(input, LOCATION_SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    if (sdkReady) {
      // SDK 준비 후 Places 인스턴스 생성 — ref에 저장해 리렌더마다 재생성 방지
      placesRef.current = new kakao.maps.services.Places()
    }
  }, [sdkReady])

  // 드롭다운 외부 클릭 시 닫기
  useOnClickOutside(containerRef, () => setIsOpen(false))

  useEffect(() => {
    const keyword = debouncedInput.trim()
    if (!sdkReady || !placesRef.current || !keyword) {
      setResults([])
      setIsOpen(false)
      return
    }
    placesRef.current.keywordSearch(keyword, (result, status) => {
      if (status === 'OK') {
        setResults(result.slice(0, MAX_LOCATION_SEARCH_RESULTS))
        setIsOpen(true)
      } else {
        setResults([])
        setIsOpen(false)
      }
    })
  }, [debouncedInput, sdkReady])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // isComposing: 한글 IME 조합 중엔 keydown이 중복 발화하므로 무시
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Escape') setIsOpen(false)
  }

  const handleSelect = (place: kakao.maps.services.PlaceItem) => {
    const newPlace: CreatePostSpotLocation = {
      place_name: place.place_name,
      address_name: place.address_name,
      road_address_name: place.road_address_name || place.address_name,
      x: place.x,
      y: place.y,
    }
    onChange(singleMode ? [newPlace] : [...value, newPlace])
    setInput('')
    setResults([])
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <SearchBar
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder="목적지 검색 (예: 광안리 해수욕장, 성산일출봉)"
        disabled={!sdkReady}
        onClear={() => {
          setInput('')
          setResults([])
          setIsOpen(false)
        }}
        variant="panel"
      />

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card rounded-xl border border-border shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
          {results.map((place) => (
            <button
              key={place.id}
              // mousedown 기본 동작 막기 — 그냥 두면 input blur → isOpen false 순으로 처리되어 click 이벤트가 사라짐
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(place)}
              className="w-full text-left px-4 py-3 hover:bg-primary/10 border-b border-border-subtle last:border-none transition-colors"
            >
              <p className="text-base font-medium text-text-emphasis">{place.place_name}</p>
              <p className="text-caption text-text-disabled mt-0.5">{place.road_address_name || place.address_name}</p>
              {place.category_group_name && (
                <span className="inline-block text-tiny px-1.5 py-0.5 rounded bg-bg text-text-muted mt-1">
                  {place.category_group_name}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

    </div>
  )
}
