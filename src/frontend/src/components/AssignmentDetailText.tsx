/**
 * AssignmentDetailText component
 * 
 * Renders assignment detail text with bold step headings (Step 1:, Step 2:, Step 3:)
 * while keeping the rest of the text at normal weight.
 */

interface AssignmentDetailTextProps {
  content: string;
}

export function AssignmentDetailText({ content }: AssignmentDetailTextProps) {
  // Split content into lines
  const lines = content.split('\n');
  
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {lines.map((line, index) => {
        // Check if line starts with "Step 1:", "Step 2:", or "Step 3:"
        const stepMatch = line.match(/^(Step \d+:)(.*)$/);
        
        if (stepMatch) {
          const [, stepLabel, restOfLine] = stepMatch;
          return (
            <div key={index}>
              <span className="font-bold">{stepLabel}</span>
              {restOfLine}
            </div>
          );
        }
        
        // Regular line - preserve empty lines for spacing
        return <div key={index}>{line || '\u00A0'}</div>;
      })}
    </div>
  );
}
