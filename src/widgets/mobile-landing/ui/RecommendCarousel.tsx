"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";

import { COPY } from "@/shared/config";

import { CAROUSEL, nearestIndex, nextIndex, RECOMMEND_CAROUSEL_CARDS } from "../model/carousel";

const { recommend } = COPY.phoneScreens;
/** 사진 영역 좌표의 기준 상자(px, `RECOMMEND_SCREEN.photoCrops`) */
const CROP_BOX = 117;

const pct = (value: number) => `${(value / CROP_BOX) * 100}%`;

type CarouselCard = (typeof RECOMMEND_CAROUSEL_CARDS)[number];

interface StyleCardProps {
  card: CarouselCard;
}

/** 추천 스타일 카드 — 큰 사진 + 순위·이력 기반 태그 + 스타일 이름 + 근거 · 참고 기록 + AR로 체험 */
const StyleCard = ({ card }: StyleCardProps) => (
  <article className="flex h-full flex-col rounded-[24px] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
    <div className="relative aspect-square overflow-hidden rounded-[16px] bg-[#F4F4F5]">
      <div
        className="absolute"
        style={{
          left: pct(card.crop.left),
          top: pct(card.crop.top),
          width: pct(card.crop.size),
          height: pct(card.crop.size),
        }}
      >
        <Image
          src="/screens/recommend/photo.webp"
          alt={card.style}
          fill
          sizes="70vw"
          className="object-cover"
        />
      </div>
    </div>
    <div className="text-12 mt-4 flex items-center gap-1.5 font-medium">
      <span className="rounded-[5px] border border-[#E6E6E7] bg-[#F5F5F5] px-2 py-0.5 text-[#5A5C5D]">
        {card.rank}
      </span>
      <span className="rounded-[5px] bg-[#41BE8E] px-2 py-0.5 text-[#F5F5F5]">{recommend.basisTag}</span>
    </div>
    <p className="text-20 mt-2 font-bold text-[#1C1E20]">{card.style}</p>
    <div className="text-12 mt-2 flex flex-col gap-0.5 text-[#76787A]">
      <span>{card.reason}</span>
      <span>{card.reference}</span>
    </div>
    <span className="text-12 mt-4 rounded-full bg-[#F2F3F5] py-2 text-center font-medium text-[#5A5C5D]">
      {recommend.arCta}
    </span>
  </article>
);

/**
 * 추천 결과 Top 3 카드 캐러셀(이슈 #52, 토스 상품 카드 참고). 카드가 한 장씩 자동으로 넘어가고(마지막 다음엔 처음),
 * 손가락으로도 넘긴다(스크롤 스냅). 만지면 잠시 쉬고, 화면 밖이거나 동작 줄이기면 자동으로 넘기지 않는다.
 */
export const RecommendCarousel = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let isVisible = false;
    let pausedUntil = 0;

    const cardCenters = () =>
      cardRefs.current.map((card) => (card ? card.offsetLeft + card.offsetWidth / 2 : 0));
    const currentIndex = () => nearestIndex(track.scrollLeft + track.clientWidth / 2, cardCenters());
    const scrollToCard = (index: number) => {
      const card = cardRefs.current[index];
      if (!card) return;
      track.scrollTo({
        left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2,
        behavior: "smooth",
      });
    };

    const handleScroll = () => setActiveIndex(currentIndex());
    const handleTouch = () => {
      pausedUntil = Date.now() + CAROUSEL.pauseAfterTouchMs;
    };
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = Boolean(entry?.isIntersecting);
    });
    observer.observe(track);

    const timerId = window.setInterval(() => {
      if (isReducedMotion || !isVisible || Date.now() < pausedUntil) return;
      scrollToCard(nextIndex(currentIndex(), RECOMMEND_CAROUSEL_CARDS.length));
    }, CAROUSEL.intervalMs);

    track.addEventListener("scroll", handleScroll, { passive: true });
    track.addEventListener("pointerdown", handleTouch);
    track.addEventListener("touchstart", handleTouch, { passive: true });
    return () => {
      window.clearInterval(timerId);
      observer.disconnect();
      track.removeEventListener("scroll", handleScroll);
      track.removeEventListener("pointerdown", handleTouch);
      track.removeEventListener("touchstart", handleTouch);
    };
  }, []);

  return (
    <div className="-mx-5 bg-[#F4F4F5] py-8">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-[15vw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {RECOMMEND_CAROUSEL_CARDS.map((card, index) => (
          <div
            key={card.rank}
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
            className="w-[70vw] max-w-[360px] shrink-0 snap-center"
          >
            <StyleCard card={card} />
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-center gap-1.5" aria-hidden="true">
        {RECOMMEND_CAROUSEL_CARDS.map((card, index) => (
          <span
            key={card.rank}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === activeIndex ? "w-5 bg-[#41BE8E]" : "w-1.5 bg-[#D4D5D7]"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
