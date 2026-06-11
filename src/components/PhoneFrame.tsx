type Props = {
  src: string;
  alt: string;
  className?: string;
};

/**
 * Minimal iPhone-style bezel wrapper around an app screenshot.
 * Uses the 9:19.5 aspect ratio (matches modern iPhones), a rounded
 * outer bezel with a subtle ring + drop shadow for a floating effect,
 * and a tiny dynamic-island pill at the top.
 */
export default function PhoneFrame({ src, alt, className }: Props) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <div className="relative aspect-[9/19.5] w-full rounded-[42px] bg-neutral-950 p-[10px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
        <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-black">
          <img
            src={src}
            alt={alt}
            loading="lazy"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover select-none"
          />
          {/* Dynamic island */}
          <div
            aria-hidden
            className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[34%] h-[14px] bg-black rounded-full ring-1 ring-white/5"
          />
        </div>
      </div>
    </div>
  );
}
