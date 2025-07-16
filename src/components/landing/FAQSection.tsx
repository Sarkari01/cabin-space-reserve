import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Search, MessageCircle } from "lucide-react";
import { useFAQ } from "@/hooks/useFAQ";

export const FAQSection = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { categories, items, loading } = useFAQ();

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const filteredItems = items.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedItems = categories.map(category => ({
    ...category,
    items: filteredItems.filter(item => item.category_id === category.id)
  })).filter(category => category.items.length > 0);

  if (loading) {
    return (
      <section id="faq" className="py-20 bg-gradient-to-br from-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading FAQs...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="faq" className="py-20 bg-gradient-to-br from-muted/20 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            FAQ
          </Badge>
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Find answers to common questions about our study spaces, booking process, and services.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 focus:border-primary/50 rounded-lg"
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {groupedItems.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No FAQs Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? `No FAQs match "${searchTerm}"` : "No FAQs available at the moment"}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedItems.map((category) => (
                <div key={category.id} className="space-y-4">
                  <h3 className="text-2xl font-bold text-foreground flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                    <span>{category.name}</span>
                  </h3>
                  {category.description && (
                    <p className="text-muted-foreground">{category.description}</p>
                  )}
                  
                  <div className="space-y-4">
                    {category.items.map((item) => {
                      const isExpanded = expandedItems.includes(item.id);
                      return (
                        <Card
                          key={item.id}
                          className="overflow-hidden transition-all duration-300 hover:shadow-lg border-2 hover:border-primary/30"
                        >
                          <CardHeader
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleExpanded(item.id)}
                          >
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg font-semibold text-left">
                                {item.question}
                              </CardTitle>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>
                          </CardHeader>
                          {isExpanded && (
                            <CardContent className="pt-0">
                              <div className="prose prose-sm max-w-none text-muted-foreground">
                                {item.answer.split('\n').map((paragraph, index) => (
                                  <p key={index} className="mb-3 last:mb-0">
                                    {paragraph}
                                  </p>
                                ))}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-primary/5 to-primary-glow/5 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">
              Our support team is here to help you with any questions or concerns.
            </p>
            <Button
              onClick={() => {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                  contactSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;