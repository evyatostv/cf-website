import React from 'react';
import { useInView } from 'motion/react';
import { cn } from '@/app/lib/utils';
import { AspectRatio } from './aspect-ratio';

interface LazyImageProps {
  alt: string;
  src: string;
  className?: string;
  aspectRatioClassName?: string;
  fallback?: string;
  ratio: number;
  inView?: boolean;
}

export function LazyImage({
  alt,
  src,
  ratio,
  fallback,
  inView = false,
  className,
  aspectRatioClassName,
}: LazyImageProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const isInView = useInView(ref, { once: true });

  const [imgSrc, setImgSrc] = React.useState<string | undefined>(
    inView ? undefined : src,
  );
  const [isLoading, setIsLoading] = React.useState(true);

  const handleError = () => {
    if (fallback) setImgSrc(fallback);
    setIsLoading(false);
  };

  const handleLoad = () => setIsLoading(false);

  React.useEffect(() => {
    if (inView && isInView && !imgSrc) setImgSrc(src);
  }, [inView, isInView, src, imgSrc]);

  React.useEffect(() => {
    if (imgRef.current?.complete) handleLoad();
  }, [imgSrc]);

  return (
    <AspectRatio
      ref={ref}
      ratio={ratio}
      className={cn('relative size-full overflow-hidden rounded-xl', aspectRatioClassName)}
    >
      <div
        className={cn(
          'absolute inset-0 animate-pulse rounded-xl bg-[#e1e6ec] transition-opacity will-change-[opacity]',
          { 'opacity-0': !isLoading },
        )}
      />
      {imgSrc && (
        <img
          ref={imgRef}
          alt={alt}
          src={imgSrc}
          className={cn(
            'size-full rounded-xl object-cover opacity-0 transition-opacity duration-500 will-change-[opacity]',
            { 'opacity-100': !isLoading },
            className,
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}
    </AspectRatio>
  );
}
