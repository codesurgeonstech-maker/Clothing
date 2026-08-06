import { useState, useEffect } from "react"
import { useStore } from "@/store/useStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import toast from "react-hot-toast"

export default function Settings() {
  const { storeSettings, updateStoreSettings } = useStore()
  
  // General Tab State
  const [storeName, setStoreName] = useState(storeSettings.storeName)
  const [phone, setPhone] = useState(storeSettings.phone)
  const [address, setAddress] = useState(storeSettings.address)
  
  // Billing Tab State
  const [taxEnabled, setTaxEnabled] = useState(storeSettings.taxEnabled)
  const [cgst, setCgst] = useState(storeSettings.cgstPercentage.toString())
  const [sgst, setSgst] = useState(storeSettings.sgstPercentage.toString())

  useEffect(() => {
    setStoreName(storeSettings.storeName)
    setPhone(storeSettings.phone)
    setAddress(storeSettings.address)
    setTaxEnabled(storeSettings.taxEnabled)
    setCgst(storeSettings.cgstPercentage.toString())
    setSgst(storeSettings.sgstPercentage.toString())
  }, [storeSettings])

  const handleSaveGeneral = () => {
    updateStoreSettings({ storeName, phone, address })
    toast.success("General settings saved")
  }

  const handleSaveBilling = () => {
    updateStoreSettings({ 
      taxEnabled, 
      cgstPercentage: Number(cgst) || 0, 
      sgstPercentage: Number(sgst) || 0 
    })
    toast.success("Billing and Tax settings saved")
  }

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
                  <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Number</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <Button className="mt-4" onClick={handleSaveGeneral}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="border-none shadow-sm glass">
            <CardHeader>
              <CardTitle>Billing & Taxes</CardTitle>
              <CardDescription>Configure checkout calculations and taxes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border p-4 rounded-lg bg-white/50">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Enable Tax Calculation</Label>
                  <p className="text-sm text-muted-foreground">Automatically calculate CGST and SGST on checkout.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={taxEnabled} 
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" 
                  />
                </div>
              </div>

              {taxEnabled && (
                <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label htmlFor="cgst">CGST Percentage (%)</Label>
                    <Input id="cgst" type="number" step="0.1" value={cgst} onChange={(e) => setCgst(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sgst">SGST Percentage (%)</Label>
                    <Input id="sgst" type="number" step="0.1" value={sgst} onChange={(e) => setSgst(e.target.value)} />
                  </div>
                </div>
              )}

              <Button onClick={handleSaveBilling}>Save Tax Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="printer">
          <Card className="border-none shadow-sm glass">
            <CardHeader>
              <CardTitle>Printer Options</CardTitle>
              <CardDescription>Configure receipt printer settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <p className="text-sm text-muted-foreground">Printer integration settings will go here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
