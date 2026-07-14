import { forwardRef, type InputHTMLAttributes } from 'react';
import { HiOutlineCheck } from 'react-icons/hi2';
import { cn } from '../../lib/utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, checked, ...props }, ref) => {
  return (
    <label className={cn("inline-flex items-center cursor-pointer", className)}>
      <span className={`flex items-center justify-center w-4.5 h-4.5 rounded-md border-2 transition-all ${checked ? 'bg-primary border-primary' : 'border-muted-foreground/40 bg-background hover:border-primary/50'}`}>
        {checked && <HiOutlineCheck size={12} className="text-white" strokeWidth={3} />}
      </span>
      <input ref={ref} type="checkbox" checked={checked} className="sr-only" {...props} />
    </label>
  );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
