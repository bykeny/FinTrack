import * as LucideIcons from "lucide-react";

interface IconRendererProps {
  name: string;
  size?: number;
  className?: string;
}

export function IconRenderer({ name, size = 24, className = "" }: IconRendererProps) {
  // Convert kebab-case or snake_case to PascalCase for lucide-react (e.g. "shopping-cart" -> "ShoppingCart")
  const formattedName = name
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  const IconComponent = (LucideIcons as any)[formattedName];

  if (!IconComponent) {
    // Fallback icon if the requested one doesn't exist
    const Fallback = LucideIcons.HelpCircle;
    return <Fallback size={size} className={className} />;
  }

  return <IconComponent size={size} className={className} />;
}
