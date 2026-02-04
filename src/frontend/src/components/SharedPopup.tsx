/**
 * Shared popup/dialog wrapper component that enforces consistent behavior across the app.
 * Composes shadcn Dialog primitives without modifying read-only UI component files.
 */

import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { useTranslation } from '../i18n/I18nContext';

interface SharedPopupProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * SharedPopup provides consistent sizing, scroll behavior, close behavior,
 * and RTL-aware layout for all dialogs across the app.
 */
export function SharedPopup({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
}: SharedPopupProps) {
  const { direction } = useTranslation();
  const isRTL = direction === 'rtl';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent 
        className="max-w-[90vw] w-full sm:max-w-2xl max-h-[85vh] flex flex-col"
        dir={direction}
      >
        <DialogHeader className={isRTL ? 'text-right' : 'text-left'}>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">{children}</div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
