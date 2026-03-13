import { useEffect, useState } from 'react';
import { Users, Building2, TrendingUp, FileCheck, CheckCircle, XCircle } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: string;
  uploaded_at: string;
  user: {
    full_name: string;
    email: string;
    role: string;
  };
}

export function Admin() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStartups: 0,
    totalInvestments: 0,
    pendingKYC: 0,
  });
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [
      { count: usersCount },
      { count: startupsCount },
      { count: investmentsCount },
      { data: kycData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('startups').select('*', { count: 'exact', head: true }),
      supabase.from('investments').select('*', { count: 'exact', head: true }),
      supabase
        .from('kyc_documents')
        .select(`
          *,
          user:profiles(full_name, email, role)
        `)
        .eq('status', 'pending')
        .order('uploaded_at', { ascending: false }),
    ]);

    setStats({
      totalUsers: usersCount || 0,
      totalStartups: startupsCount || 0,
      totalInvestments: investmentsCount || 0,
      pendingKYC: kycData?.length || 0,
    });

    if (kycData) {
      setKycDocuments(kycData as unknown as KYCDocument[]);
    }

    setLoading(false);
  };

  const updateKYCStatus = async (documentId: string, userId: string, status: 'verified' | 'rejected') => {
    await supabase
      .from('kyc_documents')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', documentId);

    const { data: userDocs } = await supabase
      .from('kyc_documents')
      .select('status')
      .eq('user_id', userId);

    if (userDocs) {
      const allVerified = userDocs.every((doc) => doc.status === 'verified');
      const anyRejected = userDocs.some((doc) => doc.status === 'rejected');

      if (allVerified) {
        await supabase
          .from('profiles')
          .update({ verification_status: 'verified' })
          .eq('id', userId);
      } else if (anyRejected) {
        await supabase
          .from('profiles')
          .update({ verification_status: 'rejected' })
          .eq('id', userId);
      }
    }

    loadData();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-slate-400">Manage platform operations and verification</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Users className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <Building2 className="text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Startups</p>
                <p className="text-2xl font-bold text-white">{stats.totalStartups}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Investments</p>
                <p className="text-2xl font-bold text-white">{stats.totalInvestments}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                <FileCheck className="text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400">Pending KYC</p>
                <p className="text-2xl font-bold text-white">{stats.pendingKYC}</p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4">Pending KYC Verifications</h2>
          {kycDocuments.length === 0 ? (
            <Card className="p-12 text-center">
              <FileCheck className="text-slate-600 mx-auto mb-4" size={48} />
              <p className="text-slate-400">No pending KYC documents</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {kycDocuments.map((doc) => (
                <Card key={doc.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-white">{doc.user.full_name}</h3>
                        <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                          {doc.user.role}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{doc.user.email}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-slate-400">
                          Document: <span className="text-white capitalize">{doc.document_type.replace('_', ' ')}</span>
                        </span>
                        <span className="text-slate-400">
                          Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-3">
                        <a
                          href={doc.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm underline"
                        >
                          View Document
                        </a>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateKYCStatus(doc.id, doc.user_id, 'verified')}
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => updateKYCStatus(doc.id, doc.user_id, 'rejected')}
                      >
                        <XCircle size={16} className="mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
