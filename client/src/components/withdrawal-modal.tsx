import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowUpRight, Wallet, Smartphone, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function WithdrawalModal() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [conversionQuote, setConversionQuote] = useState<any>(null);
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const [accountDetails, setAccountDetails] = useState("");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getQuoteMutation = useMutation({
    mutationFn: async (pusoAmount: string) => {
      setIsGettingQuote(true);
      console.log('💱 Requesting quote for:', pusoAmount, 'PUSO');
      return await apiRequest("POST", "/api/conversions/quote", {
        amount: pusoAmount,
        fromCurrency: "PUSO",
        toCurrency: "PHP",
      });
    },
    onSuccess: (data) => {
      console.log('✅ Quote received:', data);
      console.log('📊 Fee details:', {
        fee: data.fee,
        feeType: typeof data.fee,
        feeString: String(data.fee),
        parsedFee: parseFloat(data.fee || '0')
      });
      setConversionQuote(data);
      setIsGettingQuote(false);
    },
    onError: (error) => {
      console.error('❌ Quote failed:', error);
      setIsGettingQuote(false);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      
      // Parse error message properly
      let errorMessage = "Failed to get conversion quote";
      try {
        if (error && typeof error === 'object' && 'message' in error) {
          const errorData = JSON.parse((error as any).message.split(': ')[1] || '{}');
          errorMessage = errorData.message || errorMessage;
        }
      } catch (e) {
        errorMessage = (error as any)?.message || errorMessage;
      }
      
      toast({
        title: "Quote Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: async (withdrawalData: any) => {
      console.log('🏦 Creating withdrawal:', withdrawalData);
      return await apiRequest("POST", "/api/withdrawals/create", withdrawalData);
    },
    onSuccess: (data) => {
      console.log('✅ Withdrawal created:', data);
      toast({
        title: "Withdrawal Request Submitted! 🎉",
        description: "Your withdrawal request has been submitted for processing.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/user"] });
      setOpen(false);
      setAmount("");
      setConversionQuote(null);
      setAccountDetails("");
      setPaymentMethod("gcash");
    },
    onError: (error) => {
      console.error('❌ Withdrawal failed:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      
      // Parse error message properly
      let errorMessage = "Failed to create withdrawal";
      try {
        if (error && typeof error === 'object' && 'message' in error) {
          const errorData = JSON.parse((error as any).message.split(': ')[1] || '{}');
          errorMessage = errorData.message || errorMessage;
        }
      } catch (e) {
        errorMessage = (error as any)?.message || errorMessage;
      }
      
      toast({
        title: "Withdrawal Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setConversionQuote(null);
    
    if (value && parseFloat(value) > 0) {
      getQuoteMutation.mutate(value);
    }
  };

  const handleWithdrawal = () => {
    if (!conversionQuote) return;
    
    withdrawalMutation.mutate({
      amount: amount,
      paymentMethod: paymentMethod,
      accountDetails: accountDetails,
    });
  };

  const userBalance = parseFloat(user?.pusoBalance || "0");
  const maxWithdrawal = userBalance;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start" data-testid="button-withdraw-puso">
          <ArrowUpRight className="w-4 h-4 mr-2" />
          Withdraw PUSO
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Withdraw PUSO Tokens
          </DialogTitle>
          <DialogDescription>
            Convert your PUSO tokens back to Philippine Peso and withdraw to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Balance */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Available Balance:</span>
              <span className="text-lg font-bold text-primary">
                ₱{userBalance.toLocaleString()} PUSO
              </span>
            </div>
          </div>

          {/* KYC Check */}
          {user?.kycStatus !== "verified" && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>KYC Required:</strong> Complete your identity verification to enable withdrawals.
              </AlertDescription>
            </Alert>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount (PUSO)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              max={maxWithdrawal}
              min="100"
              disabled={user?.kycStatus !== "verified"}
              data-testid="input-withdrawal-amount"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum: ₱100</span>
              <span>Maximum: ₱{maxWithdrawal.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Withdrawal Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue placeholder="Choose withdrawal method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gcash">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    <span>GCash</span>
                  </div>
                </SelectItem>
                <SelectItem value="bank_transfer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Bank Transfer</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account Details */}
          <div className="space-y-2">
            <Label htmlFor="accountDetails">
              {paymentMethod === "gcash" ? "GCash Mobile Number" : "Bank Account Details"}
            </Label>
            <Input
              id="accountDetails"
              type="text"
              placeholder={
                paymentMethod === "gcash" 
                  ? "09XXXXXXXXX" 
                  : "Account Number / IBAN"
              }
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              disabled={user?.kycStatus !== "verified"}
              data-testid="input-account-details"
            />
            <p className="text-xs text-muted-foreground">
              {paymentMethod === "gcash" 
                ? "Enter your GCash registered mobile number" 
                : "Enter your complete bank account information"}
            </p>
          </div>

          {/* Conversion Preview */}
          {isGettingQuote && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Getting quote...</span>
            </div>
          )}

          {conversionQuote && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">You withdraw:</span>
                    <span className="font-bold">₱{parseFloat(conversionQuote.fromAmount || amount || '0').toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PUSO</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Exchange rate:</span>
                    <span>₱{parseFloat(conversionQuote.exchangeRate || '1').toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP per PUSO</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Withdrawal fee:</span>
                    <span>₱{parseFloat(conversionQuote.fee || '0').toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <hr className="border-green-300" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">You receive:</span>
                    <span className="text-lg font-bold text-green-700">
                      ₱{parseFloat(conversionQuote.toAmount || '0').toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PHP
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Withdrawal processing may take 1-3 business days. Make sure your account details are correct.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleWithdrawal}
            disabled={
              !conversionQuote ||
              withdrawalMutation.isPending ||
              user?.kycStatus !== "verified" ||
              parseFloat(amount || "0") < 100 ||
              parseFloat(amount || "0") > maxWithdrawal ||
              !accountDetails.trim()
            }
            data-testid="button-confirm-withdrawal"
          >
            {withdrawalMutation.isPending ? "Processing..." : "Withdraw"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}