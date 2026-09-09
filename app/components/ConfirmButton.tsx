"use client";

export function ConfirmButton({
  confirmMessage,
  formAction,
  className,
  children,
}: {
  confirmMessage: string;
  formAction: (formData: FormData) => void;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      formAction={formAction}
      className={className}
      onClick={(event) => {
        if (!confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
