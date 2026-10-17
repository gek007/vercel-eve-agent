import {
  Headphones,
  Speaker,
  Keyboard,
  LampDesk,
  BatteryCharging,
  Backpack,
  Laptop,
  Mouse,
} from "lucide-react";
const icons = {
  headphones: Headphones,
  speaker: Speaker,
  keyboard: Keyboard,
  lamp: LampDesk,
  charger: BatteryCharging,
  bag: Backpack,
  stand: Laptop,
  mouse: Mouse,
};
export function ProductArt({
  visual,
  category,
}: {
  visual: string;
  category?: string;
}) {
  const Icon = icons[visual as keyof typeof icons] ?? Laptop;
  return (
    <div
      className={`product-art art-${category?.toLowerCase() ?? "desk"}`}
      aria-hidden="true"
    >
      <span className="product-art-base" />
      <Icon strokeWidth={1.15} />
    </div>
  );
}
