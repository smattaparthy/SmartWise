1. Global Design System
Goal: One visual language across all 3 personas, but content changes.
1.1 Colors (Tailwind-friendly)
bg / surface: #0f172a for shell? No — let’s keep it light for finance.
Light theme:
background: #f5f5f6
surface/card: #ffffff
text-primary: #0f172a
text-muted: #6b7280
border: #e5e7eb
accent: #2563eb (buttons, charts highlights)
warning: #f97316 (for overweight flags)
danger: #ef4444 (errors)
You can set this in globals.css or Tailwind config if you’re using ShadCN.
1.2 Typography
Use system font or ShadCN default.
Headings:
Page title: text-2xl font-semibold tracking-tight
Section title: text-lg font-medium
Body: text-sm text-slate-600
Keep everything in the 12–16px range so your tables don’t balloon.
1.3 Spacing & Containers
Page container: max-w-6xl mx-auto px-6 py-6
Card component: rounded-lg border bg-white p-4 or ShadCN Card
Grid gaps: gap-4 for dashboard, gap-6 for forms
2. Layout Shells
2.1 Auth Layout (/login, /signup)
Centered card, no sidebar.
Background light gray.
Card: max-w-sm w-full bg-white rounded-lg border p-6 shadow-sm
Button full-width.
2.2 Main App Layout
Create a wrapper component:
// components/AppShell.tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-14 border-b bg-white flex items-center justify-between px-6">
        <div className="text-sm font-semibold">Investing Assistant</div>
        <div className="text-xs text-slate-500">Logged in</div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
Then each page can wrap in <AppShell> to get the consistent top bar.
3. Onboarding UI (10 questions, low scroll)
You don’t want 10 questions in one tall page. Do 3 steps:
Step 1: experience + existing portfolio + goal (Q1–Q3)
Step 2: horizon + risk reaction + max risk (Q4–Q6)
Step 3: contribution + concentration + frontier interest + guidance style (Q7–Q10)
Use a progress indicator at top.
<div className="flex items-center gap-2 mb-4">
  <div className="h-1 flex-1 rounded bg-slate-200">
    <div className="h-1 w-1/3 rounded bg-slate-900" />
  </div>
  <span className="text-xs text-slate-500">Step 1 of 3</span>
</div>
Each question is a carded select (less boring than plain selects):
<label className="text-sm font-medium mb-2 block">
  How would you describe your investing experience?
</label>
<div className="grid gap-2 md:grid-cols-2">
  <button className="border rounded-lg p-3 text-left hover:border-slate-900">
    I’m new, I just want to start
  </button>
  ...
</div>
Store the choice in state. On “Continue”, POST to backend at the end of step 3.
4. Persona Screens
4.1 Persona A (/dashboard/persona-a)
Intent: confidence, clarity, no numbers jungle.
Layout:
Left: “Your starter plan”
Right: “What’s inside” (list of ETFs)
<AppShell>
  <div className="grid md:grid-cols-3 gap-4">
    <div className="md:col-span-2 space-y-4">
      <div className="bg-white rounded-lg border p-4">
        <h1 className="text-xl font-semibold mb-2">Your starter portfolio</h1>
        <p className="text-sm text-slate-500 mb-4">
          Based on your answers, we kept it index-heavy and liquid.
        </p>
        <ul className="space-y-2">
          <li className="flex justify-between text-sm">
            <span>VOO – S&P 500</span><span className="text-slate-500">50%</span>
          </li>
          <li className="flex justify-between text-sm">
            <span>BND – Bonds</span><span className="text-slate-500">30%</span>
          </li>
          <li className="flex justify-between text-sm">
            <span>Cash</span><span className="text-slate-500">20%</span>
          </li>
        </ul>
      </div>
    </div>
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-sm font-medium mb-2">Monthly plan</h2>
        <p className="text-xs text-slate-500 mb-3">Set up a recurring amount.</p>
        <input className="border rounded w-full p-2 text-sm" placeholder="$250" />
        <button className="mt-3 w-full bg-slate-900 text-white rounded py-2 text-sm">Save</button>
      </div>
    </div>
  </div>
</AppShell>
Short, two columns, no scroll beyond the fold.
4.2 Persona B (/dashboard/persona-b/upload)
Intent: analysis first, then suggestions.
Structure:
Upload card
Analysis panel (flags)
Current vs target
<div className="grid gap-4 lg:grid-cols-3">
  <div className="lg:col-span-2 space-y-4">
    {/* Upload + Analysis */}
  </div>
  <div className="space-y-4">
    {/* Flags */}
  </div>
