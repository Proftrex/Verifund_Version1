import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Box } from "lucide-react";
import type { Transaction } from "@shared/schema";

export default function TransactionFeed() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions/recent"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 border-l-4 border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const borderColors = {
    contribution: "border-primary",
    withdrawal: "border-secondary",
    expense: "border-accent",
  };

  const iconColors = {
    contribution: "text-primary",
    withdrawal: "text-secondary", 
    expense: "text-accent",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Box className="w-5 h-5" />
          <span>Live Transaction Feed</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions && Array.isArray(transactions) && transactions.length > 0 ? (
            transactions.map((transaction: Transaction) => (
              <div
                key={transaction.id}
                className={`bg-white rounded-lg p-4 border-l-4 ${borderColors[transaction.type as keyof typeof borderColors]}`}
                data-testid={`transaction-${transaction.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Box className={`w-4 h-4 ${iconColors[transaction.type as keyof typeof iconColors]}`} />
                    <span className="font-medium text-sm">
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-semibold">
                    ₱{parseFloat(transaction.amount).toLocaleString()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2" data-testid={`transaction-description-${transaction.id}`}>
                  {transaction.description}
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="font-mono" data-testid={`transaction-hash-${transaction.id}`}>
                    Hash: {transaction.transactionHash ? transaction.transactionHash.slice(0, 10) : 'N/A'}...
                  </span>
                  <span className="mx-2">•</span>
                  <span data-testid={`transaction-time-${transaction.id}`}>
                    {new Date(transaction.createdAt!).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No transactions available</p>
            </div>
          )}
        </div>
        {transactions && transactions.length > 0 && (
          <div className="text-center mt-6">
            <button className="text-primary text-sm font-medium hover:underline" data-testid="button-view-all-transactions">
              View All Blockchain Transactions →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
