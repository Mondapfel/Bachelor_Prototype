import { Input } from "@/components/ui/input";
import { useQueryStore } from "@/hooks/useQueryStore";

export default function SearchInput() {
  const { query, setQuery } = useQueryStore();

  return (
    <Input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      type="text"
      className="h-10"
      placeholder="Suchen"
    />
  );
}

