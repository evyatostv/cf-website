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

  const springConfig = { stiffness: 120, damping: 25, mass: 0.8 };

  const rawRotate = useTransform(scrollYProgress, [0.05, 0.35], [15, 0]);
  const rawScale = useTransform(scrollYProgress, [0.05, 0.35], [1.05, 1]);
  const rawTranslate = useTransform(scrollYProgress, [0.05, 0.35], [0, -60]);

  const rotate = useSpring(rawRotate, springConfig);
  const scale = useSpring(rawScale, springConfig);
  const translate = useSpring(rawTranslate, springConfig);

  return (
    <div
      className="h-[60rem] md:h-[80rem] flex items-center justify-center relative p-4 md:p-20"
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
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="max-w-5xl -mt-12 mx-auto w-full aspect-[4/3] border-[12px] border-[#1a1a1a] p-1 sm:p-2 md:p-4 bg-[#1a1a1a] rounded-[20px] sm:rounded-[28px] md:rounded-[36px] shadow-2xl relative"
    >
      {/* Camera dot */}
      <div className="absolute top-[4px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#333] z-10" />

      <div className="h-full w-full overflow-hidden rounded-[10px] sm:rounded-[16px] md:rounded-[20px] bg-gray-100">
        {children}
      </div>
    </motion.div>
  );
};
