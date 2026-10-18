import CatalogImage from './CatalogImage';
export default function ArtistImage({ artist, detail = false }) {
  return <CatalogImage item={artist} kind="artists" detail={detail} />;
}
