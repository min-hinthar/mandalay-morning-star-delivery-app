import { ErrorPageShell, ErrorMascot, NavigationCardGrid } from "@/components/ui/error-pages";

export default function DriverNotFound() {
  return (
    <ErrorPageShell>
      <ErrorMascot errorType="not-found" />
      <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-inverse mb-2 text-center">
        This dish got lost in delivery!
      </h1>
      <p className="text-base text-text-inverse/80 mb-8 text-center max-w-md">
        The page you ordered is nowhere on the menu. Try one of these instead.
      </p>
      <NavigationCardGrid portal="driver" />
    </ErrorPageShell>
  );
}
