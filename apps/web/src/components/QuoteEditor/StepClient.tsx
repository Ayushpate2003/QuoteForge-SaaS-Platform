'use client';

import { User, Truck, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GST_STATES } from '@/lib/constants';

export const StepClient = ({ data, setData }: any) => {
  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData({
      ...data,
      bill_to: { ...data.bill_to, [name]: value }
    });
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData({
      ...data,
      ship_to: { ...data.ship_to, [name]: value }
    });
  };

  const toggleSameAsBilling = () => {
    setData({
      ...data,
      ship_to: { ...data.ship_to, sameAsBilling: !data.ship_to.sameAsBilling }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader title="Billing Details" subtitle="Customer information for the invoice." icon={User} />
        <CardContent className="space-y-4">
          <Input label="Customer / Company Name*" name="name" value={data.bill_to.name} onChange={handleBillingChange} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email Address" name="email" type="email" value={data.bill_to.email} onChange={handleBillingChange} />
            <Input label="Phone Number" name="phone" value={data.bill_to.phone} onChange={handleBillingChange} />
          </div>
          <Input label="GSTIN" name="gstin" placeholder="Optional" value={data.bill_to.gstin} onChange={handleBillingChange} />
          <Input label="Full Address*" name="address" value={data.bill_to.address} onChange={handleBillingChange} required />
          <Select 
            label="State (Place of Supply)*" 
            name="state" 
            options={GST_STATES.map(s => ({ label: s, value: s }))} 
            value={data.bill_to.state} 
            onChange={handleBillingChange}
            required 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Shipping Details" subtitle="Where should the items be delivered?" icon={Truck} />
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <input 
              type="checkbox" 
              id="sameAsBilling" 
              checked={data.ship_to.sameAsBilling} 
              onChange={toggleSameAsBilling}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="sameAsBilling" className="text-sm font-medium text-slate-700 cursor-pointer">
              Shipping address is same as billing
            </label>
          </div>

          {!data.ship_to.sameAsBilling && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Input label="Shipping Address*" name="address" value={data.ship_to.address} onChange={handleShippingChange} required />
              <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-xs">
                <MapPin className="w-3.5 h-3.5 mt-0.5" />
                <span>Make sure to specify the delivery point clearly for accurate logistics.</span>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-slate-100">
             <Input 
                label="Shipping Method" 
                placeholder="e.g. BlueDart Express, Self-Pickup" 
                value={data.shipping_method}
                onChange={(e) => setData({ ...data, shipping_method: e.target.value })}
              />
             <Input 
                label="Referenced Order Number" 
                placeholder="Optional" 
                value={data.order_from}
                onChange={(e) => setData({ ...data, order_from: e.target.value })}
              />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
