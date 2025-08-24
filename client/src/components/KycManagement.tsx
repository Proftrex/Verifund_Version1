import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Clock, 
  Eye, 
  Search,
  User as UserIcon,
  Mail,
  Calendar,
  AlertTriangle,
  FileSearch
} from "lucide-react";
import type { User } from "@shared/schema";

export default function KycManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedKycUser, setSelectedKycUser] = useState<any>(null);
  const [documentSearchId, setDocumentSearchId] = useState("");
  const [documentSearchResult, setDocumentSearchResult] = useState<any>(null);
  const [isSearchingDocument, setIsSearchingDocument] = useState(false);
  const [activeKycTab, setActiveKycTab] = useState("basic");

  // Fetch KYC data
  const { data: basicUsers = [] } = useQuery({
    queryKey: ["/api/admin/kyc/basic"],
    enabled: !!((user as any)?.isAdmin || (user as any)?.isSupport),
    retry: false,
  }) as { data: any[] };

  const { data: pendingKyc = [] } = useQuery({
    queryKey: ["/api/admin/kyc/pending"],
    enabled: !!((user as any)?.isAdmin || (user as any)?.isSupport),
    retry: false,
  }) as { data: any[] };

  // Temporarily disable all users query - will be implemented later
  const allUsers: any[] = [];

  // KYC Mutations
  const approveKycMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/kyc/${userId}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "KYC Approved", description: "User KYC has been approved." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/all"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to approve KYC.", variant: "destructive" });
    },
  });

  const rejectKycMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/kyc/${userId}/reject`, {});
    },
    onSuccess: () => {
      toast({ title: "KYC Rejected", description: "User KYC has been rejected." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/all"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to reject KYC.", variant: "destructive" });
    },
  });

  // Document search function
  const searchDocuments = async () => {
    if (!documentSearchId.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a user ID to search.",
        variant: "destructive",
      });
      return;
    }

    setIsSearchingDocument(true);
    try {
      const user = allUsers.find(u => u.id === documentSearchId.trim());
      if (user) {
        setDocumentSearchResult(user);
      } else {
        setDocumentSearchResult(null);
        toast({
          title: "User Not Found",
          description: "No user found with that ID.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search for user documents.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingDocument(false);
    }
  };

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800" data-testid="badge-kyc-verified">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800" data-testid="badge-kyc-pending">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800" data-testid="badge-kyc-rejected">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800" data-testid="badge-kyc-not-submitted">Not Submitted</Badge>;
    }
  };

  const getKycStats = () => {
    const verified = allUsers.filter(u => u.kycStatus === 'verified').length;
    const pending = pendingKyc.length;
    const rejected = allUsers.filter(u => u.kycStatus === 'rejected').length;
    const notSubmitted = allUsers.filter(u => !u.kycStatus || u.kycStatus === 'not_submitted').length;
    
    return { verified, pending, rejected, notSubmitted, total: allUsers.length };
  };

  const kycStats = getKycStats();

  const renderDocumentViewer = (kycUser: any) => (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>KYC Documents - {kycUser.firstName} {kycUser.lastName}</DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        {kycUser.kycDocuments ? (
          Object.entries(JSON.parse(kycUser.kycDocuments)).map(([docType, docUrl]) => (
            <div key={docType} className="border rounded-lg p-4">
              <h4 className="font-medium mb-3 capitalize">
                {docType.replace('_', ' ')}
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <img 
                  src={docUrl as string}
                  alt={`${docType} document`}
                  className="max-w-full h-auto max-h-96 mx-auto rounded border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="text-center py-8 text-gray-500">
                          <div class="w-12 h-12 mx-auto mb-2 text-gray-400">📄</div>
                          <p>Document preview not available</p>
                          <p class="text-sm">Click to download: <a href="${docUrl}" target="_blank" class="text-blue-600 hover:underline">${docType}</a></p>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-sm text-gray-600">Document Type: {docType}</span>
                <a 
                  href={docUrl as string} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Open in New Tab
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2" />
            <p>No documents uploaded</p>
          </div>
        )}
      </div>
    </DialogContent>
  );

  const renderKycUserCard = (kycUser: User, showActions: boolean = true) => (
    <div 
      key={kycUser.id}
      className="border rounded-lg p-4"
      data-testid={`kyc-user-${kycUser.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold" data-testid={`kyc-user-name-${kycUser.id}`}>
              {kycUser.firstName} {kycUser.lastName}
            </h3>
            {getKycStatusBadge(kycUser.kycStatus || 'not_submitted')}
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>{kycUser.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Submitted: {new Date(kycUser.createdAt!).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>ID: {kycUser.id}</span>
            </div>
          </div>
          {kycUser.kycDocuments && (
            <div className="mt-2">
              <span className="text-sm font-medium">Documents:</span>
              <div className="text-sm text-muted-foreground">
                {Object.keys(JSON.parse(kycUser.kycDocuments)).join(", ")}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {showActions && kycUser.kycStatus === 'pending' && (
            <>
              <Button 
                size="sm"
                onClick={() => approveKycMutation.mutate(kycUser.id)}
                disabled={approveKycMutation.isPending}
                data-testid={`button-approve-kyc-${kycUser.id}`}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button 
                size="sm"
                variant="destructive"
                onClick={() => rejectKycMutation.mutate(kycUser.id)}
                disabled={rejectKycMutation.isPending}
                data-testid={`button-reject-kyc-${kycUser.id}`}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => setSelectedKycUser(kycUser)}
                data-testid={`button-view-documents-${kycUser.id}`}
              >
                <FileText className="w-4 h-4 mr-1" />
                View Docs
              </Button>
            </DialogTrigger>
            {renderDocumentViewer(kycUser)}
          </Dialog>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KYC Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-800" data-testid="stat-total-users">
                  {kycStats.total}
                </div>
                <div className="text-sm text-blue-600">Total Users</div>
              </div>
              <UserIcon className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-800" data-testid="stat-verified-kyc">
                  {kycStats.verified}
                </div>
                <div className="text-sm text-green-600">Verified</div>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-800" data-testid="stat-pending-kyc">
                  {kycStats.pending}
                </div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-800" data-testid="stat-rejected-kyc">
                  {kycStats.rejected}
                </div>
                <div className="text-sm text-red-600">Rejected</div>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800" data-testid="stat-not-submitted-kyc">
                  {kycStats.notSubmitted}
                </div>
                <div className="text-sm text-gray-600">Not Submitted</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KYC Management Tabs */}
      <Tabs value={activeKycTab} onValueChange={setActiveKycTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" data-testid="tab-kyc-basic">
            Basic ({basicUsers.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-kyc-pending">
            Pending ({kycStats.pending})
          </TabsTrigger>
          <TabsTrigger value="verified" data-testid="tab-kyc-verified">
            Verified ({kycStats.verified})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-kyc-rejected">
            Rejected ({kycStats.rejected})
          </TabsTrigger>
          <TabsTrigger value="search" data-testid="tab-kyc-search">
            Document Search
          </TabsTrigger>
        </TabsList>

        {/* Basic Users Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Users</CardTitle>
              <CardDescription>Users who haven't started KYC verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {basicUsers && basicUsers.length > 0 ? (
                  basicUsers.map((basicUser: User) => (
                    <Card key={basicUser.id} className="p-4 border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <UserIcon className="w-8 h-8 text-gray-500" />
                          <div>
                            <h4 className="font-semibold">{basicUser.firstName} {basicUser.lastName}</h4>
                            <p className="text-sm text-muted-foreground">{basicUser.email}</p>
                            <Badge variant="outline" className="mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              No KYC Submitted
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            Joined: {basicUser.createdAt ? new Date(basicUser.createdAt).toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All Users Verified!</h3>
                    <p className="text-muted-foreground">All users have started their KYC verification process.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending KYC Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending KYC Verifications</CardTitle>
              <CardDescription>Review and approve or reject KYC submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingKyc && pendingKyc.length > 0 ? (
                  pendingKyc.map((kycUser: User) => renderKycUserCard(kycUser, true))
                ) : (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All Verified!</h3>
                    <p className="text-muted-foreground">No pending KYC verifications.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verified KYC Tab */}
        <TabsContent value="verified">
          <Card>
            <CardHeader>
              <CardTitle>Verified Users</CardTitle>
              <CardDescription>Users with approved KYC verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers.filter(u => u.kycStatus === 'verified').map((kycUser: User) => 
                  renderKycUserCard(kycUser, false)
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejected KYC Tab */}
        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected KYC</CardTitle>
              <CardDescription>Users with rejected KYC submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers.filter(u => u.kycStatus === 'rejected').map((kycUser: User) => 
                  renderKycUserCard(kycUser, false)
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Search Tab */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Document Search</CardTitle>
              <CardDescription>Search for user documents by User ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="documentSearchId">User ID</Label>
                  <Input
                    id="documentSearchId"
                    value={documentSearchId}
                    onChange={(e) => setDocumentSearchId(e.target.value)}
                    placeholder="Enter user ID to search documents..."
                    data-testid="input-document-search"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={searchDocuments}
                    disabled={isSearchingDocument}
                    data-testid="button-search-documents"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {isSearchingDocument ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>

              {documentSearchResult && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-4">Search Result</h3>
                  {renderKycUserCard(documentSearchResult, false)}
                </div>
              )}

              {documentSearchResult === null && documentSearchId && !isSearchingDocument && (
                <div className="text-center py-8">
                  <FileSearch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No user found with that ID.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}