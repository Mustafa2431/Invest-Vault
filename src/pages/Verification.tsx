import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface KYCDocument {
  id: string;
  document_type: string;
  document_url: string;
  status: string;
  uploaded_at: string;
}

export function Verification() {
  const { user, profile, refreshProfile } = useAuth();
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (data) {
      setDocuments(data);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!user) return;

    setUploading(documentType);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: user.id,
          document_type: documentType,
          document_url: publicUrl,
          status: 'pending',
        });

      if (dbError) throw dbError;

      await loadDocuments();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(null);
    }
  };

  const getDocumentStatus = (type: string) => {
    const doc = documents.find((d) => d.document_type === type);
    return doc?.status || 'not_uploaded';
  };

  const documentTypes = [
    { type: 'government_id', label: 'Government ID', description: 'Passport, Driver License, or National ID' },
    { type: 'company_registration', label: 'Company Registration', description: 'Only for startup founders' },
    { type: 'pan', label: 'PAN Card', description: 'Optional for tax purposes' },
    { type: 'gst', label: 'GST Certificate', description: 'Optional for registered businesses' },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">KYC Verification</h1>
            <p className="text-slate-400">
              Complete your verification to start {profile?.role === 'investor' ? 'investing' : 'raising funds'}
            </p>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex items-center space-x-4">
              {profile?.verification_status === 'verified' ? (
                <>
                  <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-green-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Verified</h3>
                    <p className="text-sm text-slate-400">Your account is fully verified</p>
                  </div>
                  <Button onClick={() => navigate('/dashboard')} className="ml-auto">
                    Go to Dashboard
                  </Button>
                </>
              ) : profile?.verification_status === 'rejected' ? (
                <>
                  <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="text-red-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Verification Rejected</h3>
                    <p className="text-sm text-slate-400">Please upload valid documents</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-yellow-600/20 rounded-full flex items-center justify-center">
                    <FileCheck className="text-yellow-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Verification Pending</h3>
                    <p className="text-sm text-slate-400">Upload required documents below</p>
                  </div>
                </>
              )}
            </div>
          </Card>

          <div className="space-y-4">
            {documentTypes.map((docType) => {
              const status = getDocumentStatus(docType.type);
              const isUploading = uploading === docType.type;

              if (profile?.role === 'investor' && docType.type === 'company_registration') {
                return null;
              }

              return (
                <Card key={docType.type} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{docType.label}</h3>
                        {status === 'verified' && (
                          <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
                            Verified
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded-full">
                            Pending Review
                          </span>
                        )}
                        {status === 'rejected' && (
                          <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded-full">
                            Rejected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{docType.description}</p>
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(docType.type, file);
                        }}
                        disabled={isUploading || status === 'verified'}
                      />
                      <div
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all
                          ${status === 'verified'
                            ? 'border-green-600/50 text-green-400 cursor-not-allowed'
                            : 'border-slate-600 hover:border-blue-500 text-slate-300'
                          }`}
                      >
                        <Upload size={20} />
                        <span className="font-medium">
                          {isUploading ? 'Uploading...' : status === 'verified' ? 'Uploaded' : 'Upload'}
                        </span>
                      </div>
                    </label>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
