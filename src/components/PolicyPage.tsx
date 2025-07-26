import { useParams, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading";
import { usePolicyPage } from "@/hooks/usePolicyPages";
import { ArrowLeft, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import DOMPurify from 'dompurify';

export function PolicyPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: policyPage, isLoading, error } = usePolicyPage(slug || "");

  // Sanitize HTML content to prevent XSS attacks
  const getSanitizedContent = (content: string) => {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'br', 'a', 'div', 'span'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      ADD_ATTR: ['target', 'rel'],
      ADD_TAGS: ['div', 'span'],
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input'],
      FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onfocus', 'onblur']
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !policyPage) {
    return <Navigate to="/404" replace />;
  }

  if (!policyPage.is_published) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {policyPage.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                <span>Last updated: {new Date(policyPage.updated_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>Version {policyPage.version}</span>
              </div>
            </div>
          </div>

          {policyPage.meta_description && (
            <p className="text-lg text-muted-foreground">
              {policyPage.meta_description}
            </p>
          )}
        </div>

        <Separator className="mb-8" />

        {/* Content */}
        <Card>
          <CardContent className="p-8">
            <div 
              className="prose prose-slate max-w-none dark:prose-invert
                prose-headings:text-foreground prose-p:text-foreground 
                prose-li:text-foreground prose-strong:text-foreground
                prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                prose-h1:border-b prose-h1:pb-2 prose-h1:mb-4
                prose-h2:mt-8 prose-h2:mb-4 prose-h3:mt-6 prose-h3:mb-3
                prose-p:leading-relaxed prose-li:leading-relaxed
                prose-ul:my-4 prose-ol:my-4
                prose-a:text-primary hover:prose-a:text-primary/80"
              dangerouslySetInnerHTML={{ __html: getSanitizedContent(policyPage.content) }}
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            This policy was last updated on {new Date(policyPage.updated_at).toLocaleDateString()}.
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}