import Link from "next/link";
import photos from "@/lib/shop/product-photos.json";
import { shopCatalog } from "@/lib/shop/catalog";

export default function ImageCredits() {
  return (
    <main className="photo-credits-page">
      <Link href="/shop" className="text-link">
        Back to the shop
      </Link>
      <h1>Photo credits</h1>
      <p>
        These photographs illustrate the kinds of products in our simulated
        catalog. Product names and prices belong to the demo; images may depict
        other brands or models.
      </p>
      <div className="photo-credit-list">
        {photos.map((photo) => (
          <article key={photo.sku}>
            <h2>{shopCatalog.find((p) => p.sku === photo.sku)?.name}</h2>
            <a href={photo.source} target="_blank" rel="noreferrer">
              {photo.sourceTitle}
            </a>
            {photo.creator !== "See source page" && <p>{photo.creator}</p>}
            {photo.license && (
              <p>
                {photo.licenseUrl ? (
                  <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
                    {photo.license}
                  </a>
                ) : (
                  photo.license
                )}
              </p>
            )}
            <small>
              {photo.modifications} Rights remain with the respective image
              owners.
            </small>
          </article>
        ))}
      </div>
    </main>
  );
}
