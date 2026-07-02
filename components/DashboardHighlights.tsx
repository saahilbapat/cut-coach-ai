import { getDashboardHighlightGraph } from "../lib/checkins";
import type { CheckIn } from "../lib/types";

type DashboardHighlightsProps = {
  saved: CheckIn[];
};

export function DashboardHighlights({ saved }: DashboardHighlightsProps) {
  const graph = getDashboardHighlightGraph(saved);
  const hasSteps = graph.some((item) => item.steps > 0);
  const hasWeights = graph.some((item) => item.weight !== null);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/30 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-green-400">
            Dashboard Highlight
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
            Recent Momentum
          </h2>
        </div>
        <p className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-400">
          7 logs
        </p>
      </div>

      {graph.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-slate-400">
          Save a few check-ins to build your trend graph.
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white">Steps</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Recent activity consistency
                </p>
              </div>
              <p className="text-xs font-bold text-green-300">
                {hasSteps ? "Logged" : "No step data"}
              </p>
            </div>

            <div className="mt-5 flex h-28 items-end gap-2">
              {graph.map((item) => (
                <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-20 w-full items-end rounded-2xl bg-black/30 p-1">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-green-500 to-emerald-300 shadow-lg shadow-green-500/20"
                      style={{ height: `${hasSteps ? item.stepPercent : 8}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white">Weight</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Saved check-in trend
                </p>
              </div>
              <p className="text-xs font-bold text-green-300">
                {hasWeights ? "Tracked" : "No weight data"}
              </p>
            </div>

            <div className="mt-5 flex h-24 items-end gap-2">
              {graph.map((item) => (
                <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-16 w-full items-end rounded-2xl bg-black/30 p-1">
                    <div
                      className="w-full rounded-xl bg-white/20"
                      style={{ height: `${item.weightPercent || 8}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500">
                    {item.weight ? item.weight.toFixed(0) : "--"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
