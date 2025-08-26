import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, FileText, ExternalLink, AlertTriangle } from 'lucide-react';

interface ReportDetailsProps {
  report: any;
  onClose: () => void;
  onUpdateStatus: (reportId: string, status: string, adminNotes?: string) => void;
}

export const ReportDetails = ({ report, onClose, onUpdateStatus }: ReportDetailsProps) => {
  const isImageFile = (url: string): boolean => {
    if (!url) return false;
    const extension = url.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  };

  const isPdfFile = (url: string): boolean => {
    if (!url) return false;
    const extension = url.split('.').pop()?.toLowerCase() || '';
    return extension === 'pdf';
  };

  const isVideoFile = (url: string): boolean => {
    if (!url) return false;
    const extension = url.split('.').pop()?.toLowerCase() || '';
    return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Report Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Report Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📋 Report Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Report ID</label>
                  <p className="text-sm font-mono">{report.id || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Report Type</label>
                  <p className="text-sm">
                    <Badge variant="outline">{report.reportType || report.type || 'Unknown'}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-sm">
                    <Badge variant={report.status === 'pending' ? 'destructive' : report.status === 'validated' ? 'default' : 'secondary'}>
                      {report.status || 'pending'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Submitted Date</label>
                  <p className="text-sm">{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
              </div>

              {/* Report Description */}
              {report.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Report Details</label>
                  <div className="text-sm bg-gray-50 p-4 rounded-lg mt-2 max-h-32 overflow-y-auto">
                    {report.description}
                  </div>
                </div>
              )}

              {/* Evidence Files */}
              {report.evidenceUrls && report.evidenceUrls.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Evidence Files</label>
                  <div className="mt-2 space-y-2">
                    {report.evidenceUrls.map((url: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          {isImageFile(url) && <span>🖼️</span>}
                          {isPdfFile(url) && <span>📄</span>}
                          {isVideoFile(url) && <span>🎥</span>}
                          <span className="text-sm">{url}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (report.id) {
                              window.open(`/api/admin/fraud-reports/${report.id}/evidence/${encodeURIComponent(url)}`, '_blank');
                            }
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Entity Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔗 Related Entities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Reporter User Profile Link */}
              {report.reporterId && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reporter User Profile:</label>
                    <p className="text-xs text-gray-500">View user who submitted this report</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/profile/${report.reporterId}`, '_blank')}
                  >
                    <User className="h-3 w-3 mr-1" />
                    View Profile
                  </Button>
                </div>
              )}

              {/* Reported Campaign Details Link */}
              {(report.relatedType === 'campaign' && report.relatedId) && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reported Campaign Details:</label>
                    <p className="text-xs text-gray-500">View reported campaign</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/campaign/${report.relatedId}`, '_blank')}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View Campaign
                  </Button>
                </div>
              )}

              {/* Campaign Creator Profile Link */}
              {report.campaign?.creatorId && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Campaign Creator Profile:</label>
                    <p className="text-xs text-gray-500">
                      {report.campaign?.title ? `Creator of "${report.campaign.title}"` : 'View campaign creator'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/profile/${report.campaign.creatorId}`, '_blank')}
                  >
                    <User className="h-3 w-3 mr-1" />
                    View Creator
                  </Button>
                </div>
              )}

              {/* Reported User Profile Link (if different from campaign creator) */}
              {report.relatedType === 'creator' && report.relatedId && report.relatedId !== report.campaign?.creatorId && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reported User Profile:</label>
                    <p className="text-xs text-gray-500">View reported user details</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/profile/${report.relatedId}`, '_blank')}
                  >
                    <User className="h-3 w-3 mr-1" />
                    View Profile
                  </Button>
                </div>
              )}

              {/* Progress Report Document Link */}
              {report.documentId && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reported Document:</label>
                    <p className="text-xs text-gray-500">View reported progress report document</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/documents/${report.documentId}`, '_blank')}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View Document
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Administrative Actions */}
          <div className="border-t pt-4 flex gap-3">
            <Button
              variant="outline"
              onClick={() => onUpdateStatus(report.id, 'validated', 'Report validated after review')}
            >
              Validate Report
            </Button>
            <Button
              variant="destructive"
              onClick={() => onUpdateStatus(report.id, 'rejected', 'Report rejected after review')}
            >
              Reject Report
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};