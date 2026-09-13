import { MenuDetail } from "@/components/menu/detail/menu-detail";

export default async function Home({ params }) {
  let { id: menuId } = await params;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col">
      <MenuDetail menuId={menuId} />
    </div>
  );
}
