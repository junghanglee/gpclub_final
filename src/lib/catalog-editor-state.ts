import type { CatalogTemplate } from "./catalog-templates.ts";

type CatalogEditorState = { template: CatalogTemplate; product_ids: string[] };

export function selectCatalogTemplate<T extends CatalogEditorState>(
  state: T,
  template: CatalogTemplate,
): T {
  return { ...state, template };
}

export function toggleCatalogProduct<T extends CatalogEditorState>(
  state: T,
  productId: string,
  checked: boolean,
): T {
  return {
    ...state,
    product_ids: checked
      ? Array.from(new Set([...state.product_ids, productId]))
      : state.product_ids.filter((id) => id !== productId),
  };
}
