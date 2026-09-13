import { IngredientsDetail } from "@/components/ingredients/detail/ingredients-detail";

export default async function Home({ params }) {
  let { id: ingredientId } = await params;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col">
      <IngredientsDetail ingredientId={ingredientId} />
    </div>
  );
}
