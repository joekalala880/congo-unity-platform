import { resolveGalleryImage } from "../../pages/galleryLocalImages";

function GalleryCard({ item, onOpen }) {
  return (
    <button
      type="button"
      className="cg-card"
      onClick={() => onOpen(item)}
      aria-haspopup="dialog"
    >
      <img src={resolveGalleryImage(item)} alt={item.name} loading="lazy" />

      <div className="cg-card-body">
        <span className="cg-card-category">
          {item.category}
          {item.subcategory ? ` · ${item.subcategory}` : ""}
        </span>
        <h3>{item.name}</h3>
        <p>{item.shortDescription}</p>

        {item.publishedDate && (
          <span className="cg-card-date">{item.publishedDate}</span>
        )}
      </div>
    </button>
  );
}

export default GalleryCard;