</div>
Flags UI:
{result.flags.map(f => (
  <div key={f.message} className="bg-amber-50 border border-amber-200 rounded p-2">
    <p className="text-xs text-amber-900">{f.message}</p>
  </div>
))}
Current vs Target UI:
<div className="bg-white rounded border p-4">
  <h2 className="text-sm font-medium mb-3">Target allocation ({result.target_allocation.name})</h2>
  <ul className="space-y-1">
    {result.target_allocation.instruments.map((inst: any) => (
      <li key={inst.ticker} className="flex justify-between text-sm">
        <span>{inst.ticker}</span>
        <span className="text-slate-500">{inst.weight_pct}%</span>
      </li>
    ))}
  </ul>
</div>
4.3 Persona C (/dashboard/persona-c/ideas)
Intent: show risk, show theme, show cards.
Use the banner we wrote:
<HighRiskBanner />
Then cards:
<div className="grid gap-4 md:grid-cols-2">
  {ideas.map(idea => (
    <div key={idea.ticker} className="bg-white border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{idea.ticker}</h2>
        <span className="text-[10px] uppercase text-slate-400">{idea.sector}</span>
      </div>
      <p className="text-xs text-slate-600">{idea.thesis}</p>
      <p className="text-[10px] text-slate-400">Horizon: {idea.time_horizon_years} yrs</p>
    </div>
  ))}
</div>
Add a search bar at top:
<input
  className="border rounded w-full md:w-64 p-2 text-sm"
  placeholder="Search frontier areas..."
  value={query}
  onChange={...}
/>
<button className="ml-2 bg-slate-900 text-white px-3 py-2 rounded text-sm">Search</button>
5. Data Viz with Ant Design Charts
For the X-ray, your data shape is already:
[
  { "sector": "Technology", "weight_pct": 63.83 },
  ...
]
Use Ant Design’s Pie or Column chart.
Example Pie:
import { Pie } from '@ant-design/plots';

const config = {
  data: sectorData,
  angleField: 'weight_pct',
  colorField: 'sector',
  radius: 0.9,
  label: {
    type: 'inner',
    offset: '-30%',
    content: '{name}',
    style: { fontSize: 12, textAlign: 'center' },
  },
  interactions: [{ type: 'element-active' }],
};

return <Pie {...config} />;
Put this inside a card:
<div className="bg-white rounded border p-4">
  <h2 className="text-sm font-medium mb-3">Sector breakdown</h2>
  <Pie {...config} />
</div>
That gives users visual proof of concentration.
6. UI States
6.1 Loading
Use skeletons — ShadCN has them, or DIY:
<div className="animate-pulse space-y-2">
  <div className="h-4 bg-slate-200 rounded w-1/3" />
  <div className="h-4 bg-slate-200 rounded w-1/2" />
  <div className="h-32 bg-slate-200 rounded" />
</div>
Trigger on initial /me and on CSV upload.
6.2 Empty
Persona B, no upload yet → show “Drop CSV to analyze” state with dashed border.
Persona C, no ideas → “No ideas found for this query. Try a broader theme.”
6.3 Error
Top-of-card red bar:
<div className="bg-red-50 border border-red-200 text-red-700 rounded p-2 text-xs">
  Could not analyze portfolio. Check CSV format.
</div>
7. Navigation / Click Reduction
You wanted few clicks and low scroll. So:
After login → go straight to /dashboard which auto-routes → no “home” screen
Persona pages should keep actions at the top (upload, search, monthly amount)
Use drawers/modals sparingly — MVP doesn’t need them
Keep tables short; paginate or “show more”
8. Optional: Figma-ish Token Sheet
If you were to drop this in Figma, your style sheet would have:
Colors: primary #2563eb, surface #ffffff, background #f5f5f6, border #e5e7eb, warning #f97316
Type: 16/24 for headers, 14/20 for body, 12/16 for meta
Elevation: Card shadow 0 1px 2px rgba(15, 23, 42, 0.05)
Components: Card, Input, Button (primary/ghost), Alert (warning for persona B, amber for persona C)
That’s enough for a designer/dev to keep consistency.
9. What to actually do next (in code)
Wrap all app pages in a shared <AppShell> so design is consistent.
Refactor onboarding into 3-step layout with progress bar.
Add Ant Design Pie chart to Persona B analysis card.
Style flags as amber alert cards.
Add HighRiskBanner to Persona C and make ideas into 2-column cards.
Add empty/loading states.