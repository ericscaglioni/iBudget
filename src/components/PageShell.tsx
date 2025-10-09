import { Button, ButtonProps } from "./ui";

interface PageShellActionButtonProps extends Omit<ButtonProps, "children"> {
  text: string;
}

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actionButton?: PageShellActionButtonProps;
};

export function PageShell({ title, subtitle, children, actionButton }: Props) {
  return (
    <div className="w-full px-3 sm:px-6 py-4 sm:py-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="text-gray-500 text-xs sm:text-sm mt-1">{subtitle}</p>
          )}
        </header>

        <section className="w-full">
          {actionButton && (
            <div className="flex justify-end mb-4 sm:mb-6">
              <Button
                {...actionButton}
              >
                {actionButton.text}
              </Button>
            </div>
          )}
          {children}
        </section>
      </div>
    </div>
  );
}