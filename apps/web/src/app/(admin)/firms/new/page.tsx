'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Upload, Building2, CreditCard, Settings2, Stamp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { GST_STATES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import ImageCropper from '@/components/Shared/ImageCropper';

export default function NewFirmPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pin: '',
    gstin: '',
    pan: '',
    msme_no: '',
    phone: '',
    email: '',
    bank_name: '',
    bank_ac_no: '',
    bank_ifsc: '',
    bank_branch: '',
    bank_ac_holder: '',
    quote_prefix: 'QT',
    starting_number: 1,
    place_of_supply: '',
    jurisdiction: '',
  });

  const [logo, setLogo] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  
  // Cropper States
  const [cropperSource, setCropperSource] = useState<{ image: string, type: 'logo' | 'signature' } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropperSource({ image: reader.result as string, type });
      };
      reader.readAsDataURL(file);
    }
    // Clear input so same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = (blob: Blob) => {
    if (!cropperSource) return;
    
    const file = new File([blob], `${cropperSource.type}.png`, { type: 'image/png' });
    if (cropperSource.type === 'logo') setLogo(file);
    else setSignature(file);
    
    setCropperSource(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create Firm via API
      // Note: In a real app, we'd use our Express API. 
      // For simplicity in this step, I'll use Supabase directly if the API isn't running,
      // but the plan says to use the API. I'll use fetch to the API.
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/firms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create firm');
      }

      const firm = await response.json();

      // 2. Upload Logo if exists
      if (logo) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logo);
        const logoUploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/firms/${firm.id}/logo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: logoFormData
        });
        if (!logoUploadRes.ok) {
          const msg = await logoUploadRes.text();
          throw new Error(`Logo upload failed: ${msg}`);
        }
      }

      // 3. Upload Signature if exists
      if (signature) {
        const sigFormData = new FormData();
        sigFormData.append('signature', signature);
        const signatureUploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/firms/${firm.id}/signature`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: sigFormData
        });
        if (!signatureUploadRes.ok) {
          const msg = await signatureUploadRes.text();
          throw new Error(`Signature upload failed: ${msg}`);
        }
      }

      router.push('/admin/firms');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/firms">
          <button className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Firm</h1>
          <p className="text-slate-500">Create a new business profile for your quotations.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Basic Info */}
        <Card>
          <CardHeader title="Basic Information" subtitle="Official business details for GST compliance." />
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Business Name*" name="name" value={formData.name} onChange={handleChange} required />
            <Input label="GSTIN*" name="gstin" placeholder="27XXXXX0000X1Z5" value={formData.gstin} onChange={handleChange} required />
            <div className="md:col-span-2">
              <Input label="Address*" name="address" value={formData.address} onChange={handleChange} required />
            </div>
            <Input label="City*" name="city" value={formData.city} onChange={handleChange} required />
            <Select label="State*" name="state" options={GST_STATES} value={formData.state} onChange={handleChange} required />
            <Input label="PIN Code*" name="pin" value={formData.pin} onChange={handleChange} required />
            <Input label="PAN" name="pan" value={formData.pan} onChange={handleChange} />
            <Input label="MSME Number" name="msme_no" value={formData.msme_no} onChange={handleChange} />
            <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
          </CardContent>
        </Card>

        {/* SECTION 2: Branding */}
        <Card>
          <CardHeader title="Branding" subtitle="Upload your company logo and authorized signature." />
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Company Logo
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group min-h-[160px]">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => handleFileChange(e, 'logo')}
                  accept="image/*"
                />
                {logo ? (
                  <div className="text-center">
                    <img src={URL.createObjectURL(logo)} alt="Logo preview" className="max-h-24 mx-auto mb-2 object-contain" />
                    <p className="text-xs font-medium text-indigo-600">Change logo</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-indigo-500 transition-colors" />
                    <p className="text-sm text-slate-500 font-medium">Click to upload logo</p>
                    <p className="text-xs text-slate-400 mt-1">Max 2MB (PNG/JPG)</p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Stamp className="w-4 h-4" /> Authorized Signature
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group min-h-[160px]">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => handleFileChange(e, 'signature')}
                  accept="image/*"
                />
                {signature ? (
                  <div className="text-center">
                    <img src={URL.createObjectURL(signature)} alt="Signature preview" className="max-h-24 mx-auto mb-2 object-contain" />
                    <p className="text-xs font-medium text-indigo-600">Change signature</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-indigo-500 transition-colors" />
                    <p className="text-sm text-slate-500 font-medium">Click to upload signature</p>
                    <p className="text-xs text-slate-400 mt-1">Transparent background preferred</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Bank Details */}
        <Card>
          <CardHeader title="Bank Details" subtitle="Information for quote payments." />
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Account Holder Name" name="bank_ac_holder" value={formData.bank_ac_holder} onChange={handleChange} />
            <Input label="Bank Name" name="bank_name" value={formData.bank_name} onChange={handleChange} />
            <Input label="Account Number" name="bank_ac_no" value={formData.bank_ac_no} onChange={handleChange} />
            <Input label="IFSC Code" name="bank_ifsc" value={formData.bank_ifsc} onChange={handleChange} />
            <div className="md:col-span-2">
              <Input label="Branch Name" name="bank_branch" value={formData.bank_branch} onChange={handleChange} />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: Quote Settings */}
        <Card>
          <CardHeader title="Quote Settings" subtitle="Configure number sequences and defaults." />
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Quote Number Prefix" name="quote_prefix" placeholder="QT" value={formData.quote_prefix} onChange={handleChange} />
            <Input label="Starting Number" name="starting_number" type="number" value={formData.starting_number} onChange={handleChange} />
            <Select label="Default Place of Supply" name="place_of_supply" options={GST_STATES} value={formData.place_of_supply} onChange={handleChange} />
            <Input label="Legal Jurisdiction" name="jurisdiction" placeholder="Subject to Mumbai Jurisdiction" value={formData.jurisdiction} onChange={handleChange} />
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-4">
          <Link href="/admin/firms">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={loading} className="px-8">Save Firm</Button>
        </div>
      </form>

      {cropperSource && (
        <ImageCropper
          image={cropperSource.image}
          aspect={cropperSource.type === 'logo' ? 1 : 3/1}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperSource(null)}
        />
      )}
    </div>
  );
}
