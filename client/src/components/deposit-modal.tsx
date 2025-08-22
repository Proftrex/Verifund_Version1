import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet, CreditCard, Smartphone, Building } from "lucide-react";

interface ConversionQuote {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  exchangeRate: number;
  fee: number;
  totalCost: number;
}

const paymentMethods = [
  { value: "gcash", label: "GCash", icon: Smartphone },
  { value: "card", label: "Credit/Debit Card", icon: CreditCard },
];

export function DepositModal() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [quote, setQuote] = useState<ConversionQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const { toast } = useToast();

  // Get conversion quote
  const getQuoteMutation = useMutation({
    mutationFn: async (depositAmount: string) => {
      const response = await apiRequest("POST", "/api/conversions/quote", {
        amount: depositAmount,
        fromCurrency: "PHP",
        toCurrency: "PHP",
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setQuote(data);
      setIsLoadingQuote(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to get conversion quote",
        variant: "destructive",
      });
      setIsLoadingQuote(false);
    },
  });

  // Create deposit
  const createDepositMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/deposits/create", {
        amount: amount,
        paymentMethod: paymentMethod,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("PayMongo Payment Intent Response:", data.paymentIntent);
      
      // Check if PayMongo returned a redirect URL for payment
      if (data.paymentIntent.nextAction?.redirect?.url) {
        toast({
          title: "Redirecting to Payment",
          description: "Opening PayMongo payment page...",
        });
        
        // Open PayMongo payment page in a new window
        const paymentWindow = window.open(
          data.paymentIntent.nextAction.redirect.url,
          'paymongo-payment',
          'width=600,height=800,scrollbars=yes,resizable=yes'
        );
        
        if (!paymentWindow) {
          // If popup blocked, redirect in same window
          window.location.href = data.paymentIntent.nextAction.redirect.url;
        }
        
      } else {
        toast({
          title: "Payment Created",
          description: "Payment intent created. Please check your notifications for payment instructions.",
        });
      }
      
      // Reset form
      setAmount("");
      setPaymentMethod("");
      setQuote(null);
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create deposit",
        variant: "destructive",
      });
    },
  });

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setQuote(null);
    
    if (value && parseFloat(value) > 0) {
      setIsLoadingQuote(true);
      getQuoteMutation.mutate(value);
    }
  };

  const handleDeposit = () => {
    if (!amount || !paymentMethod || !quote) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    createDepositMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" data-testid="button-deposit">
          <Wallet className="w-4 h-4" />
          Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit PHP to PHP</DialogTitle>
          <DialogDescription>
            Convert Philippine Pesos to PHP cryptocurrency
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (PHP)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              min="1"
              step="0.01"
              data-testid="input-deposit-amount"
            />
          </div>

          {/* Conversion Quote */}
          {(isLoadingQuote || quote) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Conversion Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingQuote ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calculating conversion...
                  </div>
                ) : quote ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Amount:</span>
                      <span>₱{quote.fromAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Exchange Rate:</span>
                      <span>1 PHP = {quote.exchangeRate} PHP</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Fees:</span>
                      <span>₱{quote.fee.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Cost:</span>
                      <span>₱{quote.totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium text-primary">
                      <span>You'll Receive:</span>
                      <span>{quote.toAmount.toLocaleString()} PHP</span>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue placeholder="Choose payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Info */}
          {paymentMethod && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">
                    {paymentMethods.find(m => m.value === paymentMethod)?.label}
                  </Badge>
                  <span className="text-muted-foreground">
                    {paymentMethod === "gcash" && "Pay with your GCash wallet"}
                    {paymentMethod === "card" && "Pay with credit or debit card"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              data-testid="button-cancel-deposit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeposit}
              disabled={!amount || !paymentMethod || !quote || createDepositMutation.isPending}
              className="flex-1"
              data-testid="button-confirm-deposit"
            >
              {createDepositMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Deposit ₱" + (quote?.totalCost.toLocaleString() || amount)
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}