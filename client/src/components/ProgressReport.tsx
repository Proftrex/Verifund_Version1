import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ObjectUploader } from '@/components/ObjectUploader';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { 
  FileText, 
  Image, 
  Video, 
  Receipt, 
  FileCheck, 
  File, 
  Calendar,
  Star,
  Trash2,
  Plus
} from 'lucide-react';

interface ProgressReport {
  id: string;
  campaignId: string;
  createdById: string;
  title: string;
  description: string | null;
  reportDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
  documents: ProgressReportDocument[];
  creditScore: {
    scorePercentage: number;
    completedDocumentTypes: string[];
    totalRequiredTypes: number;
  } | null;
}

interface ProgressReportDocument {
  id: string;
  progressReportId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  description: string | null;
  createdAt: string;
}

interface ProgressReportProps {
  campaignId: string;
  isCreator: boolean;
}

const reportFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().optional(),
  reportDate: z.string().min(1, 'Report date is required'),
});

const documentTypes = [
  { value: 'image', label: 'Images', icon: Image, color: 'bg-blue-100 text-blue-800' },
  { value: 'video_link', label: 'Video Links', icon: Video, color: 'bg-purple-100 text-purple-800' },
  { value: 'official_receipt', label: 'Official Receipts', icon: Receipt, color: 'bg-green-100 text-green-800' },
  { value: 'acknowledgement_receipt', label: 'Acknowledgement Receipts', icon: FileCheck, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'expense_summary', label: 'Expense Summary', icon: FileText, color: 'bg-red-100 text-red-800' },
  { value: 'invoice', label: 'Invoices', icon: File, color: 'bg-orange-100 text-orange-800' },
  { value: 'contract', label: 'Contracts', icon: FileText, color: 'bg-indigo-100 text-indigo-800' },
  { value: 'other', label: 'Other Documents', icon: File, color: 'bg-gray-100 text-gray-800' },
];

