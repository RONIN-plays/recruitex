"use client";

import React from "react";
import { motion } from "motion/react";
import { Spotlight } from "./spotlight";

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Array<{
    text: string;
    image: string;
    name: string;
    role: string;
  }>;
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div
                  className="relative p-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-300 max-w-xs w-full group"
                  key={i}
                >
                  <Spotlight
                    className="from-gray-200 via-gray-100 to-gray-50 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900"
                    size={120}
                  />
                  <div className="relative z-10">
                    <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
                      "{text}"
                    </div>
                    <div className="flex items-center gap-3 mt-5">
                      <img
                        width={40}
                        height={40}
                        src={image}
                        alt={name}
                        className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      />
                      <div className="flex flex-col">
                        <div className="font-semibold tracking-tight leading-5 text-gray-900 dark:text-white text-sm">
                          {name}
                        </div>
                        <div className="leading-5 text-gray-500 dark:text-gray-400 tracking-tight text-xs">
                          {role}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};