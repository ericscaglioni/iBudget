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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-slate-900">{title}</h1>
              {subtitle && (
                <p className="text-gray-500 text-xs sm:text-sm mt-1">{subtitle}</p>
              )}
            </div>
            {actionButton && (
              <div className="flex justify-center sm:justify-end">
                <Button
                  {...actionButton}
                  className="w-full sm:w-auto"
                >
                  {actionButton.text}
                </Button>
              </div>
            )}
          </div>
        </header>

        <section className="w-full">
          {children}
        </section>
      </div>
    </div>
  );
}