import DotCard from "@/components/ui/moving-dot-card";

const MovingDotDemo = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center bg-white dark:bg-black">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <DotCard target={25} duration={2000} label="Questions" />
        <DotCard target={90} duration={2500} label="Minutes" />
        <DotCard target={500} duration={3000} label="Companies" />
      </div>
    </div>
  );
};

export { MovingDotDemo };