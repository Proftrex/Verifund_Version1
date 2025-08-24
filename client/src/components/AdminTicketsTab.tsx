import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Clock, User, Calendar, Tag, AlertCircle, CheckCircle, XCircle, FileText, Mail, Paperclip } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { SupportTicket } from "@shared/schema";

interface TicketWithUser extends SupportTicket {
  userFirstName?: string | null;
  userLastName?: string | null;
  userEmail?: string | null;
}

export default function AdminTicketsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<TicketWithUser | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  // Fetch all tickets
  const { data: tickets = [], isLoading } = useQuery<TicketWithUser[]>({
    queryKey: ["/api/admin/support/tickets"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch ticket analytics
  const { data: analytics } = useQuery({
    queryKey: ["/api/admin/support/analytics"],
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
          <TicketList tickets={tickets} onSelectTicket={setSelectedTicket} onClaim={claimTicketMutation.mutate} />
        </TabsContent>

        <TabsContent value="open" className="space-y-4">
          <TicketList 
            tickets={tickets.filter(t => t.status === 'open')} 
            onSelectTicket={setSelectedTicket} 
            onClaim={claimTicketMutation.mutate} 
          />
        </TabsContent>

        <TabsContent value="claimed" className="space-y-4">
          <TicketList 
            tickets={tickets.filter(t => t.status === 'claimed' || t.status === 'in_progress')} 
            onSelectTicket={setSelectedTicket} 
            onClaim={claimTicketMutation.mutate} 
          />
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <TicketList 
            tickets={tickets.filter(t => t.status === 'resolved' || t.status === 'closed')} 
            onSelectTicket={setSelectedTicket} 
            onClaim={claimTicketMutation.mutate} 
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
}

function TicketList({ tickets, onSelectTicket, onClaim }: TicketListProps) {
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
                {ticket.status === 'open' && (
                  <Button
                    size="sm"
                    onClick={() => onClaim(ticket.id)}
                    data-testid={`button-claim-ticket-${ticket.ticketNumber}`}
                  >
                    Claim
                  </Button>
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
          </div>

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
                      <SelectItem value="claimed">Claimed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
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