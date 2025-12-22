interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  size = "lg", 
  fullScreen = true 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-3 w-64",
    md: "h-4 w-80",
    lg: "h-5 w-96",
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 flex items-center justify-center z-50"
    : "flex items-center justify-center py-12";

  return (
    <div className={containerClasses}>
      <div className="neu-loader-wrapper">
        <div className={`neu-loader ${sizeClasses[size]}`}>
          <div className="neu-loader-bar"></div>
        </div>
      </div>
    </div>
  );
}

