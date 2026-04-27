export const CATEGORY_MAP: Record<string, { label: string; icon: string; color: string }> = {
  transport: {
    label: "Transport",
    icon: "🚗",
    color: "#00a86b"
  },
  "food & meals": {
    label: "Food & Meals",
    icon: "🍔",
    color: "#f4a261"
  },
  office: {
    label: "Office",
    icon: "🏢",
    color: "#3f51b5"
  },
  software: {
    label: "Software",
    icon: "💻",
    color: "#9c27b0"
  },
  rent: {
    label: "Rent",
    icon: "🏠",
    color: "#ff5722"
  },
  marketing: {
    label: "Marketing",
    icon: "📢",
    color: "#00bcd4"
  },
  miscellaneous: {
    label: "Miscellaneous",
    icon: "📦",
    color: "#607d8b"
  }
};

const CUSTOM_CATEGORY_FALLBACK = {
  icon: "📝",
  color: "#64748b"
};

export function getCategoryConfig(categoryName: string | null | undefined): { label: string; icon: string; color: string } {
  if (!categoryName || categoryName.trim() === "") {
    return { label: "Uncategorized", icon: "❓", color: "#9e9e9e" };
  }

  const key = categoryName.toLowerCase().trim();
  const configured = CATEGORY_MAP[key];

  if (configured) {
    return configured;
  }

  return {
    label: categoryName,
    icon: CUSTOM_CATEGORY_FALLBACK.icon,
    color: CUSTOM_CATEGORY_FALLBACK.color
  };
}

export function getCategoryIcon(categoryName: string | null | undefined): string {
  return getCategoryConfig(categoryName).icon;
}

export function getCategoryColor(categoryName: string | null | undefined): string {
  return getCategoryConfig(categoryName).color;
}

export function getCategoryLabel(categoryName: string | null | undefined): string {
  return getCategoryConfig(categoryName).label;
}