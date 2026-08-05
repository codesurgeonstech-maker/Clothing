import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your store preferences and configurations.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-white/50 border backdrop-blur-sm p-1 rounded-xl h-12">
          <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-9">General</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-9">Billing & Taxes</TabsTrigger>
          <TabsTrigger value="printer" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-9">Printer Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card className="border-none shadow-sm glass">
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Update your store information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input id="storeName" defaultValue="CodeSurgeons POS" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Number</Label>
                  <Input id="phone" defaultValue="+91 9876543210" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue="123 Fashion Street, Tech Park, Bangalore" />
              </div>
              <Button className="mt-4">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
