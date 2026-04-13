import React, { useRef } from "react";
import { useScroll, useTransform, useSpring, motion, MotionValue } from "motion/react";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scaleDimensions = () => (isMobile ? [0.7, 0.9] : [1.05, 1]);

  const springConfig = { stiffness: 120, damping: 25, mass: 0.8 };

  const rawRotate = useTransform(scrollYProgress, [0.05, 0.35], [15, 0]);
  const rawScale = useTransform(scrollYProgress, [0.05, 0.35], scaleDimensions());
  const rawTranslate = useTransform(scrollYProgress, [0.05, 0.35], [0, -60]);

  const rotate = useSpring(rawRotate, springConfig);
  const scale = useSpring(rawScale, springConfig);
  const translate = useSpring(rawTranslate, springConfig);

  return (
    <div
      className="h-[60rem] md:h-[80rem] flex items-center justify-center relative p-2 md:p-20"
      ref={containerRef}
    >
      <div className="py-10 md:py-40 w-full relative" style={{ perspective: "1000px" }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }: { translate: MotionValue<number>; titleComponent: React.ReactNode }) => {
  return (
    <motion.div style={{ translateY: translate }} className="max-w-5xl mx-auto text-center">
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <div className="max-w-5xl -mt-12 mx-auto w-full">
      {/* Screen */}
      <motion.div
        style={{
          rotateX: rotate,
          scale,
          boxShadow:
            "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
        }}
        className="h-[30rem] md:h-[40rem] w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-t-[30px] md:rounded-[30px] shadow-2xl"
      >
        <div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl md:p-4">
          {children}
        </div>
      </motion.div>

      {/* Laptop base — visible on mobile only */}
      <div className="md:hidden">
        {/* Hinge */}
        <div className="mx-auto w-[90%] h-[6px] bg-gradient-to-b from-[#4a4a4a] to-[#333] rounded-b-sm" />
        {/* Keyboard base */}
        <div className="mx-auto w-[105%] -ml-[2.5%] h-[14px] bg-gradient-to-b from-[#c0c0c0] to-[#a8a8a8] rounded-b-lg shadow-md relative">
          {/* Trackpad indicator */}
          <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-[60px] h-[4px] bg-[#b0b0b0] rounded-full" />
        </div>
        {/* Bottom edge */}
        <div className="mx-auto w-[108%] -ml-[4%] h-[3px] bg-[#888] rounded-b-xl" />
      </div>
    </div>
  );
};
