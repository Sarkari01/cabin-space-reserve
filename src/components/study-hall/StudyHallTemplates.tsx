import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Copy, Save, Trash2, Plus, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudyHallTemplate {
  id: string;
  name: string;
  description: string;
  category: 'library' | 'classroom' | 'office' | 'cafe' | 'custom';
  totalSeats: number;
  amenities: string[];
  defaultPrice: number;
  layout: {
    rows: number;
    seatsPerRow: number;
  };
  popularityScore: number;
}

interface StudyHallTemplatesProps {
  onTemplateSelect: (template: StudyHallTemplate) => void;
  onSaveTemplate: (template: Omit<StudyHallTemplate, 'id' | 'popularityScore'>) => void;
  disabled?: boolean;
}

const predefinedTemplates: StudyHallTemplate[] = [
  {
    id: '1',
    name: 'Small Library Reading Room',
    description: 'Quiet study space perfect for focused reading and research',
    category: 'library',
    totalSeats: 24,
    amenities: ['wifi', 'printer'],
    defaultPrice: 1500,
    layout: { rows: 4, seatsPerRow: 6 },
    popularityScore: 85
  },
  {
    id: '2',
    name: 'Large Classroom Study Hall',
    description: 'Spacious environment suitable for group studies and lectures',
    category: 'classroom',
    totalSeats: 50,
    amenities: ['wifi', 'monitor', 'coffee'],
    defaultPrice: 2500,
    layout: { rows: 10, seatsPerRow: 5 },
    popularityScore: 92
  },
  {
    id: '3',
    name: 'Modern Co-working Space',
    description: 'Contemporary workspace with all modern amenities',
    category: 'office',
    totalSeats: 30,
    amenities: ['wifi', 'coffee', 'printer', 'monitor'],
    defaultPrice: 3000,
    layout: { rows: 5, seatsPerRow: 6 },
    popularityScore: 78
  },
  {
    id: '4',
    name: 'Cafe Study Corner',
    description: 'Casual study environment with refreshment facilities',
    category: 'cafe',
    totalSeats: 16,
    amenities: ['wifi', 'coffee'],
    defaultPrice: 1200,
    layout: { rows: 4, seatsPerRow: 4 },
    popularityScore: 71
  }
];

export function StudyHallTemplates({ 
  onTemplateSelect, 
  onSaveTemplate, 
  disabled = false 
}: StudyHallTemplatesProps) {
  const [templates, setTemplates] = useState<StudyHallTemplate[]>(predefinedTemplates);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'custom' as StudyHallTemplate['category'],
    totalSeats: 20,
    amenities: [] as string[],
    defaultPrice: 2000,
    layout: { rows: 4, seatsPerRow: 5 }
  });

  const { toast } = useToast();

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'library', label: 'Library' },
    { value: 'classroom', label: 'Classroom' },
    { value: 'office', label: 'Office' },
    { value: 'cafe', label: 'Cafe' },
    { value: 'custom', label: 'Custom' }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'library': return '📚';
      case 'classroom': return '🎓';
      case 'office': return '💼';
      case 'cafe': return '☕';
      default: return '🏢';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'library': return 'bg-blue-100 text-blue-800';
      case 'classroom': return 'bg-green-100 text-green-800';
      case 'office': return 'bg-purple-100 text-purple-800';
      case 'cafe': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTemplateSelect = (template: StudyHallTemplate) => {
    if (disabled) return;
    onTemplateSelect(template);
    toast({
      title: "Template Applied",
      description: `${template.name} has been applied to your study hall`,
    });
  };

  const handleSaveTemplate = () => {
    if (!newTemplate.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive",
      });
      return;
    }

    const template: StudyHallTemplate = {
      ...newTemplate,
      id: Date.now().toString(),
      popularityScore: 0
    };

    setTemplates([...templates, template]);
    onSaveTemplate(newTemplate);
    setSaveDialogOpen(false);
    setNewTemplate({
      name: '',
      description: '',
      category: 'custom',
      totalSeats: 20,
      amenities: [],
      defaultPrice: 2000,
      layout: { rows: 4, seatsPerRow: 5 }
    });

    toast({
      title: "Template Saved",
      description: "Your custom template has been saved successfully",
    });
  };

  const duplicateTemplate = (template: StudyHallTemplate) => {
    const duplicated: StudyHallTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      popularityScore: 0
    };
    setTemplates([...templates, duplicated]);
    toast({
      title: "Template Duplicated",
      description: "Template has been duplicated successfully",
    });
  };

  const deleteTemplate = (id: string) => {
    if (predefinedTemplates.find(t => t.id === id)) {
      toast({
        title: "Cannot Delete",
        description: "Predefined templates cannot be deleted",
        variant: "destructive",
      });
      return;
    }
    setTemplates(templates.filter(t => t.id !== id));
    toast({
      title: "Template Deleted",
      description: "Template has been deleted successfully",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Study Hall Templates
          </CardTitle>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 flex-wrap">
              {categories.map(cat => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSaveDialogOpen(true)}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(template.category)}</span>
                        <h3 className="font-semibold text-sm">{template.name}</h3>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs mt-1 ${getCategoryColor(template.category)}`}
                      >
                        {template.category}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => duplicateTemplate(template)}
                        disabled={disabled}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {!predefinedTemplates.find(t => t.id === template.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteTemplate(template.id)}
                          disabled={disabled}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Seats:</span>
                      <span className="font-medium">{template.totalSeats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Layout:</span>
                      <span className="font-medium">{template.layout.rows}×{template.layout.seatsPerRow}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-medium">₹{template.defaultPrice}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {template.amenities.slice(0, 3).map(amenity => (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                      {template.amenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.amenities.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    className="w-full mt-3"
                    size="sm"
                    onClick={() => handleTemplateSelect(template)}
                    disabled={disabled}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Save current study hall configuration as a reusable template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="e.g., My Custom Study Hall"
              />
            </div>
            <div>
              <Label htmlFor="templateDescription">Description</Label>
              <Textarea
                id="templateDescription"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Brief description of this template"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}