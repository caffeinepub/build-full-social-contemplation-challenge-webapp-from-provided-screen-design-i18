export interface Section {
  heading?: string;
  content: string;
}

interface PopupBodySectionsProps {
  sections: Section[];
}

/**
 * Renders popup body content with bold section headings and paragraph text.
 * Supports splitting content based on PDF underscore separators while maintaining
 * scroll behavior provided by SharedPopup.
 */
export function PopupBodySections({ sections }: PopupBodySectionsProps) {
  return (
    <div className="space-y-4 text-sm">
      {sections.map((section, index) => (
        <div key={index}>
          {section.heading && (
            <h4 className="font-bold mb-2 leading-relaxed">{section.heading}</h4>
          )}
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {section.content}
          </p>
        </div>
      ))}
    </div>
  );
}
