export const ADMIN_PAGE_SIZE = 25;
export const CHATBOT_RECORD_LIMIT = 200;

export const pageRange = (page: number, pageSize = ADMIN_PAGE_SIZE) => {
  const from = page * pageSize;
  return { from, to: from + pageSize - 1 };
};
