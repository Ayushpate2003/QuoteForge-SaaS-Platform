'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Upload, Building2, Stamp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { GST_STATES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import ImageCropper from '@/components/Shared/ImageCropper';

export default function EditFirmPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    place_of_supply: '',
    jurisdiction: '',
    logo_url: '',
    signature_url: '',
  });

  const [logo, setLogo] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  
  // Cropper States
  const [cropperSource, setCropperSource] = useState<{ image: string, type: 'logo' | 'signature' } | null>(null);

  useEffect(() => {
    fetchFirm();
  }, [id]);

  const fetchFirm = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('firms')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (data) setFormData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    // Clear input
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
    setSaving(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      // 1. Update Firm
      const response = await fetch(`${apiUrl}/api/firms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update firm');

      // 2. Upload Logo if exists
      if (logo) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logo);
        const logoUploadRes = await fetch(`${apiUrl}/api/firms/${id}/logo`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
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
        const signatureUploadRes = await fetch(`${apiUrl}/api/firms/${id}/signature`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
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
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading firm details...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/firms">
          <button className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Firm</h1>
          <p className="text-slate-500">Update company details and branding.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader title="Basic Information" />
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Business Name*" name="name" value={formData.name} onChange={handleChange} required />
            <Input label="GSTIN*" name="gstin" value={formData.gstin} onChange={handleChange} required />
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

        <Card>
          <CardHeader title="Branding" subtitle="Current logo and signature shown below." />
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Company Logo
              </label>
              {logo ? (
                <div className="w-full h-32 bg-indigo-50 rounded-lg border border-indigo-200 flex items-center justify-center p-4">
                  <img src={URL.createObjectURL(logo)} alt="New logo" className="max-h-full object-contain" />
                </div>
              ) : formData.logo_url && (
                <div className="w-full h-32 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center p-4">
                  <img src={formData.logo_url} alt="Current logo" className="max-h-full object-contain" />
                </div>
              )}
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'logo')} accept="image/*" />
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <p className="text-xs text-slate-500 font-medium">{logo ? 'Change Selection' : 'Replace Logo'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Stamp className="w-4 h-4" /> Authorized Signature
              </label>
              {signature ? (
                <div className="w-full h-32 bg-indigo-50 rounded-lg border border-indigo-200 flex items-center justify-center p-4">
                  <img src={URL.createObjectURL(signature)} alt="New signature" className="max-h-full object-contain" />
                </div>
              ) : formData.signature_url && (
                <div className="w-full h-32 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center p-4">
                  <img src={formData.signature_url} alt="Current signature" className="max-h-full object-contain" />
                </div>
              )}
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'signature')} accept="image/*" />
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <p className="text-xs text-slate-500 font-medium">{signature ? 'Change Selection' : 'Replace Signature'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Bank Details" />
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

        <Card>
          <CardHeader title="Quote Settings" />
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Place of Supply" name="place_of_supply" options={GST_STATES} value={formData.place_of_supply} onChange={handleChange} />
            <Input label="Jurisdiction" name="jurisdiction" value={formData.jurisdiction} onChange={handleChange} />
          </CardContent>
        </Card>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

        <div className="flex items-center justify-end gap-4">
          <Link href="/admin/firms">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={saving} className="px-8">Update Firm</Button>
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
