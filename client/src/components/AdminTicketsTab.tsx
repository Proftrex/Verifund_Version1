import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Clock, User, Calendar, Tag, AlertCircle, CheckCircle, XCircle, FileText, Mail, Paperclip, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { SupportTicket } from "@shared/schema";

interface TicketWithUser extends SupportTicket {
  userFirstName?: string | null;
  userLastName?: string | null;
  userEmail?: string | null;
}

export default function AdminTicketsTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<TicketWithUser | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  // Check user role
  const isAdmin = (user as any)?.isAdmin;
  const isSupport = (user as any)?.isSupport;

  // Fetch all tickets
  const { data: tickets = [], isLoading } = useQuery<TicketWithUser[]>({
    queryKey: ["/api/admin/support/tickets"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch ticket analytics
  const { data: analytics } = useQuery({
    queryKey: ["/api/admin/support/analytics"],
  });

  // Fetch support staff list for assignment (only for admins)
  const { data: supportStaff = [] } = useQuery({
    queryKey: ["/api/admin/support/staff"],
    enabled: isAdmin,
  });

  // Claim ticket mutation
  const claimTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return await apiRequest("POST", `/api/admin/support/tickets/${ticketId}/claim`, {});
    },
    onSuccess: () => {
      toast({
        title: "Ticket Claimed",
        description: "You have successfully claimed this support ticket.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      if (selectedTicket) {
        // Refresh selected ticket details
        queryClient.invalidateQueries({ 
          queryKey: [`/api/admin/support/tickets/${selectedTicket.id}`] 
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to claim ticket",
        variant: "destructive",
      });
    },
  });

  // Assign ticket mutation
  const assignTicketMutation = useMutation({
    mutationFn: async ({ ticketId, assigneeId }: { ticketId: string; assigneeId: string }) => {
      return await apiRequest("POST", `/api/admin/support/tickets/${ticketId}/assign`, {
        assigneeId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Ticket Assigned",
        description: "The ticket has been successfully assigned to a support staff member.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign ticket",
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status, notes }: { ticketId: string; status: string; notes?: string }) => {
      return await apiRequest("PUT", `/api/admin/support/tickets/${ticketId}/status`, {
        status,
        resolutionNotes: notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Ticket status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      setResolutionNotes("");
      setNewStatus("");
      setSelectedTicket(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket status",
        variant: "destructive",
      });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800 border-blue-200";
      case "claimed": return "bg-purple-100 text-purple-800 border-purple-200";
      case "in_progress": return "bg-orange-100 text-orange-800 border-orange-200";
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      case "closed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="h-4 w-4" />;
      case "claimed": return <User className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      case "closed": return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatAttachments = (attachments: string | null) => {
    if (!attachments) return [];
    try {
      return JSON.parse(attachments);
    } catch {
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold">{analytics.total}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.open}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Claimed</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics.claimed}</p>
                </div>
                <User className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.resolved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="claimed">Claimed</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <TicketList 
            tickets={tickets} 
            onSelectTicket={setSelectedTicket} 
            onClaim={claimTicketMutation.mutate}
            onAssign={assignTicketMutation.mutate}
            supportStaff={supportStaff}
            isAdmin={isAdmin}
            isSupport={isSupport}
          />
        </TabsContent>

        <TabsContent value="open" className="space-y-4">
          <TicketList 
            tickets={tickets.filter(t => t.status === 'open')} 
            onSelectTicket={setSelectedTicket} 
            onClaim={claimTicketMutation.mutate}
            onAssign={assignTicketMutation.mutate}
            supportStaff={supportStaff}
            isAdmin={isAdmin}
            isSupport={isSupport}
          />
        </TabsContent>

        <TabsContent value="claimed" className="space-y-4">
          <TicketList 
            tickets={tickets.filter(t => t.status === 'claimed' || t.status === 'assigned' || t.status === 'pending' || t.status === 'on_progress')} 
            onSelectTicket={setSelectedTicket} 
            onClaim={claimTicketMutation.mutate}
            onAssign={assignTicketMutation.mutate}
            supportStaff={supportStaff}
            isAdmin={isAdmin}
            isSupport={isSupport}
          />
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <TicketList 
            tickets={tickets.filter(t => t.status === 'resolved' || t.status === 'closed')} 
            onSelectTicket={setSelectedTicket} 
            onClaim={claimTicketMutation.mutate}
            onAssign={assignTicketMutation.mutate}
            supportStaff={supportStaff}
            isAdmin={isAdmin}
            isSupport={isSupport}
          />
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          resolutionNotes={resolutionNotes}
          setResolutionNotes={setResolutionNotes}
          newStatus={newStatus}
          setNewStatus={setNewStatus}
          onClose={() => setSelectedTicket(null)}
          onUpdateStatus={updateStatusMutation.mutate}
          isUpdating={updateStatusMutation.isPending}
          getPriorityColor={getPriorityColor}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          formatAttachments={formatAttachments}
        />
      )}
    </div>
  );
}

interface TicketListProps {
  tickets: TicketWithUser[];
  onSelectTicket: (ticket: TicketWithUser) => void;
  onClaim: (ticketId: string) => void;
  onAssign: (params: { ticketId: string; assigneeId: string }) => void;
  supportStaff: any[];
  isAdmin: boolean;
  isSupport: boolean;
}

function TicketList({ tickets, onSelectTicket, onClaim, onAssign, supportStaff, isAdmin, isSupport }: TicketListProps) {
  const [assignmentDropdown, setAssignmentDropdown] = useState<string | null>(null);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800 border-blue-200";
      case "claimed": return "bg-purple-100 text-purple-800 border-purple-200";
      case "assigned": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "pending": return "bg-purple-100 text-purple-800 border-purple-200";
      case "in_progress": return "bg-orange-100 text-orange-800 border-orange-200";
      case "on_progress": return "bg-orange-100 text-orange-800 border-orange-200";
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      case "closed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No tickets found in this category.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{ticket.ticketNumber}</h3>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority?.toUpperCase()}
                  </Badge>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                
                <h4 className="font-medium text-gray-900 mb-2">{ticket.subject}</h4>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {ticket.userFirstName && ticket.userLastName 
                      ? `${ticket.userFirstName} ${ticket.userLastName}`
                      : ticket.userEmail
                    }
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDistanceToNow(new Date(ticket.createdAt!), { addSuffix: true })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    {ticket.category?.replace('_', ' ')}
                  </div>
                  {ticket.emailDelivered && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Mail className="h-4 w-4" />
                      Email sent
                    </div>
                  )}
                </div>

                <p className="text-gray-700 line-clamp-2">{ticket.message}</p>
                
                {/* Show claimed/assigned information */}
                {(ticket.claimedByEmail || ticket.assignedTo) && (
                  <div className="mt-2 text-sm text-blue-600">
                    {ticket.claimedByEmail && (
                      <p>👤 Claimed by: {ticket.claimedByEmail}</p>
                    )}
                    {ticket.assignedTo && (
                      <p>🎯 Assigned to: {ticket.assignedTo}</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectTicket(ticket)}
                  data-testid={`button-view-ticket-${ticket.ticketNumber}`}
                >
                  View Details
                </Button>
                
                {/* Role-based actions for open tickets */}
                {ticket.status === 'open' && (
                  <>
                    {/* Support Staff: Show CLAIM button */}
                    {isSupport && !isAdmin && (
                      <Button
                        size="sm"
                        onClick={() => onClaim(ticket.id)}
                        data-testid={`button-claim-ticket-${ticket.ticketNumber}`}
                      >
                        Claim
                      </Button>
                    )}
                    
                    {/* Admin: Show ASSIGN dropdown */}
                    {isAdmin && (
                      <div className="relative">
                        {assignmentDropdown === ticket.id ? (
                          <div className="flex items-center gap-2">
                            <Select
                              onValueChange={(assigneeId) => {
                                onAssign({ ticketId: ticket.id, assigneeId });
                                setAssignmentDropdown(null);
                              }}
                            >
                              <SelectTrigger className="w-40" data-testid={`select-assign-${ticket.ticketNumber}`}>
                                <SelectValue placeholder="Select staff" />
                              </SelectTrigger>
                              <SelectContent>
                                {supportStaff.map((staff: any) => (
                                  <SelectItem key={staff.id} value={staff.id}>
                                    {staff.firstName} {staff.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAssignmentDropdown(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setAssignmentDropdown(ticket.id)}
                            data-testid={`button-assign-ticket-${ticket.ticketNumber}`}
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Assign
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface TicketDetailModalProps {
  ticket: TicketWithUser;
  resolutionNotes: string;
  setResolutionNotes: (notes: string) => void;
  newStatus: string;
  setNewStatus: (status: string) => void;
  onClose: () => void;
  onUpdateStatus: (params: { ticketId: string; status: string; notes?: string }) => void;
  isUpdating: boolean;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  formatAttachments: (attachments: string | null) => string[];
}

function TicketDetailModal({
  ticket,
  resolutionNotes,
  setResolutionNotes,
  newStatus,
  setNewStatus,
  onClose,
  onUpdateStatus,
  isUpdating,
  getPriorityColor,
  getStatusColor,
  getStatusIcon,
  formatAttachments,
}: TicketDetailModalProps) {
  const attachments = formatAttachments(ticket.attachments);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                {ticket.ticketNumber}
              </CardTitle>
              <CardDescription className="mt-2">
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority?.toUpperCase()}
                  </Badge>
                  <Badge className={getStatusColor(ticket.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(ticket.status)}
                      {ticket.status?.replace('_', ' ').toUpperCase()}
                    </div>
                  </Badge>
                </div>
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose} data-testid="button-close-ticket-modal">
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Ticket Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Subject</Label>
              <p className="text-gray-900">{ticket.subject}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Category</Label>
              <p className="text-gray-900">{ticket.category?.replace('_', ' ')}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Submitted By</Label>
              <p className="text-gray-900">
                {ticket.userFirstName && ticket.userLastName 
                  ? `${ticket.userFirstName} ${ticket.userLastName} (${ticket.userEmail})`
                  : ticket.userEmail
                }
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Submitted</Label>
              <p className="text-gray-900">
                {formatDistanceToNow(new Date(ticket.createdAt!), { addSuffix: true })}
              </p>
            </div>
            
            {/* Claimed/Assigned Information */}
            {ticket.claimedByEmail && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Claimed By</Label>
                <p className="text-gray-900">{ticket.claimedByEmail}</p>
                {ticket.claimedAt && (
                  <p className="text-sm text-gray-500">
                    Claimed {formatDistanceToNow(new Date(ticket.claimedAt), { addSuffix: true })}
                  </p>
                )}
              </div>
            )}
            
            {ticket.assignedTo && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Assigned To</Label>
                <p className="text-gray-900">{ticket.assignedTo}</p>
                {ticket.assignedAt && (
                  <p className="text-sm text-gray-500">
                    Assigned {formatDistanceToNow(new Date(ticket.assignedAt), { addSuffix: true })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Related IDs Section */}
          {(ticket.relatedCampaignId || ticket.relatedTransactionId || ticket.relatedUserId) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Label className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Referenced IDs for Support Context
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                {ticket.relatedCampaignId && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-medium">Campaign:</span>
                    <code className="bg-white px-2 py-1 rounded border text-blue-800 font-mono text-xs">
                      {ticket.relatedCampaignId}
                    </code>
                  </div>
                )}
                {ticket.relatedTransactionId && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-medium">Transaction:</span>
                    <code className="bg-white px-2 py-1 rounded border text-blue-800 font-mono text-xs">
                      {ticket.relatedTransactionId}
                    </code>
                  </div>
                )}
                {ticket.relatedUserId && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-medium">User:</span>
                    <code className="bg-white px-2 py-1 rounded border text-blue-800 font-mono text-xs">
                      {ticket.relatedUserId}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <Label className="text-sm font-medium text-gray-600">Message</Label>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <p className="whitespace-pre-wrap text-gray-900">{ticket.message}</p>
            </div>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Attachments</Label>
              <div className="mt-2 space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Paperclip className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{attachment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Actions */}
          {ticket.status !== 'closed' && (
            <div className="border-t pt-6">
              <Label className="text-lg font-medium text-gray-900">Admin Actions</Label>
              
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="status-select">Update Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="mt-1" data-testid="select-ticket-status">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="on_progress">On Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="resolution-notes">Resolution Notes</Label>
                  <Textarea
                    id="resolution-notes"
                    placeholder="Add notes about the resolution or next steps..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="mt-1 min-h-[100px]"
                    data-testid="textarea-resolution-notes"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    data-testid="button-cancel-update"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => onUpdateStatus({
                      ticketId: ticket.id,
                      status: newStatus,
                      notes: resolutionNotes || undefined,
                    })}
                    disabled={!newStatus || isUpdating}
                    data-testid="button-update-ticket-status"
                  >
                    {isUpdating ? "Updating..." : "Update Status"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}