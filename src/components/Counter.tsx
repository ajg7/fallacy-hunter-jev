import { Button } from "@/components/ui/button";
import { useCounterStore } from "@/stores/counter-store";

export function Counter() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);

  return (
    <Button type="button" onClick={increment}>
      Count is {count}
    </Button>
  );
}
