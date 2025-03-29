
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Shield, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type UserRole = "user" | "admin";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  lastLogin?: Date;
}

const sampleUsers: AdminUser[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    status: "active",
    lastLogin: new Date(2025, 2, 20)
  },
  {
    id: "2",
    name: "Regular User",
    email: "user@example.com",
    role: "user",
    status: "active",
    lastLogin: new Date(2025, 2, 25)
  }
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>(sampleUsers);

  const toggleUserStatus = (userId: string) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, status: user.status === "active" ? "inactive" : "active" } 
          : user
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" /> User Management
        </CardTitle>
        <CardDescription>View and manage system users</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <Button variant="outline" size="sm">
            Filter Users
          </Button>
          <Button size="sm">Add New User</Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.role === "admin" ? (
                    <Badge variant="default" className="bg-court-green">
                      <Shield className="h-3 w-3 mr-1" /> Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline">User</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.status === "active" ? (
                    <Badge variant="outline" className="text-green-600 border-green-600 flex items-center gap-1">
                      <BadgeCheck className="h-3 w-3" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.lastLogin ? user.lastLogin.toLocaleDateString() : "Never"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleUserStatus(user.id)}
                  >
                    {user.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
