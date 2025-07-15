import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, Phone, MapPin, Settings, Trash2 } from 'lucide-react';
import { useIncharges } from '@/hooks/useIncharges';
import { useStudyHalls } from '@/hooks/useStudyHalls';
import { InchargeModal } from './InchargeModal';
import { InchargeActivityLog } from './InchargeActivityLog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export const InchargeManagementTab = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncharge, setSelectedIncharge] = useState<any>(null);
  const { incharges, loading, deleteIncharge, activateIncharge, suspendIncharge } = useIncharges();
  const { studyHalls } = useStudyHalls();

  const getStudyHallNames = (assignedHalls: any) => {
    const hallsArray = Array.isArray(assignedHalls) ? assignedHalls : [];
    if (hallsArray.length === 0) return 'No study halls assigned';
    
    const names = hallsArray.map((hallId: string) => {
      const hall = studyHalls.find(h => h.id === hallId);
      return hall?.name || 'Unknown Hall';
    });
    
    return names.join(', ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'suspended':
        return 'bg-destructive text-destructive-foreground';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleEdit = (incharge: any) => {
    setSelectedIncharge(incharge);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedIncharge(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteIncharge(id);
  };

  const handleStatusChange = async (id: string, currentStatus: string) => {
    if (currentStatus === 'active') {
      await suspendIncharge(id);
    } else {
      await activateIncharge(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Incharge Management</h2>
          <p className="text-muted-foreground">
            Create and manage incharges to help run your study halls
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Incharge
        </Button>
      </div>

      <Tabs defaultValue="incharges" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incharges">Incharges</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="incharges" className="space-y-4">
          {incharges.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No incharges yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Create your first incharge to help manage your study halls and handle daily operations.
                  </p>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Incharge
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {incharges.map((incharge) => (
                <Card key={incharge.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{incharge.full_name}</CardTitle>
                        <Badge className={`mt-1 ${getStatusColor(incharge.status)}`}>
                          {incharge.status}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(incharge)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Incharge</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {incharge.full_name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(incharge.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2" />
                      {incharge.email}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      {incharge.mobile}
                    </div>
                    <div className="flex items-start text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">
                        {getStudyHallNames(incharge.assigned_study_halls)}
                      </span>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Button
                        variant={incharge.status === 'active' ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleStatusChange(incharge.id, incharge.status)}
                        className="flex-1"
                      >
                        {incharge.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                    </div>
                    {!incharge.account_activated && (
                      <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        Invitation pending
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <InchargeActivityLog />
        </TabsContent>
      </Tabs>

      <InchargeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        incharge={selectedIncharge}
      />
    </div>
  );
};