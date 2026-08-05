import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, TrendingUp, Clock, Target } from "lucide-react"

export default function Analytics() {
  const insights = [
    { title: "Peak Sales Time", value: "4:00 PM - 6:00 PM", desc: "Based on last 30 days of transactions", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Best Selling Category", value: "Premium Shirts", desc: "Generated 35% of total revenue", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Customer Retention", value: "Needs Attention", desc: "Repeat rate dropped by 2% this week", icon: Target, color: "text-rose-500", bg: "bg-rose-50" },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Analytics <Sparkles className="w-6 h-6 text-primary" />
        </h1>
        <p className="text-muted-foreground mt-1">AI-powered business insights and recommendations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {insights.map((insight, i) => (
          <Card key={i} className="border-none shadow-sm glass overflow-hidden">
            <div className={`h-1.5 w-full ${insight.bg.replace('50', '500')}`} />
            <CardHeader className="pb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${insight.bg} ${insight.color}`}>
                <insight.icon className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">{insight.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-slate-900">{insight.value}</div>
              <p className="text-sm text-muted-foreground mt-1">{insight.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
