import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  FileText, 
  CreditCard,
  Shield,
  Clock,
  ArrowLeft,
  ArrowRight,
  X
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCampaignSchema } from "@shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";
// Removed UploadResult import since we're using a simpler upload interface"

const campaignFormSchema = insertCampaignSchema.extend({
  goalAmount: z.string().min(1, "Goal amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Goal amount must be a positive number"
  ),
});

const steps = [
  { id: 1, title: "Basic Information", description: "Campaign details and goal" },
  { id: 2, title: "KYC Verification", description: "Identity verification" },
  { id: 3, title: "Review & Submit", description: "Final review and submission" }
];

export default function CreateCampaign() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [kycDocuments, setKycDocuments] = useState<{ [key: string]: string }>({});
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const form = useForm<z.infer<typeof campaignFormSchema>>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      goalAmount: "",
      duration: 30,
      images: "",
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Debug logging
  useEffect(() => {
    console.log("Debug - User KYC Status:", (user as any)?.kycStatus, "Type:", typeof (user as any)?.kycStatus);
  }, [user]);

  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Mutation called with data:", data);
      const response = await apiRequest("POST", "/api/campaigns", data);
      console.log("Campaign creation response:", response);
      return response;
    },
    onSuccess: (response) => {
      console.log("Campaign creation successful:", response);
      toast({
        title: "Campaign Created Successfully",
        description: "Your campaign has been submitted for review. You'll be notified once it's approved.",
      });
      setLocation("/");
    },
    onError: (error) => {
      console.error("Campaign creation error:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Campaign Creation Failed",
        description: `Error: ${error.message || 'Something went wrong. Please try again.'}`,
        variant: "destructive",
      });
    },
  });

  const submitKycMutation = useMutation({
    mutationFn: async (documents: { [key: string]: string }) => {
      return await apiRequest("POST", "/api/user/kyc", { documents });
    },
    onSuccess: () => {
      toast({
        title: "KYC Documents Submitted",
        description: "Your identity verification documents have been submitted for review.",
      });
      setCurrentStep(3);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "KYC Submission Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof campaignFormSchema>) => {
    if (currentStep === 1) {
      if ((user as any)?.kycStatus === "verified") {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
    } else if (currentStep === 3) {
      const campaignData = {
        ...data,
        images: uploadedImages.join(","),
      };
      createCampaignMutation.mutate(campaignData);
    }
  };

  const handleContinue = async () => {
    console.log("Continue button clicked");
    console.log("Form valid:", form.formState.isValid);
    console.log("Form errors:", form.formState.errors);
    
    if (currentStep === 1) {
      // For step 1, we only need title and description to continue
      const title = form.getValues('title');
      const description = form.getValues('description');
      
      if (!title || !description) {
        toast({
          title: "Missing Information",
          description: "Please fill in the campaign title and description to continue.",
          variant: "destructive",
        });
        return;
      }
      
      if ((user as any)?.kycStatus === "verified") {
        console.log("User is verified, skipping to step 3");
        setCurrentStep(3);
      } else {
        console.log("User not verified, going to step 2");
        setCurrentStep(2);
      }
    } else {
      // For other steps, use form submission
      await form.handleSubmit(onSubmit)();
    }
  };

  const handleKycSubmit = () => {
    if (Object.keys(kycDocuments).length < 2) {
      toast({
        title: "Incomplete KYC",
        description: "Please upload both valid ID and proof of address.",
        variant: "destructive",
      });
      return;
    }
    submitKycMutation.mutate(kycDocuments);
  };

  const handleFileUpload = (type: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload this to your file storage service
      // For now, we'll just store a mock URL
      const mockUrl = `https://mock-storage.com/${type}_${Date.now()}.${file.name.split('.').pop()}`;
      setKycDocuments(prev => ({ ...prev, [type]: mockUrl }));
      toast({
        title: "File Uploaded",
        description: `${type.replace('_', ' ')} uploaded successfully.`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-create-campaign-title">
            Create New Campaign
          </h1>
          <p className="text-lg text-muted-foreground">
            Start your fundraising journey with complete transparency
          </p>
        </div>

        {/* Progress Indicator */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.id 
                        ? "bg-primary text-white" 
                        : "bg-gray-200 text-gray-500"
                    }`}>
                      {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-1 mx-2 ${
                        currentStep > step.id ? "bg-primary" : "bg-gray-200"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground" data-testid="text-step-indicator">
                Step {currentStep} of {steps.length}: {steps[currentStep - 1].description}
              </div>
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-steps" />
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Campaign Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter a compelling title for your campaign"
                            {...field}
                            data-testid="input-campaign-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-campaign-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="emergency">Emergency Relief</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="community">Community Development</SelectItem>
                            <SelectItem value="environment">Environment</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="goalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Funding Goal (PHP)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="100000"
                              {...field}
                              data-testid="input-goal-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Duration</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-campaign-duration">
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="30">30 days</SelectItem>
                              <SelectItem value="60">60 days</SelectItem>
                              <SelectItem value="90">90 days</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={6}
                            placeholder="Tell your story... Why do you need funding? How will the funds be used?"
                            {...field}
                            data-testid="textarea-campaign-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Images
                    </label>
                    
                    {/* Show uploaded images */}
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {uploadedImages.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={imageUrl} 
                              alt={`Campaign image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload button */}
                    {uploadedImages.length < 5 && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Upload campaign images</p>
                        <p className="text-sm text-gray-400 mb-4">Maximum 5 images, up to 5MB each</p>
                        <ObjectUploader
                          maxNumberOfFiles={5 - uploadedImages.length}
                          maxFileSize={5242880} // 5MB
                          onGetUploadParameters={async () => {
                            const response = await apiRequest("POST", "/api/objects/upload");
                            const data = await response.json();
                            return {
                              method: "PUT" as const,
                              url: data.uploadURL,
                            };
                          }}
                          onComplete={async (uploadedFiles: { uploadURL: string; name: string }[]) => {
                            const newImageUrls: string[] = [];
                            
                            for (const file of uploadedFiles) {
                              try {
                                // Set ACL policy for the uploaded image
                                const response = await apiRequest("PUT", "/api/campaign-images", {
                                  imageURL: file.uploadURL,
                                });
                                const data = await response.json();
                                newImageUrls.push(data.objectPath);
                              } catch (error) {
                                console.error("Error setting image ACL:", error);
                                toast({
                                  title: "Image Upload Warning",
                                  description: "Image uploaded but may not be accessible. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }
                            
                            setUploadedImages(prev => [...prev, ...newImageUrls]);
                            toast({
                              title: "Images Uploaded",
                              description: `${uploadedFiles.length} image(s) uploaded successfully.`,
                            });
                          }}
                          buttonClassName="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Images
                        </ObjectUploader>
                      </div>
                    )}
                    
                    {uploadedImages.length >= 5 && (
                      <p className="text-sm text-green-600 mt-2">Maximum number of images reached (5/5)</p>
                    )}
                  </div>

                  {/* Debug KYC Status - moved to useEffect */}
                  
                  {(user as any)?.kycStatus !== "verified" && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>KYC Verification Required:</strong> To ensure transparency and prevent fraud, 
                        you'll need to complete identity verification before your campaign can go live.
                        <div className="text-xs mt-1">Current status: {(user as any)?.kycStatus || 'undefined'}</div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: KYC Verification */}
            {currentStep === 2 && (user as any)?.kycStatus !== "verified" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Identity Verification</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="border-blue-200 bg-blue-50">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      To maintain platform integrity and prevent fraud, we require identity verification 
                      for all campaign creators. This information is securely stored and used only for verification purposes.
                    </AlertDescription>
                  </Alert>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valid Government ID
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Upload your valid ID</p>
                        <p className="text-xs text-gray-400">Driver's License, Passport, or National ID</p>
                        <input 
                          type="file" 
                          accept="image/*,.pdf" 
                          onChange={(e) => handleFileUpload('valid_id', e)}
                          className="hidden" 
                          id="valid-id-upload"
                          data-testid="input-valid-id"
                        />
                        <label 
                          htmlFor="valid-id-upload" 
                          className="mt-2 inline-block cursor-pointer text-primary hover:underline"
                        >
                          Choose File
                        </label>
                        {kycDocuments.valid_id && (
                          <div className="mt-2 flex items-center justify-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">Uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proof of Address
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Upload proof of address</p>
                        <p className="text-xs text-gray-400">Utility bill, bank statement, or lease agreement</p>
                        <input 
                          type="file" 
                          accept="image/*,.pdf" 
                          onChange={(e) => handleFileUpload('proof_of_address', e)}
                          className="hidden" 
                          id="address-upload"
                          data-testid="input-proof-address"
                        />
                        <label 
                          htmlFor="address-upload" 
                          className="mt-2 inline-block cursor-pointer text-primary hover:underline"
                        >
                          Choose File
                        </label>
                        {kycDocuments.proof_of_address && (
                          <div className="mt-2 flex items-center justify-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">Uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Processing Time:</strong> KYC verification typically takes 1-3 business days. 
                      You'll receive an email notification once your documents are reviewed.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Review & Submit */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Review & Submit</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Your campaign is ready for submission! Please review all details before submitting.
                    </AlertDescription>
                  </Alert>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Campaign Details</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Title:</strong> {form.watch("title")}</div>
                        <div><strong>Category:</strong> {form.watch("category")}</div>
                        <div><strong>Goal:</strong> ₱{parseInt(form.watch("goalAmount") || "0").toLocaleString()}</div>
                        <div><strong>Duration:</strong> {form.watch("duration")} days</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Verification Status</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          {(user as any)?.kycStatus === "verified" ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                              <span className="text-sm">KYC Verified</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-yellow-600 mr-2" />
                              <span className="text-sm">KYC Pending Review</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-sm">Campaign Information Complete</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">What happens next?</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Your campaign will be reviewed by our team within 24-48 hours</li>
                      <li>• You'll receive an email notification once approved</li>
                      <li>• Once live, you can start sharing and collecting contributions</li>
                      <li>• All transactions will be recorded on the blockchain for transparency</li>
                    </ul>
                  </div>

                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                data-testid="button-previous-step"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex space-x-2">
                {currentStep === 2 && (user as any)?.kycStatus !== "verified" && (
                  <Button
                    type="button"
                    onClick={handleKycSubmit}
                    disabled={submitKycMutation.isPending || Object.keys(kycDocuments).length < 2}
                    data-testid="button-submit-kyc"
                  >
                    {submitKycMutation.isPending ? "Submitting..." : "Submit KYC"}
                  </Button>
                )}

                {currentStep !== 2 && (
                  <Button
                    type="submit"
                    disabled={createCampaignMutation.isPending}
                    data-testid="button-continue-submit"
                  >
                    {currentStep === 3 ? (
                      createCampaignMutation.isPending ? "Creating..." : "Create Campaign"
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
