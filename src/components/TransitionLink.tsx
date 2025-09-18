"use client";
import { useTransitionRouter } from "next-view-transitions";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

type TransitionLinkProps = {
  funcBeforeTransition?: () => void;
  funcAfterTransition?: () => void;
  animationType?: "slideInOut" | "loadingTopBar";
} & LinkProps &
  AnchorProps;

const TransitionLink = ({
  funcBeforeTransition,
  funcAfterTransition,
  href,
  children,
  animationType = "slideInOut",
  ...props
}: TransitionLinkProps) => {
  const router = useTransitionRouter();
  const pathname = usePathname();

  const animationHandler =
    animationType === "slideInOut"
      ? slideInOut
      : animationType === "loadingTopBar"
      ? loadingTopBar
      : () => {};

  return (
    <Link
      href={href}
      onClick={(e) => {
        if (funcBeforeTransition) funcBeforeTransition();
        e.preventDefault();
        if (href === pathname) return;
        router.push(href, {
          onTransitionReady: animationHandler,
        });
        if (funcAfterTransition) funcAfterTransition();
      }}
      {...props}
    >
      {children}
    </Link>
  );
};

const slideInOut = () => {
  document.documentElement.classList.add("enable-view-transition");

  const oldAnim = document.documentElement.animate(
    [
      { opacity: 1, transform: "translateY(0)" },
      { opacity: 0.2, transform: "translateY(-35%)" },
    ],
    {
      duration: 1000,
      easing: "cubic-bezier(0.87, 0, 0.13, 1)",
      fill: "forwards",
      pseudoElement: "::view-transition-old(root)",
    }
  );

  const newAnim = document.documentElement.animate(
    [
      {
        clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
      },
      {
        clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)",
      },
    ],
    {
      duration: 1000,
      easing: "cubic-bezier(0.87, 0, 0.13, 1)",
      fill: "forwards",
      pseudoElement: "::view-transition-new(root)",
    }
  );

  // Wait for both animations + give browser time to flush rendering
  Promise.allSettled([oldAnim.finished, newAnim.finished]).then(() => {
    // Add a rendering safety buffer (at least 1-2 frames)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("enable-view-transition");
      });
    });
  });

  // document.documentElement.classList.remove("enable-view-transition");
};

const loadingTopBar = () => {
  document.documentElement.classList.add("enable-view-transition");

  // Create loader element
  const loader = document.createElement("div");
  loader.id = "__transition_loader__";
  Object.assign(loader.style, {
    position: "fixed",
    top: "0",
    left: "0",
    height: "3px",
    width: "0%",
    backgroundColor: "#22c55e", // green-500
    zIndex: "9999",
    transition: "width 1s cubic-bezier(0.87, 0, 0.13, 1)",
    pointerEvents: "none",
  });

  document.body.appendChild(loader);

  // Animate loader grow
  requestAnimationFrame(() => {
    loader.style.width = "90%";
  });

  // Start fake ViewTransition (needed for compatibility)
  const oldAnim = document.documentElement.animate(
    [{ opacity: 1 }, { opacity: 1 }],
    {
      duration: 600,
      fill: "forwards",
      pseudoElement: "::view-transition-old(root)",
    }
  );

  const newAnim = document.documentElement.animate(
    [{ opacity: 1 }, { opacity: 1 }],
    {
      duration: 600,
      fill: "forwards",
      pseudoElement: "::view-transition-new(root)",
    }
  );

  // Cleanup after transition completes
  Promise.allSettled([oldAnim.finished, newAnim.finished]).then(() => {
    // Finalize loader
    loader.style.transition = "width 0.3s ease";
    loader.style.width = "100%";

    // Remove after short delay
    setTimeout(() => {
      loader.remove();
    }, 400);

    // Remove transition flag safely
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("enable-view-transition");
      });
    });
  });
};

export default TransitionLink;
