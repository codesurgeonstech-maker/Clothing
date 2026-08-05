import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Gift, Users } from "lucide-react"

export default function Marketing() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Marketing & CRM</h1>
        <p className="text-muted-foreground mt-1">Engage with your customers and run campaigns.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm glass">
          <CardHeader>
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
              <MessageSquare className="w-5 h-5" />
            </div>
            <CardTitle>WhatsApp Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Send personalized offers and updates directly to your customers' WhatsApp.</p>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Create Campaign</Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm glass">
          <CardHeader>
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Gift className="w-5 h-5" />
            </div>
            <CardTitle>Loyalty Program</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Manage reward points, birthday wishes, and special customer discounts.</p>
            <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary/5">Configure Loyalty</Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm glass">
          <CardHeader>
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
              <Users className="w-5 h-5" />
            </div>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Target specific groups based on purchase history and preferences.</p>
            <Button variant="outline" className="w-full text-purple-600 border-purple-200 hover:bg-purple-50">View Segments</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
