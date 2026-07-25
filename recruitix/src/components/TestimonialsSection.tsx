import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { Spotlight } from "@/components/ui/spotlight";
import { motion } from "motion/react";

const testimonials = [
  {
    text: "Recruitix transformed our hiring process completely. The AI-powered assessments helped us identify top talent 3x faster than traditional methods.",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    name: "Sarah Johnson",
    role: "HR Director at TechCorp",
  },
  {
    text: "The live proctoring and real-time monitoring gave us complete confidence in our remote hiring process. Highly recommend for any tech company.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    name: "Michael Chen",
    role: "CTO at StartupXYZ",
  },
  {
    text: "The semantic analysis feature is incredible. It evaluates coding solutions beyond just syntax, understanding the actual problem-solving approach.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    name: "Emily Rodriguez",
    role: "Talent Acquisition Lead",
  },
  {
    text: "As a candidate, the assessment was comprehensive yet fair. The real-time feedback and variety of question types made it engaging.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    name: "David Kim",
    role: "Software Engineer",
  },
  {
    text: "The HR simulation module is brilliant. It provides deep insights into candidate personality and behavioral patterns that traditional interviews miss.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    name: "Lisa Thompson",
    role: "People Operations Manager",
  },
  {
    text: "Implementation was smooth and the support team guided us through every step. The platform integrates seamlessly with our existing workflow.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    name: "James Wilson",
    role: "IT Manager",
  },
  {
    text: "The detailed analytics and candidate scoring helped us make data-driven hiring decisions. Our quality of hires has improved significantly.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    name: "Maria Garcia",
    role: "Recruitment Specialist",
  },
  {
    text: "Recruitix's AI algorithms are incredibly accurate. The platform correctly identified our top performers during the assessment phase.",
    image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    name: "Alex Turner",
    role: "Engineering Manager",
  },
  {
    text: "The multi-language support and cultural bias detection features make it perfect for our global hiring needs. Truly innovative platform.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    name: "Priya Patel",
    role: "Global Talent Director",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export const TestimonialsSection = () => {
  return (
    <section className="bg-background my-20 relative">
      <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border py-1 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Testimonials</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5 text-black dark:text-white text-center">
            What our users say
          </h2>
          <p className="text-center mt-5 opacity-75 text-gray-600 dark:text-gray-400">
            See what our customers have to say about our AI recruitment platform.
          </p>
        </motion.div>
        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={17}
          />
        </div>
      </div>
    </section>
  );
};