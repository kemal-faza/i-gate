import type { Metadata } from "next";
import Image from "next/image";
import {
  DraggableCardBody,
  DraggableCardContainer,
} from "@/components/ui/draggable-card";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Tentang I-GATE",
  description: `${SITE_DESCRIPTION} Kenali cerita di balik panggung, tim, dan tradisi Informatika.`,
  openGraph: {
    title: `Tentang | ${SITE_NAME}`,
    description: `${SITE_DESCRIPTION} Kenali cerita di balik panggung, tim, dan tradisi Informatika.`,
    images: [OG_IMAGE],
  },
  twitter: {
    title: `Tentang | ${SITE_NAME}`,
    description: `${SITE_DESCRIPTION} Kenali cerita di balik panggung, tim, dan tradisi Informatika.`,
    images: [OG_IMAGE],
  },
};

export default function DraggableCardDemo() {
  const items = [
    {
      title: "#IGATE2025",
      image: "/image-1.png",
      className: "absolute top-10 left-[20%] rotate-[-5deg]",
    },
    {
      title: "#InformaticsGathering",
      image: "/image-2.png",
      className: "absolute top-40 left-[25%] rotate-[-7deg]",
    },
    {
      title: "#InformaticsFamily",
      image: "/image-3.png",
      className: "absolute top-5 left-[40%] rotate-[8deg]",
    },
    {
      title: "#CelebrateInformatics",
      image: "/image-4.png",
      className: "absolute top-32 left-[55%] rotate-[10deg]",
    },
    {
      title: "#TogetherInInformatics",
      image: "/image-5.png",
      className: "absolute top-20 right-[35%] rotate-[2deg]",
    },
    {
      title: "#InformaticsGathering",
      image: "/image-6.png",
      className: "absolute top-24 left-[45%] rotate-[-7deg]",
    },
    {
      title: "#InformaticsFamily",
      image: "/image-7.png",
      className: "absolute top-8 left-[30%] rotate-[4deg]",
    },
  ];
  return (
    <DraggableCardContainer className="relative flex min-h-screen w-full items-center justify-center overflow-clip">
      <p className="absolute top-1/2 mx-auto max-w-md -translate-y-3/4 text-center text-2xl font-black text-neutral-400 md:text-4xl dark:text-neutral-800">
        I GATE: Shine, Unite, Celebrate! o(*^＠^*)o
      </p>
      {items.map((item) => (
        <DraggableCardBody className={item.className} key={item.title}>
          <Image
            src={item.image}
            alt={item.title}
            width={320}
            height={320}
            className="pointer-events-none relative z-10 h-80 w-80 object-cover"
          />
          <h3 className="mt-4 text-center text-2xl font-bold text-neutral-700 dark:text-neutral-300">
            {item.title}
          </h3>
        </DraggableCardBody>
      ))}
    </DraggableCardContainer>
  );
}
