import Image from "next/image";
import photoPaths from "@/lib/shop/product-image-paths.json";

export function ProductArt({
  sku,
  name,
  category,
}: {
  sku: string;
  name: string;
  category?: string;
}) {
  return (
    <div
      className={`product-art product-photo art-${category?.toLowerCase() ?? "desk"}`}
    >
      <Image
        src={photoPaths[sku as keyof typeof photoPaths]}
        alt={name}
        fill
        sizes="(max-width: 700px) 46vw, (max-width: 1200px) 30vw, 380px"
        className="product-photo-image"
      />
    </div>
  );
}
