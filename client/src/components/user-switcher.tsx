import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface UserOption {
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
}

export function UserSwitcher() {
  const { user } = useAuth();
  
  // In development, show user switching options
  const userOptions: UserOption[] = [
    {
      email: "professortrex1995@gmail.com",
      firstName: "Trexie",
      lastName: "Olaya",
      isAdmin: false,
    },
    {
      email: "mtrexiaolaya@gmail.com", 
      firstName: "Trexia",
      lastName: "Olaya",
      isAdmin: false,
    },
    {
      email: "admin@test.com",
      firstName: "Admin",
      lastName: "User",
      isAdmin: true,
    },
  ];

  const switchUser = (email: string) => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('testUser', email);
    window.location.href = currentUrl.toString();
  };

  const logout = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('testUser');
    currentUrl.pathname = '/login';
    window.location.href = currentUrl.toString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">
            {user?.firstName} {user?.lastName}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5 text-sm font-medium">
          Current: {user?.email}
        </div>
        <DropdownMenuSeparator />
        {userOptions.map((option) => (
          <DropdownMenuItem
            key={option.email}
            onClick={() => switchUser(option.email)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">
                {option.firstName} {option.lastName}
              </span>
              <span className="text-xs text-gray-500">{option.email}</span>
            </div>
            {option.isAdmin && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Admin
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-red-600">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}