import { HOME_STATS } from "../data/home-mock-data";

export function HomeStatsSection() {
  return (
    <section className="relative mx-auto max-w-5xl">
      {/* Ambient Glow behind the strip */}
      <div className="absolute inset-0 -z-10 mx-auto max-w-3xl translate-y-4 rounded-full bg-primary/20 blur-[60px]" aria-hidden="true" />
      
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-background/40 p-8 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/5">
        <div className="grid grid-cols-2 gap-y-10 divide-x-0 sm:grid-cols-4 sm:divide-x sm:divide-border/60">
          {HOME_STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="group flex flex-col items-center justify-center px-4 transition-all duration-300 hover:scale-105"
              >
                <div className="relative mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground shadow-inner">
                  <Icon className="size-6" />
                </div>
                <span className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-black tracking-tighter text-transparent">
                  {stat.value}
                </span>
                <span className="mt-2 text-sm font-medium text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
