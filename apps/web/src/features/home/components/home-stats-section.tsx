import { HOME_STATS } from "../data/home-mock-data";

export function HomeStatsSection() {
  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
      {HOME_STATS.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-card p-6 text-center shadow-xs transition-transform hover:-translate-y-0.5"
          >
            <div className={`flex size-12 items-center justify-center rounded-2xl mb-3 ${stat.color}`}>
              <Icon className="size-6" />
            </div>
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {stat.value}
            </span>
            <span className="text-xs font-medium text-muted-foreground mt-1">
              {stat.label}
            </span>
          </div>
        );
      })}
    </section>
  );
}