export default function ProgressReport({ campaignId, isCreator }: ProgressReportProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [showVideoLinkForm, setShowVideoLinkForm] = useState(false);
  const [videoLinkUrl, setVideoLinkUrl] = useState('');

  const form = useForm<z.infer<typeof reportFormSchema>>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      title: '',
      description: '',
      reportDate: new Date().toISOString().split('T')[0],
    },
  });

  // Fetch progress reports
  const { data: reports = [], isLoading } = useQuery<ProgressReport[]>({
    queryKey: ['/api/campaigns', campaignId, 'progress-reports'],
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reportFormSchema>) => {
      return apiRequest('POST', `/api/campaigns/${campaignId}/progress-reports`, data);
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'progress-reports'] });
      toast({
        title: 'Progress report created',
        description: 'Your progress report has been created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: { 
      reportId: string; 
      documentType: string; 
      fileName: string; 
      fileUrl: string; 
      fileSize?: number; 
      mimeType?: string;
      description?: string; 
    }) => {
      return apiRequest('POST', `/api/progress-reports/${data.reportId}/documents`, {
        documentType: data.documentType,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        description: data.description,
      });
    },
    onSuccess: () => {
      setIsUploadModalOpen(false);
      setSelectedReportId(null);
      setSelectedDocumentType('');
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'progress-reports'] });
      toast({
        title: 'Document uploaded',
        description: 'Your document has been uploaded successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleUploadDocument = async (reportId: string, documentType: string) => {
    setSelectedReportId(reportId);
    setSelectedDocumentType(documentType);
    
    if (documentType === 'video_link') {
      setShowVideoLinkForm(true);
    } else {
      setIsUploadModalOpen(true);
    }
  };

  const handleGetUploadParameters = async () => {
    const response = await fetch('/api/objects/upload', {
      method: 'POST',
      credentials: 'include',
    });
    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (files: { uploadURL: string; name: string }[]) => {
    if (files.length > 0) {
      const uploadedFile = files[0]; // Take the first file
      uploadDocumentMutation.mutate({
        reportId: selectedReportId!,
        documentType: selectedDocumentType,
        fileName: uploadedFile.name,
        fileUrl: uploadedFile.uploadURL,
      });
    }
  };

  const handleVideoLinkSubmit = () => {
    if (videoLinkUrl && selectedReportId) {
      uploadDocumentMutation.mutate({
        reportId: selectedReportId,
        documentType: 'video_link',
        fileName: `Video: ${videoLinkUrl}`,
        fileUrl: videoLinkUrl,
      });
      setShowVideoLinkForm(false);
      setVideoLinkUrl('');
    }
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getDocumentTypeInfo = (type: string) => {
    return documentTypes.find(dt => dt.value === type) || documentTypes[documentTypes.length - 1];
  };

  const renderCreditScoreCard = (creditScore: any) => {
    if (!creditScore) return null;
    
    const percentage = creditScore.scorePercentage;
    const completed = creditScore.completedDocumentTypes.length;
    const total = creditScore.totalRequiredTypes;

    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-yellow-500" />
            Credit Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">{percentage}%</span>
              <Badge variant={percentage === 100 ? 'default' : 'secondary'}>
                {completed}/{total} Document Types
              </Badge>
            </div>
            <Progress value={percentage} className="h-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Complete all {total} document types to achieve 100% credit score and attract more contributors
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const onSubmit = (data: z.infer<typeof reportFormSchema>) => {
    createReportMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2 mt-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="progress-report-section">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            📊 Progress Reports
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Campaign creators can upload documentation to build trust and transparency
          </p>
        </div>
        {isCreator && isAuthenticated && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" data-testid="button-create-report">
                <Plus className="h-4 w-4" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Progress Report</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Week 1 Progress Update" 
                            {...field} 
                            data-testid="input-report-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of this report..." 
                            className="min-h-[80px]"
                            {...field} 
                            data-testid="textarea-report-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reportDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            data-testid="input-report-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createReportMutation.isPending}>
                      {createReportMutation.isPending ? 'Creating...' : 'Create Report'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No Progress Reports Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              {isCreator 
                ? "Create your first progress report to build trust with contributors" 
                : "The campaign creator hasn't shared any progress reports yet"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      {report.title}
                    </CardTitle>
                    <CardDescription>
                      Report Date: {format(new Date(report.reportDate), 'MMMM d, yyyy')}
                    </CardDescription>
                    {report.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {report.description}
                      </p>
                    )}
                  </div>
                  {report.creditScore && renderCreditScoreCard(report.creditScore)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Document Types Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {documentTypes.map((docType) => {
                      const hasDocuments = report.documents.some(doc => doc.documentType === docType.value);
                      const docCount = report.documents.filter(doc => doc.documentType === docType.value).length;
                      const IconComponent = docType.icon;

                      return (
                        <div
                          key={docType.value}
                          className={`relative border rounded-lg p-3 transition-all ${
                            hasDocuments
                              ? 'border-green-200 bg-green-50 dark:bg-green-900/10'
                              : 'border-gray-200 bg-gray-50 dark:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <IconComponent className={`h-4 w-4 ${hasDocuments ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className={`text-xs font-medium ${hasDocuments ? 'text-green-700' : 'text-gray-500'}`}>
                              {docType.label}
                            </span>
                          </div>
                          {hasDocuments && (
                            <Badge variant="secondary" className="text-xs">
                              {docCount} file{docCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                          {isCreator && isAuthenticated && (
                            <Button
                              size="sm"
                              variant={hasDocuments ? "secondary" : "default"}
                              className="w-full mt-2 text-xs"
                              onClick={() => handleUploadDocument(report.id, docType.value)}
                              data-testid={`button-upload-${docType.value}`}
                            >
                              {hasDocuments ? 'Add More' : 'Upload'}
                            </Button>
                          )}
                          {!isCreator && hasDocuments && (
                            <Badge variant="outline" className="w-full mt-2 text-xs">
                              Verified ✓
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Documents List */}
                  {report.documents.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Uploaded Documents</h4>
                      <div className="space-y-2">
                        {report.documents.map((document) => {
                          const docTypeInfo = getDocumentTypeInfo(document.documentType);
                          const IconComponent = docTypeInfo.icon;

                          return (
                            <div
                              key={document.id}
                              className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <IconComponent className="h-4 w-4 text-gray-500" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {document.fileName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {docTypeInfo.label}
                                    {document.fileSize && ` • ${Math.round(document.fileSize / 1024)}KB`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => window.open(document.fileUrl, '_blank')}
                                    data-testid={`button-view-${document.id}`}
                                  >
                                    View
                                  </Button>
                                </div>
                              </div>
                              
                              {document.documentType === 'video_link' && (
                                <div className="mt-2">
                                  {getYouTubeVideoId(document.fileUrl) ? (
                                    <div className="aspect-video">
                                      <iframe
                                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(document.fileUrl)}`}
                                        className="w-full h-full rounded"
                                        allowFullScreen
                                        title={document.fileName}
                                      />
                                    </div>
                                  ) : (
                                    <a 
                                      href={document.fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline break-all text-xs"
                                    >
                                      {document.fileUrl}
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Upload {selectedDocumentType && getDocumentTypeInfo(selectedDocumentType).label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload documents to increase your credit score and build trust with contributors.
            </p>
            <ObjectUploader
              maxNumberOfFiles={5}
              maxFileSize={50 * 1024 * 1024} // 50MB
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Select Files</span>
              </div>
            </ObjectUploader>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Link Form Dialog */}
      <Dialog open={showVideoLinkForm} onOpenChange={setShowVideoLinkForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Video Link</DialogTitle>
            <DialogDescription>
              Add a YouTube video link to showcase your progress.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Video URL (YouTube)
              </label>
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoLinkUrl}
                onChange={(e) => setVideoLinkUrl(e.target.value)}
                data-testid="input-video-url"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVideoLinkForm(false);
                  setVideoLinkUrl('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleVideoLinkSubmit}
                disabled={!videoLinkUrl}
                data-testid="button-submit-video-link"
              >
                Add Video Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}